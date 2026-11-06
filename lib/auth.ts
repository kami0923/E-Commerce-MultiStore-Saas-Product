import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

const authBaseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const trustedOrigins = [...new Set([
  authBaseURL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.AUTH_TRUSTED_ORIGIN,
].filter((origin): origin is string => Boolean(origin)))];

export const auth = betterAuth({
  appName: "Meridian Commerce",
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      platformRole: {
        type: ["USER", "SUPPORT", "SUPER_ADMIN"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 30,
  },
  advanced: {
    database: {
      joins: true,
    },
    useSecureCookies: new URL(authBaseURL).protocol === "https:",
  },
  trustedOrigins,
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
