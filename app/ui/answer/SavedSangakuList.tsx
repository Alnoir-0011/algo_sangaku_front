import Grid from "@mui/material/Grid2";
import { Box, Button, Typography } from "@mui/material";
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
    "before_answer",
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
        {sangakus.length > 0 &&
          sangakus.map((sangaku) => (
            <SavedSangaku sangaku={sangaku} key={sangaku.id} />
          ))}
        {sangakus.length > 0 || (
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography variant="inherit" mr={1}>
              算額がありません
            </Typography>
            <Button variant="contained" href="/shrines" sx={{ ml: 1 }}>
              神社を探す
            </Button>
          </Box>
        )}
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </Box>
  );
}
