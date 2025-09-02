import { fetchShrine } from "@/app/lib/data/shrine";
import { Container, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { notFound } from "next/navigation";
import SangakuList from "@/app/ui/shrine/sangakus/SangakuList";
import { Suspense } from "react";
import { SangakuWithButtonListSkeleton } from "@/app/ui/skeletons";
import Search from "@/app/ui/Search";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page: string; query: string; difficulty: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const page = (await props.searchParams).page || "1";
  const query = (await props.searchParams).query || "";
  const difficulty = (await props.searchParams).difficulty || "";

  const shrine = await fetchShrine(id);

  if (!shrine) {
    notFound();
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 6 }}>
        {shrine.attributes.name}の算額一覧
      </Typography>
      <Container maxWidth="md">
        <Search placeholder="タイトルで探す" difficulty />
      </Container>
      <Suspense
        key={page + query + difficulty}
        fallback={<SangakuWithButtonListSkeleton width={102} />}
      >
        <SangakuList
          shrine_id={id}
          page={page}
          query={query}
          difficulty={difficulty}
        />
      </Suspense>
    </Box>
  );
}
