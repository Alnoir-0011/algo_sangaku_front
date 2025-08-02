import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import PageTab from "@/app/ui/sangaku/PageTab";
import UserSangakuList from "@/app/ui/sangaku/UserSangakuList";
import { Suspense } from "react";
import { UserSangakuListSkeleton } from "@/app/ui/skeletons";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ page: string; tab: string; query: string }>;
}

export default async function Page(props: Props) {
  const page = (await props.searchParams).page || "1";
  const tab = (await props.searchParams).tab || "before_dedicate";
  const query = (await props.searchParams).query || "";

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <h2>自分の算額一覧</h2>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button
            LinkComponent={Link}
            variant="contained"
            href="/sangakus/create"
          >
            算額を作る
          </Button>
        </Box>
      </Box>
      <PageTab />
      {tab === "already_dedicate" ? (
        <p>already_dedicate sangaku</p>
      ) : (
        <Suspense key={page + query} fallback={<UserSangakuListSkeleton />}>
          <UserSangakuList page={page} query={query} />
        </Suspense>
      )}
    </Box>
  );
}
