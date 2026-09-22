import { Typography } from "@mui/material";
import type { Kind } from "@/app/lib/definitions";
import { kindTranslation } from "@/app/ui/utility";

interface Props {
  kind?: Kind;
}

export default function KindBadge({ kind }: Props) {
  return (
    <Typography
      component="p"
      sx={{
        px: 1,
        py: 0.5,
        border: 1,
        borderRadius: 2,
        textAlign: "right",
      }}
    >
      {kindTranslation(kind)}
    </Typography>
  );
}
