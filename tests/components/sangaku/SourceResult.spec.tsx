import { test, expect } from "@/tests/fixtures.ct";
import SourceResult from "@/app/ui/sangaku/SourceResult";

// runSource は @/app/lib/actions/sangaku ごと playwright-ct.config.ts の Vite alias で
// tests/__mocks__/actions/sangaku.ts に差し替えられる。遅延・reject・結果に source を
// 含めるかは、hooksConfig（playwright/index.tsx）から設定する。

const fixedInputs = ["input_1"];

test.describe("SourceResult", () => {
  test("should allow me to see the results of running the source", async ({
    mount,
  }) => {
    const component = await mount(
      <SourceResult source="puts 1" fixedInputs={fixedInputs} />,
    );

    await expect(component.getByLabel("result-1")).toHaveText("mock output");
  });

  test("should allow me to see a loading indicator instead of the results while the source is running", async ({
    mount,
  }) => {
    const component = await mount(
      <SourceResult source="puts 1" fixedInputs={fixedInputs} />,
      { hooksConfig: { runSourceDelaysMs: [1_000] } },
    );

    await expect(component.getByRole("progressbar")).toBeVisible();
    await expect(component.getByLabel("result-1")).toHaveCount(0);
    await expect(component.getByLabel("result-1")).toHaveText("mock output");
    await expect(component.getByRole("progressbar")).toHaveCount(0);
  });

  test("should allow me to see the error message when running the source fails", async ({
    mount,
  }) => {
    const component = await mount(
      <SourceResult source="puts 1" fixedInputs={fixedInputs} />,
      { hooksConfig: { runSourceRejectCount: 1 } },
    );

    await expect(component.getByLabel("result-1")).toHaveText("mock reject");
  });

  test("should not allow me to see the results of the previous source while the new source is running", async ({
    mount,
  }) => {
    const component = await mount(
      <SourceResult source="a" fixedInputs={fixedInputs} />,
      { hooksConfig: { runSourceEchoSource: true, runSourceDelaysMs: [0, 800] } },
    );
    await expect(component.getByLabel("result-1")).toHaveText("output of a");

    await component.update(
      <SourceResult source="b" fixedInputs={fixedInputs} />,
    );

    await expect(component.getByRole("progressbar")).toBeVisible();
    await expect(component.getByText("output of a")).toHaveCount(0);
    await expect(component.getByLabel("result-1")).toHaveText("output of b");
  });

  // 古い入力の実行が、新しい入力の実行より後に終わっても、結果を上書きしない。
  // 「上書きされない」という起きないことの確認なので、古い実行が終わるまでの時間を固定で置く。
  test("should not allow me to see the results of the previous source when it finishes after the new source", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SourceResult source="a" fixedInputs={fixedInputs} />,
      {
        hooksConfig: { runSourceEchoSource: true, runSourceDelaysMs: [1_500, 0] },
      },
    );

    await component.update(
      <SourceResult source="b" fixedInputs={fixedInputs} />,
    );
    await expect(component.getByLabel("result-1")).toHaveText("output of b");
    await page.waitForTimeout(2_000);

    await expect(component.getByLabel("result-1")).toHaveText("output of b");
  });
});
