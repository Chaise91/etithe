import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSession, encodeSession, SESSION_COOKIE, validateCredentials } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid login payload" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  if (!validateCredentials(email, password)) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const session = buildSession(email);
  const sessionToken = encodeSession(session);
  const store = await cookies();

  store.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
