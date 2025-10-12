"use client";

import { Editor } from "@monaco-editor/react";

interface Props {
  value: string;
}

const readOnlyMessage = {
  value: "このエディタでは編集できません\n作成画面に戻り編集してください",
};

export default function ReadOnlyEditor({ value }: Props) {
  return (
    <Editor
      defaultLanguage="ruby"
      height="70vh"
      theme="vs-dark"
      options={{ readOnly: true, readOnlyMessage }}
      value={value}
    />
  );
}
