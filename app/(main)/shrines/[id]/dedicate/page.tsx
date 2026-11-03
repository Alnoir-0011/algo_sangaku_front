import { fetchShrine } from "@/app/lib/data/shrine";
import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import SangakuList from "@/app/ui/shrine/dedicate/SangakuList";
import { SangakuListSkeleton } from "@/app/ui/skeletons";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { Suspense } from "react";
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

  // await しない。Suspense の外で待つと、一覧の取得が終わるまでページ全体が表示されない。
  // fetchShrine と並列にもしない。神社が存在しない（404）ときに、使わない一覧を取りに行ってしまう
  const sangakusPromise = fetchUserSangakus(page, query, "");

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {shrine.attributes.name}に算額を奉納する
      </Typography>
      <Suspense
        key={JSON.stringify([page, query])}
        fallback={<SangakuListSkeleton />}
      >
        <SangakuList sangakusPromise={sangakusPromise} shrine={shrine} />
      </Suspense>
    </Box>
  );
}
