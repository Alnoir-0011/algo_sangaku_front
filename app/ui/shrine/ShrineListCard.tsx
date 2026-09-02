import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import NextLink from "next/link";
import type { Shrine } from "@/app/lib/definitions";

interface Props {
  shrine: Shrine;
  isNearby: boolean;
}

export default function ShrineListCard({ shrine, isNearby }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        borderRadius: 1,
        backgroundColor: "primary.main",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            borderRadius: 1,
          }}
        >
          <Image src="/torii-icon.svg" alt="" width={18} height={18} />
        </Box>
        <Typography variant="h6">{shrine.attributes.name}</Typography>
      </Box>
      <Typography variant="body2">
        算額の数: {shrine.attributes.sangaku_count ?? 0}
      </Typography>
      {isNearby ? (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ color: "white" }}
            LinkComponent={NextLink}
            href={`/shrines/${shrine.id}/sangakus`}
          >
            算額を見る
          </Button>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ color: "white" }}
            LinkComponent={NextLink}
            href={`/shrines/${shrine.id}/dedicate`}
          >
            算額を奉納する
          </Button>
        </Box>
      ) : (
        <Typography variant="body2">神社から離れています</Typography>
      )}
    </Box>
  );
}
