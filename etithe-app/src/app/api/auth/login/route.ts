import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildSession,
  buildSessionFromDb,
  encodeSession,
  SESSION_COOKIE,
  shouldUseSecureCookies,
  validateCredentials,
  validatePlatformAdminCredentials,
} from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function handleLogin(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid login payload" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Platform admin credentials → root session (checked first to avoid DB lookup)
  if (validatePlatformAdminCredentials(email, password)) {
    const session = (await buildSessionFromDb(email)) ??
      buildSession(email, "org_platform", "platform_admin");
    const sessionToken = encodeSession(session);
    const store = await cookies();
    store.set({
      name: SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(request),
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return NextResponse.json({ ok: true });
  }

  // Org user credentials
  if (!validateCredentials(email, password)) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  // Try to resolve the session from the database; fall back to demo org if DB user not found.
  const session =
    (await buildSessionFromDb(email)) ??
    buildSession(email, "org_st_mark", "org_admin");
  const sessionToken = encodeSession(session);
  const store = await cookies();
  const secure = shouldUseSecureCookies(request);

  store.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}

export const POST = withRequestLogging("api/auth/login", handleLogin);
