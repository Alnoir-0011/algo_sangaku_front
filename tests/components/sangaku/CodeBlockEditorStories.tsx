import { useState } from "react";
import CodeBlockEditor from "@/app/ui/sangaku/reorder/CodeBlockEditor";

type CodeBlockDraft = { content: string; isDummy: boolean };

export function CodeBlockEditorWrapper({
  initial,
}: {
  initial: CodeBlockDraft[];
}) {
  const [blocks, setBlocks] = useState(initial);
  return (
    <>
      <CodeBlockEditor blocks={blocks} setBlocks={setBlocks} />
      {/* isDummy は画面上に表示されないため、結合・分割操作で isDummy が
          意図通り保持されるかをテストが検証できるようにするためのデバッグ出力。 */}
      <div data-testid="debug-is-dummy" style={{ display: "none" }}>
        {JSON.stringify(blocks.map((b) => b.isDummy))}
      </div>
    </>
  );
}
