import { expect, it } from "vitest";
import { UPSTREAM_UPDATES_ENABLED } from "./build-policy";
import config from "../../src-tauri/tauri.conf.json";
it("personal build cannot discover an upstream update feed", () => {
  expect(UPSTREAM_UPDATES_ENABLED).toBe(false);
  expect(config.plugins.updater.endpoints).toEqual([]);
  expect(config.bundle.createUpdaterArtifacts).toBe(false);
});
