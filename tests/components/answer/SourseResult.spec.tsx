import { test, expect } from "@/tests/fixtures.ct";
import SourseResult from "@/app/ui/answer/SourseResult";

const correctAnswer = {
  id: "1",
  type: "answer" as const,
  attributes: { source: "puts 'hi'", status: "correct" as const },
  relationships: {
    user_sangaku_save: { data: { id: "1", type: "user_sangaku_save" as const } },
    answer_results: { data: [] },
  },
};

test.describe("SourseResult", () => {
  test("should allow me to see 明察 when answer is correct", async ({ mount }) => {
    // モックが "correct" を返すため isCorrect() が呼ばれて true になる
    const component = await mount(<SourseResult answer={correctAnswer} />);
    await expect(component.getByText("明")).toBeVisible({ timeout: 5000 });
    await expect(component.getByText("察")).toBeVisible();
  });
});
