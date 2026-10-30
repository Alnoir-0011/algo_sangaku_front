import { useState } from "react";
import ConfirmModal from "@/app/ui/shrine/dedicate/ConfirmModal";
import { fetchUserSangaku } from "@/app/lib/data/sangaku";
import type { Sangaku, Shrine } from "@/app/lib/definitions";

// Playwright CT は Promise を props として渡せないため、ブラウザ側で Promise を
// 生成して ConfirmModal に渡すラッパー。SangakuListView のクリック時と同じく、
// reorder のときだけ詳細を取得し、再試行で取得し直す。
export function ConfirmModalWithReorderDetail({
  data,
  shrine,
  failFirst = false,
}: {
  data: Sangaku;
  shrine: Shrine;
  failFirst?: boolean;
}) {
  const [reorderDetail, setReorderDetail] = useState<Promise<
    Sangaku | null | undefined
  > | null>(() => {
    if (data.attributes.kind !== "reorder") {
      return null;
    }
    return failFirst ? Promise.resolve(null) : fetchUserSangaku(data.id);
  });

  return (
    <ConfirmModal
      data={data}
      shrine={shrine}
      handleClose={() => {}}
      reorderDetail={reorderDetail}
      onRetryReorder={() => setReorderDetail(fetchUserSangaku(data.id))}
    />
  );
}
