import { Box, Card, CardContent, Typography } from "@mui/material";

interface StatCardProps {
  label: string;
  value: number | null;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 100 }}>
      <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="h5" component="p" fontWeight="bold">
          {value === null ? "—" : value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface Props {
  sangakuCount: number;
  dedicatedSangakuCount: number;
  answerCount: number | null;
  savedSangakuCount?: number;
}

export default function ActivitySummary({
  sangakuCount,
  dedicatedSangakuCount,
  answerCount,
  savedSangakuCount,
}: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        活動サマリー
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap">
        <StatCard label="作成した算額" value={sangakuCount} />
        <StatCard label="奉納済み算額" value={dedicatedSangakuCount} />
        {savedSangakuCount !== undefined && (
          <StatCard label="保存した算額" value={savedSangakuCount} />
        )}
        <StatCard label="提出した回答" value={answerCount} />
      </Box>
    </Box>
  );
}
