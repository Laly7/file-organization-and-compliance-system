import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
   trustHost: true, 
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/common/v2.0`,

      authorization: {
        params: {
          scope:
            "openid profile email offline_access User.Read Files.Read Files.ReadWrite"
        }
      }
    })
  ],

  session: {
    strategy: "jwt" 
  },

  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = (token.accessToken as string) || undefined;

      return session;
    }
  }
});