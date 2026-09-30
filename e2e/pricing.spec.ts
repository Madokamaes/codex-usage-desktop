import { $, browser, expect } from "@wdio/globals";

describe("GPT-6.1 Sol pricing", () => {
  it("returns standard API rates from the native pricing catalog", async () => {
    const entry = await browser.execute(async () => {
      const catalog = await (window as any).__TAURI_INTERNALS__.invoke("fetch_model_pricing_catalog");
      return catalog.models.find((model: any) => model.model === "gpt-6.1-sol");
    });

    expect(entry).toMatchObject({
      provider: "openai",
      pricingStatus: "priced",
      inputCostPerMillionTokens: 2,
      outputCostPerMillionTokens: 10,
    });
    expect(entry.cachedInputCostPerMillionTokens).toBeCloseTo(0.1, 10);
  });

  it("shows GPT-6.1 Sol prices in the catalog", async () => {
    await $('[data-testid="models-nav-tab"]').waitForClickable({ timeout: 30_000 });
    await $('[data-testid="models-nav-tab"]').click();
    await $('[data-testid="models-catalog-tab"]').click();
    const search = $('[data-testid="pricing-search"]');
    await search.waitForDisplayed({ timeout: 15_000 });
    await search.setValue("gpt-6.1-sol");
    const row = $('tr*=gpt-6.1-sol');
    await row.waitForDisplayed();
    const text = await row.getText();
    expect(text).toContain("gpt-6.1-sol");
    expect(text).toContain("$2.00");
    expect(text).toContain("$0.10");
    expect(text).toContain("$10.00");
  }).timeout(180_000);
});
