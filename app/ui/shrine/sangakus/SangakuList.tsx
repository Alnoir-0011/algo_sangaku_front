import {
  fetchShrineSangakus,
  fetchSavedSangakuIds,
  fetchRepresentativeReorderSangaku,
} from "@/app/lib/data/sangaku";
import { guestReorderPath } from "@/routes";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import Grid from "@mui/material/Grid2";
import Pagination from "@/app/ui/Pagination";
import Sangaku from "./Sangaku";

interface Props {
  shrine_id: string;
  page: string;
  query: string;
  difficulty: string;
  kind?: string;
  // 未ログインのゲストが1ページ目を絞り込みなしで開いたときだけ true。
  // 一覧の先頭に、ゲスト解放中の代表算額を並べる
  showGuestSangaku?: boolean;
}

export default async function SangakuList({
  shrine_id,
  page,
  query,
  difficulty,
  kind,
  showGuestSangaku = false,
}: Props) {
  const [{ sangakus, totalPage, message }, guestSangaku] = await Promise.all([
    fetchShrineSangakus(shrine_id, page, query, difficulty, kind),
    showGuestSangaku ? fetchRepresentativeReorderSangaku(shrine_id) : null,
  ]);
  const savedIds = await fetchSavedSangakuIds(sangakus.map((s) => s.id));

  return (
    <Box
      sx={{
        flexGrow: 1,
        position: "relative",
      }}
    >
      {message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>{message}</Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="flex-start"
          sx={{ mt: 3, mb: 2, flexGrow: 1 }}
        >
          {guestSangaku && (
            <Sangaku
              sangaku={guestSangaku}
              saved={false}
              key={`guest-${guestSangaku.id}`}
              action={
                <Button
                  component={Link}
                  href={guestReorderPath(guestSangaku.id)}
                  variant="contained"
                >
                  お試しで解く
                </Button>
              }
            />
          )}
          {sangakus.map((sangaku) => (
            <Sangaku
              sangaku={sangaku}
              saved={savedIds.has(sangaku.id)}
              key={sangaku.id}
            />
          ))}
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination totalPage={totalPage} />
        </Box>
      </Box>
    </Box>
  );
}
