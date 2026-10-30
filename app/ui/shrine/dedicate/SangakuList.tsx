import type { Shrine } from "@/app/lib/definitions";
import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import { Box, Typography } from "@mui/material";
import SangakuListView from "./SangakuListView";

interface Props {
  page: string;
  query: string;
  shrine: Shrine;
}

export default async function SangakuList({ page, query, shrine }: Props) {
  const { sangakus, totalPage, message } = await fetchUserSangakus(
    page,
    query,
    "",
  );

  return (
    <>
      {message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>{message}</Typography>
        </Box>
      )}
      <SangakuListView
        sangakus={sangakus}
        totalPage={totalPage}
        shrine={shrine}
      />
    </>
  );
}
