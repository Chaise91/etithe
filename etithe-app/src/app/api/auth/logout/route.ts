import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, shouldUseSecureCookies } from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

async function handleLogout(request: Request) {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 0,
  });

  return NextResponse.redirect(new URL("/login", request.url));
}

export const POST = withRequestLogging("api/auth/logout", handleLogout);
