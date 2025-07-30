import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import UserSangaku from "@/app/ui/sangaku/UserSangaku";
import Typography from "@mui/material/Typography";
import Pagination from "@/app/ui/Pagination";

interface Props {
  searchParams: Promise<{ page: string }>;
}

export default async function Page(props: Props) {
  const page = (await props.searchParams).page || "1";
  const { sangakus, totalPage } = await fetchUserSangakus(page);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <h2>自分の算額一覧</h2>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button variant="contained" href="/sangakus/create">
            算額を作る
          </Button>
        </Box>
      </Box>
      <Box>
        <Grid
          container
          direction="row"
          spacing={3}
          sx={{
            justifyContent: "start",
            alignItems: "flex-start",
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
        <Pagination totalPage={totalPage} />
      </Box>
    </Box>
  );
}
