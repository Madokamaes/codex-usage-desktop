import { $, browser, expect } from "@wdio/globals";

describe("Fork automatic updates", () => {
  before(async () => {
    // Clear simulated releases left by interrupted runs before bootstrapping the app.
    await browser.execute(() => {
      for (const key of ["last_update_check_result", "last_update_check_time", "last_update_check_failed_time", "last_update_install_failed_time", "dismissed_update_tag"]) {
        localStorage.removeItem(key);
      }
    });
    await browser.refresh();
  });

  it("enables native update checks and explains automatic installation", async () => {
    const result = await browser.execute(async () => {
      try {
        return await (window as any).__TAURI_INTERNALS__.invoke("check_for_updates");
      } catch (error) {
        return String(error);
      }
    });
    // Before the first release exists, the real manifest request returns 404.
    if (typeof result === "string") {
      expect(result).toContain("Update manifest");
    } else {
      expect(result).toHaveProperty("hasUpdate");
    }
    await $('[data-testid="settings-nav-tab"]').waitForClickable({ timeout: 30_000 });
    await $('[data-testid="settings-nav-tab"]').click();
    const check = $('[data-testid="check-upstream-updates"]');
    await check.waitForExist({ timeout: 30_000 });
    await expect(check).toBeEnabled();
    expect(await $('body').getText()).toContain("自动重启");
  }).timeout(180_000);

  it("automatically installs and restarts after discovering an update", async () => {
    // Intercept update actions to avoid replacing/closing the native test application.
    // The real command path is exercised above; rendering and all other IPC stay native.
    await browser.execute(() => {
      const fetch = window.fetch.bind(window);
      (window as any).__updateCalls = [];
      localStorage.removeItem("last_update_install_failed_time");
      // Tauri's invoke property is immutable. Stub the IPC HTTP response instead.
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const command = String(input).split("/").pop();
        let result: unknown;
        if (command === "check_for_updates") result = {
          hasUpdate: true, currentVersion: "3.8.4", latestVersion: "9.0.0", latestTag: "app-v9.0.0",
          releaseName: "Fork update", releaseNotes: "分账号会话额度统计",
          releaseUrl: "https://github.com/Madokamaes/codex-usage-desktop/releases/tag/app-v9.0.0",
        };
        else if (command === "download_and_install_update" || command === "restart_app") {
          (window as any).__updateCalls.push(command);
          result = command === "restart_app" ? null : { version: "9.0.0" };
        } else return fetch(input, init);
        return Promise.resolve(new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", "Tauri-Response": "ok" },
        }));
      };
    });
    await $('[data-testid="check-upstream-updates"]').click();
    await browser.waitUntil(async () => {
      return await browser.execute(() => (window as any).__updateCalls.includes("restart_app"));
    }, { timeout: 30_000, timeoutMsg: "Update did not automatically request restart" });
    expect(await browser.execute(() => (window as any).__updateCalls)).toEqual([
      "download_and_install_update", "restart_app",
    ]);
    expect(await browser.execute(() => localStorage.getItem("last_update_check_result"))).toBeNull();
  }).timeout(180_000);
});
