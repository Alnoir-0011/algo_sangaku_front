import { test, expect } from "@/tests/fixtures.ct";
import SourceResult from "@/app/ui/answer/SourceResult";

const correctAnswer = {
  id: "1",
  type: "answer" as const,
  attributes: { source: "puts 'hi'", status: "correct" as const },
  relationships: {
    user_sangaku_save: { data: { id: "1", type: "user_sangaku_save" as const } },
    answer_results: { data: [] },
  },
};

test.describe("SourceResult", () => {
  test("should allow me to see 明察 when answer is correct", async ({ mount }) => {
    // モックが "correct" を返すため isCorrect() が呼ばれて true になる
    const component = await mount(<SourceResult answer={correctAnswer} />);
    const heading = component.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText("察");
  });
});
