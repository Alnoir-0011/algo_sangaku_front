import { test, expect } from "@/tests/fixtures.ct";
import Result from "@/app/ui/answer/Result";

// テスト高速化用の設定（実装のデフォルト: 250ms × 40回 = 10秒）
const TEST_POLL_INTERVAL = 50;
const TEST_MAX_POLL_COUNT = 3;

const correctResponse = {
  data: {
    id: "1",
    type: "answer_result",
    attributes: { status: "correct", output: "42" },
  },
};

const pendingResponse = {
  data: {
    id: "1",
    type: "answer_result",
    attributes: { status: "pending", output: "" },
  },
};

test.describe("Result", () => {
  test("should allow me to see the result output after polling completes", async ({
    mount,
    page,
  }) => {
    await page.route("/api/answer-results/1", (route) =>
      route.fulfill({ json: correctResponse }),
    );
    const component = await mount(
      <Result index={0} id="1" pollInterval={TEST_POLL_INTERVAL} />,
    );
    await expect(component.getByTestId("result-1")).toBeVisible();
    await expect(component.getByText("○")).toBeVisible();
    await expect(component.getByText("42")).toBeVisible();
  });

  test("should allow me to see 1-based index number when index prop is given", async ({
    mount,
    page,
  }) => {
    await page.route("/api/answer-results/1", (route) =>
      route.fulfill({ json: correctResponse }),
    );
    const component = await mount(
      <Result index={2} id="1" pollInterval={TEST_POLL_INTERVAL} />,
    );
    await expect(component.getByTestId("result-3")).toBeVisible();
    await expect(component.getByText("3")).toBeVisible();
  });

  test("should allow me to see loading indicator while polling is in progress", async ({
    mount,
    page,
  }) => {
    let resolveRoute!: () => void;
    const blocker = new Promise<void>((r) => {
      resolveRoute = r;
    });

    await page.route("/api/answer-results/1", async (route) => {
      await blocker;
      await route.fulfill({ json: correctResponse });
    });

    const component = await mount(
      <Result index={0} id="1" pollInterval={TEST_POLL_INTERVAL} />,
    );
    // ルートを保留している間はローディング中
    await expect(
      component.getByRole("progressbar").first(),
    ).toBeVisible();

    // ルートを解決してポーリング完了を待つ
    resolveRoute();
    await expect(component.getByTestId("result-1")).toBeVisible();
  });

  test("should allow me to see timeout message when polling exceeds limit", async ({
    mount,
    page,
  }) => {
    await page.route("/api/answer-results/1", (route) =>
      route.fulfill({ json: pendingResponse }),
    );
    const component = await mount(
      <Result
        index={0}
        id="1"
        pollInterval={TEST_POLL_INTERVAL}
        maxPollCount={TEST_MAX_POLL_COUNT}
      />,
    );
    await expect(component.getByText("採点タイムアウト")).toBeVisible();
    await expect(component.getByTestId("result-1")).toBeVisible();
  });

  test("should allow me to see timeout message when server returns 500 error", async ({
    mount,
    page,
  }) => {
    await page.route("/api/answer-results/1", (route) =>
      route.fulfill({ status: 500, json: null }),
    );
    const component = await mount(
      <Result
        index={0}
        id="1"
        pollInterval={TEST_POLL_INTERVAL}
        maxPollCount={TEST_MAX_POLL_COUNT}
      />,
    );
    // 500エラーはポーリングを継続し、上限到達後にタイムアウト表示へ遷移する
    await expect(component.getByText("採点タイムアウト")).toBeVisible();
  });

  test("should allow me to see new result when id prop changes", async ({
    mount,
    page,
  }) => {
    const id1Response = {
      data: { id: "1", type: "answer_result", attributes: { status: "correct", output: "output-1" } },
    };
    const id2Response = {
      data: { id: "2", type: "answer_result", attributes: { status: "correct", output: "output-2" } },
    };

    await page.route("/api/answer-results/1", (route) =>
      route.fulfill({ json: id1Response }),
    );
    await page.route("/api/answer-results/2", (route) =>
      route.fulfill({ json: id2Response }),
    );

    const component = await mount(
      <Result index={0} id="1" pollInterval={TEST_POLL_INTERVAL} />,
    );
    await expect(component.getByText("output-1")).toBeVisible();

    // id を変更 → 旧インターバルの cleanup が呼ばれ新しいポーリングが開始される
    await component.update(<Result index={0} id="2" pollInterval={TEST_POLL_INTERVAL} />);
    await expect(component.getByText("output-2")).toBeVisible();
  });
});
