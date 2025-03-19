import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { JWTDecodeParams, JWTEncodeParams } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const providers = [Google];

const jwtTestEnv = {
  async encode(params: JWTEncodeParams<JWT>): Promise<string> {
    return btoa(JSON.stringify(params.token));
  },
  async decode(params: JWTDecodeParams): Promise<JWT | null> {
    if (!params.token) return {};
    return JSON.parse(atob(params.token));
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  ...(process.env.APP_ENV === "test" ? { jwt: jwtTestEnv } : {}),
  providers,
  callbacks: {
    async signIn({ account, user }) {
      const provider = account?.provider;
      const uid = account?.providerAccountId;
      const name = user?.name;
      const email = user?.email;

      try {
        const response = await fetch(`${apiUrl}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: { provider, uid, name, email } }),
        });

        if (response.status == 200) {
          const data = await response.json();
          user.nickname = data.data.attributes.nickname;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    jwt({ token, account, user }) {
      if (account) {
        token.idToken = account?.id_token;
      }
      if (user) {
        token.nickname = user?.nickname;
      }
      return token;
    },
    async session({ token, session }) {
      session.idToken = token.idToken as string;
      session.user.nickname = token.nickname as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
