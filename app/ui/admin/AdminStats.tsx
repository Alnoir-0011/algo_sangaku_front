import { Box, Card, CardContent, Typography } from "@mui/material";
import type { AdminStats } from "@/app/lib/definitions";

interface Props {
  stats: AdminStats;
}

const statItems = [
  { label: "ユーザー数", key: "users_count" },
  { label: "算額数", key: "sangakus_count" },
  { label: "神社数", key: "shrines_count" },
  { label: "解答数", key: "answers_count" },
] as const;

export default function AdminStats({ stats }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {statItems.map(({ label, key }) => (
        <Card key={key} data-testid={key} sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4">{stats[key]}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
