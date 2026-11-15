import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { securityEmailConfigured, sendSecurityEmail } from "@/lib/security-email";

const authBaseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const trustedOrigins = [...new Set([
  authBaseURL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.AUTH_TRUSTED_ORIGIN,
].filter((origin): origin is string => Boolean(origin)))];
const emailDeliveryReady = securityEmailConfigured();

export const auth = betterAuth({
  appName: "Meridian Commerce",
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => { await sendSecurityEmail({ recipient: user.email, name: user.name, url, kind: "password-reset" }); },
    onPasswordReset: async ({ user }) => { await db.securityEvent.create({ data: { userId: user.id, action: "password.reset", summary: "Password reset completed; existing sessions were revoked" } }); },
  },
  emailVerification: {
    sendOnSignUp: emailDeliveryReady,
    sendOnSignIn: emailDeliveryReady,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => { await sendSecurityEmail({ recipient: user.email, name: user.name, url, kind: "email-verification" }); },
    afterEmailVerification: async user => { await db.securityEvent.create({ data: { userId: user.id, action: "email.verified", summary: "Account email address verified" } }); },
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
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 6 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
      "/send-verification-email": { window: 300, max: 3 },
    },
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
