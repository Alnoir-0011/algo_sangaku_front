import type { ComponentProps } from "react";
import ReorderPuzzle from "@/app/ui/sangaku/reorder/ReorderPuzzle";
import { simulateAction } from "@/tests/__mocks__/action-behavior";

// Playwright CT は、テストから渡した関数 props の戻り値（Promise）をブラウザ側へ返さない。
// そのため、送信中（onSubmit が未完了）の状態は、テストから渡した onSubmit では作れない。
// ブラウザ側で onSubmit を保留するラッパー。
export function ReorderPuzzleWithHeldSubmit(
  props: Omit<ComponentProps<typeof ReorderPuzzle>, "onSubmit">,
) {
  return (
    <ReorderPuzzle
      {...props}
      onSubmit={async () => {
        await simulateAction("onSubmit");
      }}
    />
  );
}
