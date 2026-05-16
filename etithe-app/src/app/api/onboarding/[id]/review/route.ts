import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getDb } from "@/db";
import { onboardingRequests, organizations, auditLog } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

const reviewSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected"]),
  notes: z.string().optional(),
});

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

async function handlePatch(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await readSessionFromCookies();
  if (!session || (session.role !== "org_admin" && session.role !== "platform_admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, notes } = parsed.data;
  const db = getDb();

  try {
    // Get current request
    const rows = await db
      .select()
      .from(onboardingRequests)
      .where(eq(onboardingRequests.id, id));

    if (rows.length === 0) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const currentRequest = rows[0];

    // Update onboarding request
    await db
      .update(onboardingRequests)
      .set({
        status: status as any,
        reviewedAt: new Date(),
        reviewedBy: session.userId,
        notes: notes || null,
      })
      .where(eq(onboardingRequests.id, id));

    // If approved, update the organization status
    if (status === "approved") {
      await db
        .update(organizations)
        .set({ status: "approved" })
        .where(eq(organizations.id, currentRequest.organizationId));
    }

    // Audit log
    await db.insert(auditLog).values({
      id: randomId("audit"),
      action: `onboarding_${status}`,
      actorId: session.userId,
      targetType: "onboarding_request",
      targetId: id,
      metadata: {
        organizationId: currentRequest.organizationId,
        previousStatus: currentRequest.status,
        newStatus: status,
        notes,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Onboarding request ${status}`,
    });
  } catch (error) {
    console.error("Onboarding review error:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}

export { handlePatch as PATCH };
