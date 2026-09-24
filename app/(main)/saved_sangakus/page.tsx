import { Suspense } from "react";
import { SangakuWithButtonListSkeleton } from "@/app/ui/skeletons";
import SavedSangakuList from "@/app/ui/answer/SavedSangakuList";
import { Box, Container, Typography } from "@mui/material";
import Search from "@/app/ui/Search";
import PageTab from "@/app/ui/answer/PageTab";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "算額を解く",
};

interface Props {
  searchParams: Promise<{
    page: string;
    query: string;
    difficulty: string;
    tab: string;
    kind?: string;
  }>;
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const page = searchParams.page || "1";
  const query = searchParams.query || "";
  const difficulty = searchParams.difficulty || "";
  const tab = searchParams.tab || "before_answer";
  const kind = searchParams.kind;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        算額を解く
      </Typography>
      <PageTab />
      {tab === "answered" ? (
        <>
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
            <SavedSangakuList
              page={page}
              query={query}
              difficulty={difficulty}
              type="answered"
              kind={kind}
            />
          </Suspense>
        </>
      ) : (
        <>
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
            <SavedSangakuList
              page={page}
              query={query}
              difficulty={difficulty}
              type="before_answer"
              kind={kind}
            />
          </Suspense>
        </>
      )}
    </Box>
  );
}
