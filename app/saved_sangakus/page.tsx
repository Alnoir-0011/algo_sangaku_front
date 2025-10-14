import { Suspense } from "react";
import { SangakuWithButtonListSkeleton } from "@/app/ui/skeletons";
import SavedSangakuList from "@/app/ui/answer/SavedSangakuList";
import { Box, Container, Typography } from "@mui/material";
import Search from "@/app/ui/Search";
import PageTab from "../ui/answer/PageTab";

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
  }>;
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const page = searchParams.page || "1";
  const query = searchParams.query || "";
  const difficulty = searchParams.difficulty || "";
  const tab = (await props.searchParams).tab || "before_answer";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        算額を解く
      </Typography>
      <PageTab />
      {tab === "answered" ? (
        <>
          <Container maxWidth="md">
            <Search placeholder="タイトルで探す" difficulty />
          </Container>
          <Suspense
            key={page + query + difficulty}
            fallback={<SangakuWithButtonListSkeleton width={102} />}
          >
            <SavedSangakuList
              page={page}
              query={query}
              difficulty={difficulty}
              type="answered"
            />
          </Suspense>
        </>
      ) : (
        <>
          <Container maxWidth="md">
            <Search placeholder="タイトルで探す" difficulty />
          </Container>
          <Suspense
            key={page + query + difficulty}
            fallback={<SangakuWithButtonListSkeleton width={102} />}
          >
            <SavedSangakuList
              page={page}
              query={query}
              difficulty={difficulty}
              type="before_answer"
            />
          </Suspense>
        </>
      )}
    </Box>
  );
}
