import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ account, user }) {
      const provider = account?.provider;
      const uid = user?.id;
      const name = user?.name;
      const email = user?.email;

      try {
        const response = await fetch(`${apiUrl}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: { provider, uid, name, email } }),
        });

        if (response.status == 200) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  },
});
