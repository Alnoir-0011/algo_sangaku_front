import { useState } from "react";
import ConfirmModal from "@/app/ui/shrine/dedicate/ConfirmModal";
import { fetchReorderDetail, type ReorderDetail } from "@/app/lib/sangaku-detail";
import type { Sangaku, Shrine } from "@/app/lib/definitions";

// Playwright CT は Promise を props として渡せないため、ブラウザ側で Promise を
// 生成して ConfirmModal に渡すラッパー。SangakuListView のクリック時と同じ
// fetchReorderDetail を使い、reorder のときだけ詳細を取得し、再試行で取得し直す。
export function ConfirmModalWithReorderDetail({
  data,
  shrine,
}: {
  data: Sangaku;
  shrine: Shrine;
}) {
  const [reorderDetail, setReorderDetail] = useState<ReorderDetail | null>(() =>
    data.attributes.kind === "reorder" ? fetchReorderDetail(data.id) : null,
  );

  return (
    <ConfirmModal
      data={data}
      shrine={shrine}
      handleClose={() => {}}
      reorderDetail={reorderDetail}
      onRetryReorder={() => setReorderDetail(fetchReorderDetail(data.id))}
    />
  );
}
