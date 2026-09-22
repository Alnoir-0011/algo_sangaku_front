import { test, expect } from "@/tests/fixtures.ct";
import AdminSangakuForm from "@/app/ui/admin/AdminSangakuForm";

const sangaku = {
  id: "1",
  type: "sangaku" as const,
  attributes: {
    title: "テスト算額",
    difficulty: "easy" as const,
    created_at: "2026-01-01T00:00:00.000+09:00",
    user_name: "test_user",
    shrine_name: "test_shrine",
    description: "テスト説明文",
    source: "print('hello')",
  },
};

test.describe("AdminSangakuForm", () => {
  test("should allow me to see pre-filled title with existing sangaku data", async ({ mount }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("タイトル")).toHaveValue("テスト算額");
  });

  test("should allow me to see difficulty select with current value", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByRole("combobox")).toHaveValue("easy");
  });

  test("should allow me to see pre-filled description with existing sangaku data", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("説明文")).toHaveValue("テスト説明文");
  });

  test("should allow me to see pre-filled source with existing sangaku data", async ({
    mount,
  }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByLabel("想定回答")).toHaveValue("print('hello')");
  });

  test("should allow me to see update button", async ({ mount }) => {
    const component = await mount(<AdminSangakuForm sangaku={sangaku} />);
    await expect(component.getByRole("button", { name: "更新" })).toBeVisible();
  });

  test("should allow me to see pre-filled source when kind is code", async ({
    mount,
  }) => {
    const sangakuCodeKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "code" as const,
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuCodeKind} />,
    );
    await expect(component.getByLabel("想定回答")).toHaveValue(
      "print('hello')",
    );
  });

  test("should not allow me to see source field when kind is reorder", async ({
    mount,
  }) => {
    const sangakuReorderKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "reorder" as const,
        code_blocks: [{ id: 1, content: "puts 1", correct_position: 0 }],
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuReorderKind} />,
    );
    await expect(component.getByLabel("想定回答")).not.toBeVisible();
  });

  test("should allow me to edit code blocks with CodeBlockEditor when kind is reorder", async ({
    mount,
  }) => {
    const sangakuReorderKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "reorder" as const,
        code_blocks: [{ id: 1, content: "puts 1", correct_position: 0 }],
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuReorderKind} />,
    );
    await expect(component.getByLabel("block-content-0")).toHaveValue(
      "puts 1",
    );
  });

  test("should allow me to pass code_blocks derived from CodeBlockEditor to updateSangaku when kind is reorder", async ({
    mount,
    page,
  }) => {
    // back（ReorderSangaku#code_blocks_composition）は正解ブロック2個未満を
    // 400 で弾くため、更新ボタンをクリックできる状態にするには正解ブロックが
    // 2個以上必要（AdminSangakuForm.tsx の canSubmitReorderBlocks ガード）。
    const sangakuReorderKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "reorder" as const,
        code_blocks: [
          { id: 1, content: "puts 1", correct_position: 0 },
          { id: 2, content: "puts 2", correct_position: 0 },
        ],
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuReorderKind} />,
    );

    await component.getByRole("button", { name: "更新" }).click();

    await expect
      .poll(() =>
        page.evaluate(() => window.__updateSangakuCalls?.length ?? 0),
      )
      .toBeGreaterThan(0);
    const calls = await page.evaluate(() => window.__updateSangakuCalls);
    const lastCall = calls?.[calls.length - 1];
    expect(lastCall?.codeBlocks).toEqual([
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: 2 },
    ]);
  });

  test("should allow me to pass source to updateSangaku when kind is code", async ({
    mount,
    page,
  }) => {
    const sangakuCodeKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "code" as const,
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuCodeKind} />,
    );

    await component.getByRole("button", { name: "更新" }).click();

    await expect
      .poll(() =>
        page.evaluate(() => window.__updateSangakuCalls?.length ?? 0),
      )
      .toBeGreaterThan(0);
    const calls = await page.evaluate(() => window.__updateSangakuCalls);
    const lastCall = calls?.[calls.length - 1];
    expect(lastCall?.formData.source).toBe("print('hello')");
  });

  test("should not allow me to pass code_blocks to updateSangaku when kind is code", async ({
    mount,
    page,
  }) => {
    const sangakuCodeKind = {
      ...sangaku,
      attributes: {
        ...sangaku.attributes,
        kind: "code" as const,
      },
    };
    const component = await mount(
      <AdminSangakuForm sangaku={sangakuCodeKind} />,
    );

    await component.getByRole("button", { name: "更新" }).click();

    await expect
      .poll(() =>
        page.evaluate(() => window.__updateSangakuCalls?.length ?? 0),
      )
      .toBeGreaterThan(0);
    const calls = await page.evaluate(() => window.__updateSangakuCalls);
    const lastCall = calls?.[calls.length - 1];
    expect(lastCall?.codeBlocks).toBeUndefined();
  });
});
