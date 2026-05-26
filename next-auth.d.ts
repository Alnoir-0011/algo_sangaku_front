import { type DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string | null;
    role?: "general" | "admin" | null;
  }

  interface User extends DefaultUser {
    nickname?: string;
    accessToken?: string;
    role?: "general" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string | null;
    signedInAt?: number;
    role?: "general" | "admin" | null;
  }
}
