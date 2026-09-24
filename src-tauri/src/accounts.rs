use serde_json::Value;
use std::{fs, path::Path};

pub const UNKNOWN_ACCOUNT_ID: &str = "__unknown__";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CurrentAccount {
    pub id: String,
    pub label: String,
}

pub fn load_current_account(codex_home: &Path) -> Option<CurrentAccount> {
    let content = fs::read_to_string(codex_home.join("auth.json")).ok()?;
    parse_current_account(&content)
}

fn parse_current_account(content: &str) -> Option<CurrentAccount> {
    let value = serde_json::from_str::<Value>(content).ok()?;
    let tokens = value.get("tokens")?;
    let id = string_field(tokens, "account_id").or_else(|| string_field(tokens, "accountId"))?;
    let token = string_field(tokens, "id_token")
        .or_else(|| string_field(tokens, "idToken"))
        .or_else(|| string_field(tokens, "access_token"))
        .or_else(|| string_field(tokens, "accessToken"));
    let label = token
        .as_deref()
        .and_then(email_from_jwt)
        .unwrap_or_else(|| id.clone());
    Some(CurrentAccount { id, label })
}

fn email_from_jwt(token: &str) -> Option<String> {
    let payload = token.split('.').nth(1)?;
    let decoded = base64url_decode(payload)?;
    let value = serde_json::from_slice::<Value>(&decoded).ok()?;
    value
        .get("email")
        .or_else(|| {
            value
                .get("https://api.openai.com/profile")
                .and_then(|profile| profile.get("email"))
        })
        .or_else(|| {
            value
                .get("https://api.openai.com/auth")
                .and_then(|auth| auth.get("email"))
        })
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|email| !email.is_empty())
        .map(str::to_string)
}

fn string_field(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn base64url_decode(input: &str) -> Option<Vec<u8>> {
    let mut normalized = input.replace('-', "+").replace('_', "/");
    let remainder = normalized.len() % 4;
    if remainder > 0 {
        normalized.push_str(&"===="[remainder..]);
    }

    let alphabet = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut table = [255u8; 256];
    for (index, byte) in alphabet.iter().enumerate() {
        table[*byte as usize] = index as u8;
    }

    let bytes = normalized.as_bytes();
    if bytes.len() % 4 != 0 {
        return None;
    }
    let mut decoded = Vec::with_capacity(bytes.len() / 4 * 3);
    for chunk in bytes.chunks_exact(4) {
        let mut values = [0u8; 4];
        let mut padding = 0;
        for (index, byte) in chunk.iter().enumerate() {
            if *byte == b'=' {
                padding += 1;
                values[index] = 0;
            } else {
                let value = table[*byte as usize];
                if value == 255 {
                    return None;
                }
                values[index] = value;
            }
        }
        decoded.push((values[0] << 2) | (values[1] >> 4));
        if padding < 2 {
            decoded.push((values[1] << 4) | (values[2] >> 2));
        }
        if padding < 1 {
            decoded.push((values[2] << 6) | values[3]);
        }
    }
    Some(decoded)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_account_id_and_email_without_retaining_tokens() {
        let auth = r#"{
          "tokens": {
            "account_id": "account-123",
            "id_token": "x.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn19.x",
            "access_token": "secret"
          }
        }"#;

        assert_eq!(
            parse_current_account(auth),
            Some(CurrentAccount {
                id: "account-123".to_string(),
                label: "user@example.com".to_string(),
            })
        );
    }

    #[test]
    fn falls_back_to_account_id_when_email_is_unavailable() {
        let auth = r#"{"tokens":{"accountId":"account-456","accessToken":"opaque"}}"#;

        assert_eq!(parse_current_account(auth).unwrap().label, "account-456");
    }

    #[test]
    fn reads_email_from_the_id_token_root_claim() {
        let auth = r#"{
          "tokens": {
            "account_id": "account-789",
            "id_token": "x.eyJlbWFpbCI6InJvb3RAZXhhbXBsZS5jb20ifQ.x"
          }
        }"#;

        assert_eq!(
            parse_current_account(auth).unwrap().label,
            "root@example.com"
        );
    }
}
