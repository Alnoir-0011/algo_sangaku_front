import { redirect } from "next/navigation";
import { providerMap, signIn, auth } from "@/auth";
import { Box, Button, Paper, Typography } from "@mui/material";
import { AuthError } from "next-auth";
import GoogleIcon from "@mui/icons-material/Google";
import TextField from "@mui/material/TextField";

const SIGNIN_ERROR_URL = "/error";

interface Props {
  searchParams: { callbackUrl: string | undefined };
}

export default function Login({ searchParams }: Props) {
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
        {process.env.APP_ENV === "test" && (
          <Box sx={{ mb: 3 }}>
            <form
              action={async (formData) => {
                "use server";
                try {
                  await signIn("credentials", formData);
                } catch (error) {
                  if (error instanceof AuthError) {
                    return redirect(`${SIGNIN_ERROR_URL}?.error=${error.type}`);
                  }
                  throw error;
                }
              }}
            >
              <TextField
                fullWidth
                id="standard-basic"
                label="email"
                variant="standard"
              />
              <TextField
                fullWidth
                id="standard-basic"
                label="password"
                variant="standard"
                sx={{ mb: 2 }}
              />
              <div style={{ display: "flex", justifyContent: "end" }}>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{ mr: 0, ml: "auto" }}
                >
                  サインイン
                </Button>
              </div>
            </form>
          </Box>
        )}
        {Object.values(providerMap).map((provider) => (
          <form
            key={provider.id}
            action={async () => {
              "use server";
              try {
                await signIn(provider.id, {
                  redirectTo: searchParams?.callbackUrl ?? "",
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
