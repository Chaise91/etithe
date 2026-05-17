import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { onboardingRequests, organizations } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

async function handleList() {
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
    .where(
      inArray(onboardingRequests.status, [
        "submitted",
        "under_review",
        "approved",
        "rejected",
      ])
    );

  return NextResponse.json({
    requests: rows,
  });
}

export const GET = withRequestLogging("api/onboarding/list", handleList);
