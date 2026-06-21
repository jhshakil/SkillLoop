import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/login",
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email!,
            name: user.name ?? "",
            image: user.image,
            role: user.role,
            isApproved: user.isApproved,
          };
        } catch (err) {
          console.error("[AUTH] Authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role as string | undefined;
      const pathname = nextUrl.pathname;

      const isProtected =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/moderator") ||
        pathname.startsWith("/user");

      if (!isLoggedIn && isProtected) return false;
      if (pathname.startsWith("/admin") && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return false;
      if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") return false;
      if (pathname.startsWith("/moderator") && userRole !== "MODERATOR" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return false;
      if ((pathname === "/login" || pathname === "/register") && isLoggedIn) return false;

      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.isApproved = (user as { isApproved?: boolean }).isApproved ?? false;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      // Refresh profile data from database when session is updated
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true },
          });
          if (dbUser) {
            token.name = dbUser.name ?? "";
            token.picture = dbUser.image ?? null;
          }
        } catch { /* ignore */ }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isApproved = token.isApproved as boolean;
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        // Allow sign-in if user doesn't exist yet, or if the account is already linked.
        // PrismaAdapter handles user creation and account linking automatically.
        if (existingUser) {
          // Check if this Google account is already linked to the user
          const linkedAccount = await prisma.account.findFirst({
            where: { userId: existingUser.id, provider: "google" },
          });
          // If not linked yet, allow linking (PrismaAdapter will create the Account record)
          if (!linkedAccount) return true;
        }
      }
      return true;
    },
  },
});
