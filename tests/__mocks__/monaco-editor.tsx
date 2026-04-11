import React from "react";

interface EditorProps {
  value?: string;
  height?: string | number;
  defaultLanguage?: string;
  theme?: string;
  options?: Record<string, unknown>;
  onChange?: (value: string | undefined) => void;
  [key: string]: unknown;
}

export function Editor({ value }: EditorProps) {
  return React.createElement(
    "div",
    { "data-testid": "monaco-editor" },
    value,
  );
}

export default Editor;
