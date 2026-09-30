import { expect, it } from "vitest";
import { UPDATE_REPOSITORY } from "./build-policy";
import config from "../../src-tauri/tauri.conf.json";
it("only installs signed updates from this fork's public release channel", () => {
  expect(config.plugins.updater.endpoints).toEqual([
    `https://github.com/${UPDATE_REPOSITORY}/releases/latest/download/latest.json`,
  ]);
  expect(config.bundle.createUpdaterArtifacts).toBe(true);
  expect(config.plugins.updater.windows.installMode).toBe("quiet");
});
