import { useState } from "react";
import MarkdownEditor from "@/app/ui/shared/MarkdownEditor";

// MarkdownEditor は controlled component（value/onChange をprops経由で受け取る）
// のため、Tabキー操作でのvalue更新を実際に画面へ反映させるには、テスト側で
// state を持つ薄いラッパーが必要になる。
export function ControlledMarkdownEditor({
  initial,
}: {
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  return <MarkdownEditor value={value} onChange={setValue} />;
}
