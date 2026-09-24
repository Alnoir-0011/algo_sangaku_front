import Form from "@/app/ui/sangaku/CreateForm";
import CreateReorderForm from "@/app/ui/sangaku/reorder/CreateReorderForm";
import KindSelector from "@/app/ui/sangaku/reorder/KindSelector";
import { Box } from "@mui/material";
import { Metadata } from "next";
import { fetchGenerateSourceUsage } from "@/app/lib/data/sangaku";

export const metadata: Metadata = {
  title: "算額を作る",
};

interface Props {
  searchParams: Promise<{ kind?: string }>;
}

export default async function Page(props: Props) {
  const { kind } = await props.searchParams;

  return (
    <Box>
      <h2 style={{ marginTop: 0 }}>算額を作る</h2>
      <CreateFormByKind kind={kind} />
    </Box>
  );
}

// kind クエリパラメータに応じて出題形式ごとの作成フォームを出し分ける。
// kind が未指定・不正な場合は出題形式の選択肢（KindSelector）を表示する。
async function CreateFormByKind({ kind }: { kind?: string }) {
  switch (kind) {
    case "code":
      return <CodeSangakuForm />;
    case "reorder":
      return <CreateReorderForm />;
    default:
      return <KindSelector />;
  }
}

async function CodeSangakuForm() {
  const initialUsage = await fetchGenerateSourceUsage();
  return <Form initialUsage={initialUsage} />;
}
