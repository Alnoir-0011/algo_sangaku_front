import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import { Box, Typography } from "@mui/material";
import DedicatedSangakuListView from "./DedicatedSangakuListView";

interface Props {
  page: string;
  query: string;
  kind?: string;
}

export default async function DedicatedSangakuList({
  page,
  query,
  kind,
}: Props) {
  const { sangakus, totalPage, message } = await fetchUserSangakus(
    page,
    query,
    "any",
    kind,
  );

  return (
    <Box>
      {message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>{message}</Typography>
        </Box>
      )}
      <DedicatedSangakuListView sangakus={sangakus} totalPage={totalPage} />
    </Box>
  );
}
