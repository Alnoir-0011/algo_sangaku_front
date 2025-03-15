import { type DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    idToken?: string | null;
  }

  interface JWT extends DefaultJWT {
    idToken?: string | null;
  }

  interface User extends DefaultUser {
    nickname?: string;
  }
}
