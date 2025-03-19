import { signIn } from "@/auth";
import { Box, Button, Paper, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function Login() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          ログイン
        </Typography>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <Button variant="contained" type="submit" sx={{ bgcolor: "#4285F4" }}>
            <GoogleIcon sx={{ mr: 1 }} />
            Googleでログイン
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
