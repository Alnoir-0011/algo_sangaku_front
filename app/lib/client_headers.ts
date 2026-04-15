export function buildHeaders(accessToken?: string | null): Record<string, string> {
  const clientSecret = process.env.CLIENT_SECRET ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (clientSecret !== null) {
    headers["X-Client-Secret"] = clientSecret;
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}
