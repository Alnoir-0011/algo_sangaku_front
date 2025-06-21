import { type DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string | null;
  }

  interface JWT extends DefaultJWT {
    accessToken?: string | null;
  }

  interface User extends DefaultUser {
    nickname?: string;
    accessToken?: string;
  }
}
