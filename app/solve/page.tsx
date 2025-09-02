import { Suspense } from "react";
import { SangakuWithButtonListSkeleton } from "@/app/ui/skeletons";
import SavedSangakuList from "@/app/ui/solve/SavedSangakuList";
import { Box, Container, Typography } from "@mui/material";
import Search from "@/app/ui/Search";

interface Props {
  searchParams: Promise<{ page: string; query: string; difficulty: string }>;
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const page = searchParams.page || "1";
  const query = searchParams.query || "";
  const difficulty = searchParams.difficulty || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 6 }}>
        算額を解く
      </Typography>
      <Container maxWidth="md">
        <Search placeholder="タイトルで探す" difficulty />
      </Container>
      <Suspense
        key={page + query + difficulty}
        fallback={<SangakuWithButtonListSkeleton width={102} />}
      >
        <SavedSangakuList page={page} query={query} difficulty={difficulty} />
      </Suspense>
    </Box>
  );
}
