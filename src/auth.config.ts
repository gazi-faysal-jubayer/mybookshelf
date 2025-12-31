import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                // id is not on standard session user
                session.user.id = token.sub;
            }
            return session;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
