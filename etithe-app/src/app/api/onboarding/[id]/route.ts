import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { onboardingRequests, organizations } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";

async function handleGet(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await readSessionFromCookies();
  if (!session || (session.role !== "org_admin" && session.role !== "platform_admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: onboardingRequests.id,
      organizationId: onboardingRequests.organizationId,
      organizationName: organizations.name,
      contactEmail: organizations.contactEmail,
      status: onboardingRequests.status,
      submittedAt: onboardingRequests.submittedAt,
      reviewedAt: onboardingRequests.reviewedAt,
      reviewedBy: onboardingRequests.reviewedBy,
      notes: onboardingRequests.notes,
    })
    .from(onboardingRequests)
    .innerJoin(
      organizations,
      eq(onboardingRequests.organizationId, organizations.id)
    )
    .where(eq(onboardingRequests.id, id));

  if (rows.length === 0) {
    return NextResponse.json({ message: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({ request: rows[0] });
}

export { handleGet as GET };
