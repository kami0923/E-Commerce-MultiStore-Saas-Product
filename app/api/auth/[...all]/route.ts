import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export async function POST(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-up/email")) {
    return Response.json({ message: "Accounts are created by invitation only." }, { status: 403 });
  }
  return handler.POST(request);
}
