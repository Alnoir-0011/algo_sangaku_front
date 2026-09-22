import { notFound } from "next/navigation";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import { fetchUserAnswerWithSangakuId } from "@/app/lib/data/answer";
import { fetchSavedSangaku } from "@/app/lib/data/sangaku";
import Results from "@/app/ui/answer/Results";
import SourceResult from "@/app/ui/answer/SourceResult";
import ReadOnlyEditor from "@/app/ui/answer/ReadOnlyEditor";
import { buildCorrectAnswerSource } from "@/app/ui/sangaku/reorder/buildCorrectAnswerSource";
import { Typography } from "@mui/material";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const sangaku = await fetchSavedSangaku(id);
  return {
    title: `${sangaku?.attributes.title}の解答結果`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const answer = await fetchUserAnswerWithSangakuId(id);
  const sangaku = await fetchSavedSangaku(id);

  if (!answer) {
    notFound();
  }

  // issue #92 / back#278: 形式追加に耐える契約として、表示可否は出題形式名（kind）
  // ではなく実際のデータの有無で判定する。
  // - 提出物（source）があればコードエディタを表示する
  // - テストケースごとの結果（answer_results）があれば結果表を表示する
  //
  // 並べ替え形式は提出した並びを保存しないため answer.attributes.source は常に
  // null になる（issue #278）。代わりに、解答済みなら back が correct_position 付きで
  // 返す sangaku.attributes.code_blocks から正解コードを組み立てて表示する（issue #92）。
  //
  // 正解コードの組み立ては kind === "reorder" のときに限定する。「データの有無で
  // 判定する」という契約自体は back の応答に依存する単層防御のため、万一 back が
  // code 形式にも code_blocks を返す不具合が生じても正解コードが誤表示されないよう
  // kind による多層防御を加える（quick-review 指摘）。
  const correctAnswerSource =
    sangaku?.attributes.kind === "reorder"
      ? buildCorrectAnswerSource(sangaku.attributes.code_blocks ?? [])
      : "";
  const displaySource = answer.attributes.source ?? correctAnswerSource;
  const hasDisplaySource = displaySource !== null && displaySource !== "";
  const isDisplayingCorrectAnswer =
    answer.attributes.source === null && correctAnswerSource !== "";
  const hasAnswerResults = answer.relationships.answer_results.data.length > 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={1}>
        {sangaku?.attributes.title}の結果
      </Typography>
      <Grid container spacing={2}>
        {hasDisplaySource && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <ReadOnlyEditor
              value={displaySource ?? ""}
              readOnlyMessage={
                isDisplayingCorrectAnswer
                  ? "これは正解のコードです\n作成画面ではありません"
                  : undefined
              }
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SourceResult answer={answer} />
          {hasAnswerResults && <Results answer={answer} />}
        </Grid>
      </Grid>
    </Box>
  );
}
