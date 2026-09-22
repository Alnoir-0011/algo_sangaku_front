"use client";

import { updateReorderSangaku } from "@/app/lib/actions/sangaku";
import type { CodeBlock, Sangaku } from "@/app/lib/definitions";
import ReorderSangakuForm from "./ReorderSangakuForm";
import type { CodeBlockDraft } from "./CodeBlockEditor";

interface Props {
  sangaku: Sangaku;
}

// CodeBlock（back から取得した永続化済みブロック。content + correct_position）を
// CodeBlockDraft（CodeBlockEditor が扱う編集中のドラフト形状。content + isDummy）に
// 変換する。correct_position が null/undefined のブロックをダミーとみなす。
// ReorderSangakuForm.tsx の toReorderCodeBlockInputs（ドラフト→ペイロードの逆方向変換）
// と対になる変換であり、同様に呼び出し元コンポーネントの外に置く。
function toCodeBlockDrafts(codeBlocks: CodeBlock[]): CodeBlockDraft[] {
  return codeBlocks.map((block) => ({
    content: block.content,
    isDummy:
      block.correct_position === null || block.correct_position === undefined,
  }));
}

export default function EditReorderForm({ sangaku }: Props) {
  const initialBlocks = toCodeBlockDrafts(sangaku.attributes.code_blocks ?? []);

  return (
    <ReorderSangakuForm
      action={(prevState, formData, difficulty, description, codeBlocks) =>
        updateReorderSangaku(
          sangaku.id,
          prevState,
          formData,
          difficulty,
          description,
          codeBlocks,
        )
      }
      initialState={{
        values: {
          title: sangaku.attributes.title,
          description: sangaku.attributes.description,
        },
      }}
      initialDescription={sangaku.attributes.description}
      initialDifficulty={sangaku.attributes.difficulty}
      initialBlocks={initialBlocks}
    />
  );
}
