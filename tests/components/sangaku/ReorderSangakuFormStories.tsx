import type { ComponentProps } from "react";
import ReorderSangakuForm from "@/app/ui/sangaku/reorder/ReorderSangakuForm";
import { simulateAction } from "@/tests/__mocks__/action-behavior";

// ReorderPuzzleStories.tsx と同じ理由で、ブラウザ側で action を保留するラッパー。
export function ReorderSangakuFormWithHeldAction(
  props: Omit<ComponentProps<typeof ReorderSangakuForm>, "action">,
) {
  return (
    <ReorderSangakuForm
      {...props}
      action={async () => {
        await simulateAction("formAction");
        return {};
      }}
    />
  );
}
