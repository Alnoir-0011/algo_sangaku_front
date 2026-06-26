import Typography from "@mui/material/Typography";
import type { GenerateSourceUsage } from "@/app/lib/definitions";

interface Props {
  usage: GenerateSourceUsage | undefined;
}

export default function GenerateSourceUsageIndicator({ usage }: Props) {
  if (usage === undefined) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        本日の残り生成回数: - / -
      </Typography>
    );
  }

  return (
    <Typography
      variant="caption"
      sx={{ color: usage.remaining === 0 ? "error.main" : "text.secondary" }}
    >
      本日の残り生成回数: {usage.remaining} / {usage.limit}
    </Typography>
  );
}
