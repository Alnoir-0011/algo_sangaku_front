import { fetchShrine } from "@/app/lib/data/shrine";
import { Container, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { notFound } from "next/navigation";
import SangakuList from "@/app/ui/shrine/sangakus/SangakuList";
import { Suspense } from "react";
import { SangakuWithButtonListSkeleton } from "@/app/ui/skeletons";
import { auth } from "@/auth";
import Search from "@/app/ui/Search";
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page: string;
    query: string;
    difficulty: string;
    kind?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const shrine = await fetchShrine(id);
  return {
    title: `${shrine?.attributes.name}の算額一覧`,
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const page = (await props.searchParams).page || "1";
  const query = (await props.searchParams).query || "";
  const difficulty = (await props.searchParams).difficulty || "";
  const kind = (await props.searchParams).kind;

  const shrine = await fetchShrine(id);

  if (!shrine) {
    notFound();
  }

  // ゲスト解放中の代表算額は、未ログインのゲストが1ページ目を絞り込みなしで
  // 開いたときだけ一覧の先頭に並べる（2ページ目や検索結果に毎回混ざらないようにする）
  const session = await auth();
  const showGuestSangaku =
    !session && page === "1" && !query && !difficulty && !kind;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 6 }}>
        {shrine.attributes.name}の算額一覧
      </Typography>
      <Container maxWidth="md">
        <Search placeholder="タイトルで探す" difficulty kind />
      </Container>
      {/*
        kind はクエリパラメータ未指定時 undefined を取り得るため、
        page/query/difficulty と同様に key へ含めて絞り込み変更時に
        Suspense を再マウントさせつつ、undefined が文字列化されて
        "undefined" という値が key に混入しないよう ?? "" でフォールバックする
      */}
      <Suspense
        key={page + query + difficulty + (kind ?? "")}
        fallback={<SangakuWithButtonListSkeleton width={102} />}
      >
        <SangakuList
          shrine_id={id}
          page={page}
          query={query}
          difficulty={difficulty}
          kind={kind}
          showGuestSangaku={showGuestSangaku}
        />
      </Suspense>
    </Box>
  );
}
