import { fetchShrineSangakus } from "@/app/lib/data/sangaku";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Pagination from "@/app/ui/Pagination";
import Sangaku from "./Sangaku";

interface Props {
  shrine_id: string;
  page: string;
  query: string;
  difficulty: string;
}

export default async function SangakuList({
  shrine_id,
  page,
  query,
  difficulty,
}: Props) {
  const { sangakus, totalPage, message } = await fetchShrineSangakus(
    shrine_id,
    page,
    query,
    difficulty,
  );

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
          {sangakus.map((sangaku) => (
            <Sangaku sangaku={sangaku} key={sangaku.id} />
          ))}
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination totalPage={totalPage} />
        </Box>
      </Box>
    </Box>
  );
}
