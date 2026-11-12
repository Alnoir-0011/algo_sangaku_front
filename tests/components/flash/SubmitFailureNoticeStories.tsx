import { useTransition } from "react";
import Button from "@mui/material/Button";
import { useKeepScreenOnFailure } from "@/app/ui/flash/SubmitFailureNotice";

// failWith を渡すと、その message の例外を投げて送信に失敗する。
export function SubmitTrigger({ failWith }: { failWith?: string }) {
  const keepScreenOnFailure = useKeepScreenOnFailure();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(() =>
          keepScreenOnFailure(async () => {
            if (failWith) {
              throw new Error(failWith);
            }
          }),
        );
      }}
    >
      送信
    </Button>
  );
}
