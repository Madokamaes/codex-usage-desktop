import { $, browser, expect } from "@wdio/globals";

describe("Personal build update safety", () => {
  it("rejects update checks and installation in the native backend", async () => {
    const results = await browser.execute(async () => {
      const api = (window as any).__TAURI_INTERNALS__;
      const results: string[] = [];
      for (const command of ["check_for_updates", "download_and_install_update"]) {
        try { await api.invoke(command); results.push("unexpected success"); }
        catch (error) { results.push(String(error)); }
      }
      return results;
    });
    expect(results[0]).toContain("个人修改版已关闭");
    expect(results[1]).toContain("个人修改版禁止");
  });
  it("disables the update button and removes an old cached notification", async () => {
    await browser.execute(() => {
      localStorage.setItem("last_update_check_result", JSON.stringify({hasUpdate: true, latestTag: "v999.0.0", currentVersion: "3.6.0", latestVersion: "999.0.0"}));
      localStorage.setItem("last_update_check_time", String(Date.now()));
    });
    await browser.refresh();
    await $('[data-testid="settings-nav-tab"]').waitForClickable({timeout: 30000});
    await $('[data-testid="settings-nav-tab"]').click();
    const button = $('[data-testid="check-upstream-updates"]');
    await button.waitForExist({timeout: 30000});
    await expect(button).toBeDisabled();
    expect(await button.getText()).toBe("官方更新已关闭");
    await browser.waitUntil(async () => (await browser.execute(() => localStorage.getItem("last_update_check_result"))) === null);
  });
});
