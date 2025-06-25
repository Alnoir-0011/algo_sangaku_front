import { redirect } from "next/navigation";
import { providerMap, signIn } from "@/auth";
import { Box, Button, Paper, Typography } from "@mui/material";
import { AuthError } from "next-auth";
import GoogleIcon from "@mui/icons-material/Google";

const SIGNIN_ERROR_URL = "/error";

interface Props {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}

export default async function Login(props: Props) {
  const searchParams = await props.searchParams;
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
        {Object.values(providerMap).map((provider) => (
          <form
            key={provider.id}
            action={async () => {
              "use server";
              try {
                await signIn(provider.id, {
                  redirectTo: searchParams.callbackUrl ?? "",
                });
              } catch (error) {
                if (error instanceof AuthError) {
                  return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
                }
                throw error;
              }
            }}
          >
            <Button
              variant="contained"
              type="submit"
              sx={{ bgcolor: "#4285F4" }}
            >
              {provider.id === "google" && <GoogleIcon sx={{ mr: 1 }} />}
              <span>{provider.name}でログイン</span>
            </Button>
          </form>
        ))}
      </Paper>
    </Box>
  );
}
