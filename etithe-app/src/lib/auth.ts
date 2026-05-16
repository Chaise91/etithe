import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const SESSION_COOKIE = "etithe_session";

export type SessionClaims = {
  userId: string;
  organizationId: string;
  role: "platform_admin" | "org_admin" | "parishioner";
};

const FALLBACK_EMAIL = "admin@church.org";
const FALLBACK_PASSWORD = "changeme";

export function validateCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.AUTH_DEMO_EMAIL ?? FALLBACK_EMAIL;
  const expectedPassword = process.env.AUTH_DEMO_PASSWORD ?? FALLBACK_PASSWORD;
  return email === expectedEmail && password === expectedPassword;
}

export function buildSession(email: string, organizationId: string, role: SessionClaims["role"]): SessionClaims {
  return { userId: email, organizationId, role };
}

export async function buildSessionFromDb(email: string): Promise<SessionClaims | null> {
  const db = getDb();
  const rows = await db
    .select({ organizationId: users.organizationId, role: users.role })
    .from(users)
    .where(eq(users.id, email));

  if (rows.length === 0) return null;

  const { organizationId, role } = rows[0];
  const mappedRole: SessionClaims["role"] =
    role === "org_admin" || role === "parishioner" ? role : "parishioner";

  return { userId: email, organizationId, role: mappedRole };
}

export function encodeSession(session: SessionClaims): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function shouldUseSecureCookies(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function decodeSession(value: string | undefined): SessionClaims | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(decoded) as SessionClaims;
  } catch {
    return null;
  }
}

export async function readSessionFromCookies(): Promise<SessionClaims | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
