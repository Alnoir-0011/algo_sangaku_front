import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import UserSangaku from "@/app/ui/sangaku/UserSangaku";
import Typography from "@mui/material/Typography";
import Pagination from "@/app/ui/Pagination";

interface Props {
  page: string;
  query: string;
}
export default async function UserSangakuList({ page, query }: Props) {
  const { sangakus, totalPage } = await fetchUserSangakus(page, query);

  return (
    <Box>
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
        {Array.isArray(sangakus) && sangakus.length != 0 ? (
          sangakus.map((sangaku) => (
            <UserSangaku sangaku={sangaku} key={sangaku.id} />
          ))
        ) : (
          <>
            <Typography variant="inherit">算額がありません</Typography>
            <Button variant="contained" href="/sangakus/create">
              算額を作る
            </Button>
          </>
        )}
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </Box>
  );
}
