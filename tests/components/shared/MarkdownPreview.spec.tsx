import { test, expect } from "@/tests/fixtures.ct";
import MarkdownPreview from "@/app/ui/shared/MarkdownPreview";

test.describe("MarkdownPreview", () => {
  test("should allow me to see plain text rendered", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="Hello World" />);
    await expect(component).toContainText("Hello World");
  });

  test("should allow me to see heading rendered", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="# 見出し1" />);
    const heading = component.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("見出し1");
  });

  test("should allow me to see bold text rendered", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="**太字テキスト**" />);
    const strong = component.locator("strong");
    await expect(strong).toBeVisible();
    await expect(strong).toContainText("太字テキスト");
  });

  test("should allow me to see list items rendered", async ({ mount }) => {
    const content = "- 項目1\n- 項目2\n- 項目3";
    const component = await mount(<MarkdownPreview content={content} />);
    const list = component.locator("ul");
    await expect(list).toBeVisible();
    await expect(component).toContainText("項目1");
    await expect(component).toContainText("項目2");
    await expect(component).toContainText("項目3");
  });

  test("should allow me to see inline code rendered", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="`code`" />);
    const code = component.locator("code");
    await expect(code).toBeVisible();
    await expect(code).toContainText("code");
  });

  test("should allow me to see code block rendered", async ({ mount }) => {
    const content = "```ruby\nputs 'hello'\n```";
    const component = await mount(<MarkdownPreview content={content} />);
    const code = component.locator("code");
    await expect(code).toBeVisible();
    await expect(code).toContainText("puts 'hello'");
  });

  test("should allow me to see table rendered with GFM", async ({ mount }) => {
    const content = "| A | B |\n|---|---|\n| 1 | 2 |";
    const component = await mount(<MarkdownPreview content={content} />);
    const table = component.locator("table");
    await expect(table).toBeVisible();
  });

  test("should not allow me to see script tags in rendered output", async ({ mount }) => {
    // scriptタグと本文テキストは別の段落として分ける
    const component = await mount(
      <MarkdownPreview content={"<script>alert('xss')</script>\n\nテキスト"} />
    );
    const scripts = component.locator("script");
    await expect(scripts).toHaveCount(0);
    await expect(component).toContainText("テキスト");
  });

  test("should allow me to see nothing when content is empty", async ({ mount }) => {
    const component = await mount(<MarkdownPreview content="" />);
    await expect(component.locator("p, h1, h2, h3, ul, ol, table")).toHaveCount(0);
  });
});
