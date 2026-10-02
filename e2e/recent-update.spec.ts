import { $, browser, expect } from "@wdio/globals";

describe("Dashboard recent update", () => {
  it("prominently shows the update-check fix, interval, version, and update time", async () => {
    const dashboard = $("button=仪表盘");
    await dashboard.waitForClickable({ timeout: 30_000 });
    await dashboard.click();
    const notice = $('[data-testid="current-release-notice"]');
    await notice.waitForDisplayed({ timeout: 30_000 });
    const text = await notice.getText();
    expect(text).toContain("3.8.6");
    expect(text).toContain("自动更新");
    expect(text).toContain("5 分钟");
    expect(text).toContain("2026-10-02");
    expect(text).toContain("UTC+8");
    expect(await notice.$("time").getAttribute("datetime")).toBeTruthy();
    await browser.saveScreenshot("./src-tauri/target/recent-update.png");
  });
});
