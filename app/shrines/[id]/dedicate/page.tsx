import { fetchShrine } from "@/app/lib/data/shrine";
import SangakuList from "@/app/ui/shrine/dedicate/SangakuList";
// import { SangakuListSkeleton } from "@/app/ui/skeletons";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
// import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const shrine = await fetchShrine(id);
  return {
    title: `${shrine?.attributes.name}に算額を奉納する`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page: string; query: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const page = (await props.searchParams).page || "1";
  const query = (await props.searchParams).query || "";

  const shrine = await fetchShrine(id);

  if (!shrine) {
    notFound();
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {shrine.attributes.name}に算額を奉納する
      </Typography>
      {/* <Suspense fallback={<SangakuListSkeleton />}> */}
      <SangakuList page={page} query={query} />
      {/* </Suspense> */}
    </Box>
  );
}
