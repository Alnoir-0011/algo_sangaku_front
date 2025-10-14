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
  dedicated?: boolean;
}

export default async function UserSangakuList({
  page,
  query,
  dedicated,
}: Props) {
  const type = dedicated ? "any" : "";
  const { sangakus, totalPage, message } = await fetchUserSangakus(
    page,
    query,
    type,
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
        {sangakus.length != 0 ? (
          sangakus.map((sangaku) => (
            <UserSangaku
              sangaku={sangaku}
              key={sangaku.id}
              dedicated={dedicated}
            />
          ))
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography variant="inherit" mr={1}>
              算額がありません
            </Typography>
            <Button variant="contained" href="/sangakus/create" sx={{ ml: 1 }}>
              算額を作る
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
