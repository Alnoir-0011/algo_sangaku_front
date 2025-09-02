import Grid from "@mui/material/Grid2";
import { Box, Typography } from "@mui/material";
import { fetchSavedSangakus } from "@/app/lib/data/sangaku";
import Pagination from "../Pagination";
import SavedSangaku from "./SavedSangaku";

interface Props {
  page: string;
  query: string;
  difficulty: string;
}

export default async function SavedSangakuList({
  page,
  query,
  difficulty,
}: Props) {
  const { sangakus, totalPage, message } = await fetchSavedSangakus(
    page,
    query,
    difficulty,
  );

  return (
    <Box>
      {message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>{message}</Typography>
        </Box>
      )}
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: "center",
          alignItems: "flex-start",
          mt: 3,
          mb: 2,
        }}
      >
        {sangakus.map((sangaku) => (
          <SavedSangaku sangaku={sangaku} key={sangaku.id} />
        ))}
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </Box>
  );
}
