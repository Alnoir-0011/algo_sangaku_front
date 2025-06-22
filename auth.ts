import NextAuth, { User } from "next-auth";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
// テスト用
import Credentials from "next-auth/providers/credentials";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const providers: Provider[] = [Google];

if (process.env.APP_ENV === "test") {
  providers.push(
    Credentials({
      id: "password",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log(credentials);
        if (credentials.password === "password") {
          const user: User = {
            email: "test_user@example.com",
            name: "Test user",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          };
          return user;
        } else {
          return null;
        }
      },
    }),
  );
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "credentials");

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn({ account, user }) {
      // テスト用
      if (process.env.APP_ENV === "test") {
        user.nickname = "test_nickname";
        user.accessToken = "dummy_token";
        return true;
      }

      const idToken = account?.id_token;
      try {
        const response = await fetch(`${apiUrl}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: idToken }),
        });

        if (response.status == 200) {
          const data = await response.json();
          // console.log(response.headers.get("accesstoken"));
          user.nickname = data.data.attributes.nickname;
          user.accessToken = response.headers.get("accesstoken")!;
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
        token.accessToken = user?.accessToken;
      }
      if (user) {
        token.nickname = user?.nickname;
      }
      return token;
    },
    async session({ token, session }) {
      session.accessToken = token.accessToken as string;
      session.user.nickname = token.nickname as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
