import { auth } from "@/auth";
import { Avatar, Box, Divider, Paper, Typography } from "@mui/material";
import { Metadata } from "next";
import { fetchMyProfile } from "@/app/lib/data/profile";
import { fetchGenerateSourceUsage } from "@/app/lib/data/sangaku";
import NicknameForm from "@/app/ui/profile/nickname-form";
import ActivitySummary from "@/app/ui/profile/activity-summary";
import PrivacySettingsCard from "@/app/ui/profile/privacy-settings-card";

export const metadata: Metadata = {
  title: "マイページ",
};

export default async function Page() {
  const [session, profile, usage] = await Promise.all([
    auth(),
    fetchMyProfile(),
    fetchGenerateSourceUsage(),
  ]);

  const nickname = profile?.attributes.nickname ?? session?.user?.nickname ?? "";
  const initial = nickname.charAt(0).toUpperCase() || "?";

  return (
    <Box maxWidth={640} mx="auto">
      <Typography variant="h4" component="h1" mb={3}>
        マイページ
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        {/* アバター + アカウント情報 */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
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
          <Box flex={1}>
            <NicknameForm nickname={nickname} />
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" flexDirection="column" gap={0.5}>
          <Typography variant="body2" color="text.secondary">
            メール: {profile?.attributes.email ?? session?.user?.email ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            登録日:{" "}
            {profile?.attributes.created_at
              ? new Date(profile.attributes.created_at).toLocaleDateString(
                  "ja-JP",
                )
              : "—"}
          </Typography>
        </Box>
      </Paper>

      {/* 活動サマリー */}
      {profile && (
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <ActivitySummary
            sangakuCount={profile.attributes.sangaku_count}
            dedicatedSangakuCount={profile.attributes.dedicated_sangaku_count}
            savedSangakuCount={profile.attributes.saved_sangaku_count}
            answerCount={profile.attributes.answer_count}
          />
        </Paper>
      )}

      {/* AI生成利用状況 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          AI生成利用状況
        </Typography>
        {usage ? (
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography variant="body2">
              本日の残り生成回数:{" "}
              <Box
                component="span"
                sx={{ color: usage.remaining === 0 ? "error.main" : "inherit" }}
              >
                {usage.remaining} / {usage.limit}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              リセット時刻:{" "}
              {new Date(usage.reset_at).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            利用状況を取得できませんでした
          </Typography>
        )}
      </Paper>

      {/* プライバシー設定 */}
      {profile && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <PrivacySettingsCard
            showAnswerCount={profile.attributes.show_answer_count}
          />
        </Paper>
      )}
    </Box>
  );
}
