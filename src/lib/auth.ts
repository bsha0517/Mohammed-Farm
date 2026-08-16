import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          farmId: user.farmId,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.farmId = (user as any).farmId;
        token.role = (user as any).role;
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).farmId = token.farmId;
        (session.user as any).role = token.role;
        (session.user as any).id = token.uid;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Server-side helper: returns the current session's farmId + role, or throws. */
export async function requireFarmSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  const { farmId, role, id } = session.user as any;
  return { farmId, role, userId: id, email: session.user.email, name: session.user.name };
}

/**
 * Restricts an action to specific roles. Defaults to Owner-only, since
 * that's the strictest and most common case (financial/terminal actions:
 * sales, mortality, culling, retiring an animal). Pass a wider allow-list
 * for actions Vets should also reach.
 */
export function assertCanDelete(role: string, allow: string[] = ["OWNER"]) {
  if (!allow.includes(role)) {
    throw new Error("Your account role doesn't have permission for this action. Ask the farm owner.");
  }
}
