import { test, expect } from "@playwright/experimental-ct-react";
import MarkdownPreview from "@/app/ui/shared/MarkdownPreview";

test.describe("MarkdownPreview", () => {
  test("プレーンテキストをレンダリングする", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="Hello World" />);
    await expect(component).toContainText("Hello World");
  });

  test("見出し（h1）をレンダリングする", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="# 見出し1" />);
    const heading = component.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("見出し1");
  });

  test("太字をレンダリングする", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="**太字テキスト**" />);
    const strong = component.locator("strong");
    await expect(strong).toBeVisible();
    await expect(strong).toContainText("太字テキスト");
  });

  test("リストをレンダリングする", async ({ mount }) => {
    const content = "- 項目1\n- 項目2\n- 項目3";
    const component = await mount(<MarkdownPreview content={content} />);
    const list = component.locator("ul");
    await expect(list).toBeVisible();
    await expect(component).toContainText("項目1");
    await expect(component).toContainText("項目2");
    await expect(component).toContainText("項目3");
  });

  test("インラインコードをレンダリングする", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="`code`" />);
    const code = component.locator("code");
    await expect(code).toBeVisible();
    await expect(code).toContainText("code");
  });

  test("コードブロックをレンダリングする", async ({ mount }) => {
    const content = "```ruby\nputs 'hello'\n```";
    const component = await mount(<MarkdownPreview content={content} />);
    const code = component.locator("code");
    await expect(code).toBeVisible();
    await expect(code).toContainText("puts 'hello'");
  });

  test("テーブル（GFM）をレンダリングする", async ({ mount }) => {
    const content = "| A | B |\n|---|---|\n| 1 | 2 |";
    const component = await mount(<MarkdownPreview content={content} />);
    const table = component.locator("table");
    await expect(table).toBeVisible();
  });

  test("XSS scriptタグをサニタイズする", async ({ mount }) => {
    // scriptタグと本文テキストは別の段落として分ける
    const component = await mount(
      <MarkdownPreview content={"<script>alert('xss')</script>\n\nテキスト"} />
    );
    const scripts = component.locator("script");
    await expect(scripts).toHaveCount(0);
    await expect(component).toContainText("テキスト");
  });

  test("空文字列で何も表示しない", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="" />);
    await expect(component.locator("p, h1, h2, h3, ul, ol, table")).toHaveCount(0);
  });
});
