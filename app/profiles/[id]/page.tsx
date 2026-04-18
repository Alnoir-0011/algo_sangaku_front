import { Avatar, Box, Paper, Typography } from "@mui/material";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicProfile } from "@/app/lib/data/profile";
import ActivitySummary from "@/app/ui/profile/activity-summary";
import DedicatedSangakuList from "@/app/ui/profile/dedicated-sangaku-list";

export const metadata: Metadata = {
  title: "プロフィール",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const profile = await fetchPublicProfile(id);

  if (!profile) {
    notFound();
  }

  const { attributes } = profile;
  const initial = attributes.nickname.charAt(0).toUpperCase() || "?";

  return (
    <Box maxWidth={640} mx="auto">
      <Typography variant="h4" component="h1" mb={3}>
        プロフィール
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {/* アバター + 基本情報 */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              fontSize: "2rem",
              bgcolor: "primary.main",
            }}
          >
            {initial}
          </Avatar>
          <Box>
            <Typography variant="h6">{attributes.nickname}</Typography>
            <Typography variant="body2" color="text.secondary">
              登録日:{" "}
              {new Date(attributes.created_at).toLocaleDateString("ja-JP")}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 活動サマリー */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <ActivitySummary
          sangakuCount={attributes.sangaku_count}
          dedicatedSangakuCount={attributes.dedicated_sangaku_count}
          answerCount={attributes.answer_count}
        />
      </Paper>

      {/* 奉納済み算額一覧 */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <DedicatedSangakuList sangakus={attributes.dedicated_sangakus} />
      </Paper>
    </Box>
  );
}
