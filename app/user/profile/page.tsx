import Form from "@/app/ui/profile/edit-form";
import { auth } from "@/auth";
import { Box, Typography } from "@mui/material";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

export default async function Page() {
  const session = await auth();

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={2}>
        プロフィール編集
      </Typography>
      <Form user={session!.user!} />
    </Box>
  );
}
