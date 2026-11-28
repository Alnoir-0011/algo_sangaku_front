import { test, expect } from "@/tests/fixtures.ct";
import SourceResult from "@/app/ui/answer/SourceResult";
import type { Answer } from "@/app/lib/definitions";

const correctAnswer = {
  id: "1",
  type: "answer" as const,
  attributes: {
    source: "puts 'hi'",
    status: "correct" as const,
    kind: "code" as const,
  },
  relationships: {
    user_sangaku_save: { data: { id: "1", type: "user_sangaku_save" as const } },
    answer_results: { data: [] },
  },
};

// back の ReorderAnswer では source が実装されておらず、親の Answer#source が nil を
// 返すケースを表す fixture。
const reorderAnswerWithNullSource: Answer = {
  id: "2",
  type: "answer",
  attributes: {
    source: null,
    status: "correct",
    kind: "reorder",
  },
  relationships: {
    user_sangaku_save: { data: { id: "2", type: "user_sangaku_save" as const } },
    answer_results: { data: [] },
  },
};

// SourceResult コンポーネント
test.describe("SourceResult", () => {
  // 解答が正解のとき、見出しに「察」を含む結果が見える
  test("should allow me to see 明察 when answer is correct", async ({ mount }) => {
    // モックが "correct" を返すため isCorrect() が呼ばれて true になる
    const component = await mount(<SourceResult answer={correctAnswer} />);
    const heading = component.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText("察");
  });

  // 解答が reorder 形式で source が null のとき、見出しに「察」を含む結果が見える
  test("should allow me to see 明察 when answer is a reorder kind with a null source", async ({
    mount,
  }) => {
    const component = await mount(
      <SourceResult answer={reorderAnswerWithNullSource} />,
    );
    const heading = component.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText("察");
  });
});
