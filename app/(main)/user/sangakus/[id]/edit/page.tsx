import { fetchUserSangaku, fetchGenerateSourceUsage } from "@/app/lib/data/sangaku";
import { notFound } from "next/navigation";
import Form from "@/app/ui/sangaku/EditForm";
import EditReorderForm from "@/app/ui/sangaku/reorder/EditReorderForm";
import type { Sangaku } from "@/app/lib/definitions";
import { Box } from "@mui/material";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "算額を編集する",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;

  // fetchGenerateSourceUsage はユーザー単位の情報で sangaku の kind に依存しないため、
  // kind 判定（sangaku 取得後）を待たず fetchUserSangaku と並列実行する。
  // reorder 形式では結果を使わないが、並列化によりコード形式編集時の
  // レイテンシ（ウォーターフォール化）を避けるほうを優先する
  const [sangaku, initialUsage] = await Promise.all([
    fetchUserSangaku(id),
    fetchGenerateSourceUsage(),
  ]);

  if (!sangaku) {
    notFound();
  }

  return (
    <Box>
      <h2 style={{ marginTop: 0 }}>算額を編集する</h2>
      <EditFormByKind sangaku={sangaku} initialUsage={initialUsage} />
    </Box>
  );
}

// sangaku.attributes.kind に応じて出題形式ごとの編集フォームを出し分ける。
function EditFormByKind({
  sangaku,
  initialUsage,
}: {
  sangaku: Sangaku;
  initialUsage: Awaited<ReturnType<typeof fetchGenerateSourceUsage>>;
}) {
  switch (sangaku.attributes.kind) {
    case "reorder":
      return <EditReorderForm sangaku={sangaku} />;
    default:
      return <Form sangaku={sangaku} initialUsage={initialUsage} />;
  }
}
