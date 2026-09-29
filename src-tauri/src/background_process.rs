use std::{ffi::OsStr, process::Command};

pub fn command(program: impl AsRef<OsStr>) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)] {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    command
}

// Keep this handle alive for the lifetime of the application. Windows releases
// it on exit, including crashes, so there is no stale lock file to clean up.
#[cfg(windows)]
pub fn acquire_instance() -> bool {
    use std::sync::OnceLock;
    static INSTANCE: OnceLock<usize> = OnceLock::new();
    #[link(name = "kernel32")]
    extern "system" {
        fn CreateMutexW(attributes: *const std::ffi::c_void, owner: i32, name: *const u16) -> *mut std::ffi::c_void;
        fn GetLastError() -> u32;
        fn CloseHandle(handle: *mut std::ffi::c_void) -> i32;
    }
    let name: Vec<u16> = "Local\\CodexUsageDesktopPersonal".encode_utf16().chain(Some(0)).collect();
    unsafe {
        let handle = CreateMutexW(std::ptr::null(), 0, name.as_ptr());
        if handle.is_null() { return false; }
        if GetLastError() == 183 { CloseHandle(handle); return false; }
        let _ = INSTANCE.set(handle as usize);
        true
    }
}
