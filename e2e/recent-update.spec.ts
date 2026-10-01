import { $, browser, expect } from "@wdio/globals";

describe("Dashboard recent update", () => {
  it("prominently shows the Fast fix, multiplier, version, and update time", async () => {
    const notice = $('[data-testid="current-release-notice"]');
    await notice.waitForDisplayed({ timeout: 30_000 });
    const text = await notice.getText();
    expect(text).toContain("3.8.5");
    expect(text).toContain("Fast");
    expect(text).toContain("2.5");
    expect(text).toContain("2026-10-02");
    expect(text).toContain("UTC+8");
    expect(await notice.$("time").getAttribute("datetime")).toBeTruthy();
    await browser.saveScreenshot("./src-tauri/target/recent-update.png");
  });
});
