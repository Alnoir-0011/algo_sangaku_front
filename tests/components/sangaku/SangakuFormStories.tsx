import type { ComponentProps } from "react";
import SangakuForm from "@/app/ui/sangaku/SangakuForm";
import { simulateAction } from "@/tests/__mocks__/action-behavior";

// ReorderPuzzleStories.tsx と同じ理由で、ブラウザ側で action を保留するラッパー。
export function SangakuFormWithHeldAction(
  props: Omit<ComponentProps<typeof SangakuForm>, "action">,
) {
  return (
    <SangakuForm
      {...props}
      action={async () => {
        await simulateAction("formAction");
        return {};
      }}
    />
  );
}
