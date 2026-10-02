// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import i18n from "@/i18n";
import { CurrentReleaseNotice } from "./current-release-notice";
import changelog from "../../changelog.json";
import tauriConfig from "../../src-tauri/tauri.conf.json";

afterEach(async () => { await i18n.changeLanguage("en"); });

it("shows the current version's dated main fix in Chinese", async () => {
  await i18n.changeLanguage("zh");
  render(<CurrentReleaseNotice />);
  const notice = screen.getByRole("region", { name: "最近更新" });
  expect(notice).toHaveTextContent(`v${tauriConfig.version}`);
  expect(notice).toHaveTextContent("解决了自动更新发现延迟的问题");
  expect(notice).toHaveTextContent("5 分钟");
  expect(notice).toHaveTextContent("UTC+8");
  expect(notice.querySelector("time")).toHaveAttribute("datetime", changelog["3.8.6"].releasedAt);
});

it("selects a localized summary instead of exposing release JSON", async () => {
  await i18n.changeLanguage("en");
  render(<CurrentReleaseNotice />);
  const notice = screen.getByRole("region", { name: "Recent update" });
  expect(notice).toHaveTextContent("Reduce automatic update detection delays");
  expect(notice).not.toHaveTextContent("releasedAt");
});
