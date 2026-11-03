import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import PageTab from "@/app/ui/sangaku/PageTab";
import UserSangakuList from "@/app/ui/sangaku/UserSangakuList";
import { Suspense } from "react";
import { SangakuListSkeleton } from "@/app/ui/skeletons";
import Link from "@/app/ui/shared/NextLink";
import Search from "@/app/ui/Search";
import { Container } from "@mui/material";
import { Metadata } from "next";
import DedicatedSangakuList from "@/app/ui/sangaku/DedicatedSangakuList";
import { fetchUserSangakus } from "@/app/lib/data/sangaku";

export const metadata: Metadata = {
  title: "自分の算額一覧",
};

interface Props {
  searchParams: Promise<{
    page: string;
    tab: string;
    query: string;
    kind?: string;
  }>;
}

export default async function Page(props: Props) {
  const page = (await props.searchParams).page || "1";
  const tab = (await props.searchParams).tab || "before_dedicate";
  const query = (await props.searchParams).query || "";
  const kind = (await props.searchParams).kind;

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
        <>
          <Container maxWidth="md">
            <Search placeholder="タイトルで検索" kind />
          </Container>
          <Suspense
            key={JSON.stringify([page, query, kind ?? null])}
            fallback={<SangakuListSkeleton />}
          >
            <DedicatedSangakuList
              sangakusPromise={fetchUserSangakus(page, query, "any", kind)}
            />
          </Suspense>
        </>
      ) : (
        <>
          <Container maxWidth="md">
            <Search placeholder="タイトルで検索" kind />
          </Container>
          {/*
            kind はクエリパラメータ未指定時 undefined を取り得るため、
            page/query と同様に key へ含めて絞り込み変更時に Suspense を再マウントさせる。
            文字列連結だと page="1", query="2" と page="12", query="" が衝突するため、
            JSON.stringify で区切る（undefined は配列内で null になる）
          */}
          <Suspense
            key={JSON.stringify([page, query, kind ?? null])}
            fallback={<SangakuListSkeleton />}
          >
            <UserSangakuList page={page} query={query} kind={kind} />
          </Suspense>
        </>
      )}
    </Box>
  );
}
