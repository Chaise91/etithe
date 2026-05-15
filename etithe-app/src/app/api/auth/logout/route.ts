import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

async function handleLogout(request: Request) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url));
}

export const POST = withRequestLogging("api/auth/logout", handleLogout);
