"use client";

import { Editor } from "@monaco-editor/react";

interface Props {
  value: string;
  // 編集しようとした際に表示されるツールチップ文言。呼び出し元の文脈
  // （自分の提出物／並べ替え問題の正解コード等）によって適切な案内が異なるため
  // 上書きできるようにする。省略時は「自分の提出物」向けの既定文言を使う。
  readOnlyMessage?: string;
}

const defaultReadOnlyMessage = {
  value: "このエディタでは編集できません\n作成画面に戻り編集してください",
};

export default function ReadOnlyEditor({ value, readOnlyMessage }: Props) {
  return (
    <Editor
      defaultLanguage="ruby"
      height="70vh"
      theme="vs-dark"
      options={{
        readOnly: true,
        readOnlyMessage: readOnlyMessage
          ? { value: readOnlyMessage }
          : defaultReadOnlyMessage,
      }}
      value={value}
    />
  );
}
