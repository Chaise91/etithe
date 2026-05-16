import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getDb } from "@/db";
import { organizations, onboardingRequests, auditLog } from "@/db/schema";
import { withRequestLogging } from "@/lib/request-logging";

const submitSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  contactEmail: z.string().email("Valid email is required"),
  slug: z.string().min(1, "Organization slug is required"),
});

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

async function handleSubmit(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid submission", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { organizationName, contactEmail, slug } = parsed.data;
  const db = getDb();

  try {
    // Generate IDs
    const orgId = `org_${slug.toLowerCase()}`;
    const requestId = randomId("onb");

    // Create organization in draft status
    await db.insert(organizations).values({
      id: orgId,
      name: organizationName,
      slug: slug.toLowerCase(),
      status: "draft",
      contactEmail,
    });

    // Create onboarding request
    await db.insert(onboardingRequests).values({
      id: requestId,
      organizationId: orgId,
      status: "submitted",
      submittedAt: new Date(),
    });

    // Audit log entry
    await db.insert(auditLog).values({
      id: randomId("audit"),
      action: "onboarding_submitted",
      actorId: "system",
      targetType: "organization",
      targetId: orgId,
      metadata: {
        organizationName,
        contactEmail,
        requestId,
      },
    });

    return NextResponse.json({
      ok: true,
      organizationId: orgId,
      requestId,
      message: "Onboarding request submitted. Your request is now under review.",
    });
  } catch (error) {
    console.error("Onboarding submission error:", error);
    return NextResponse.json(
      { message: "Failed to submit onboarding request" },
      { status: 500 }
    );
  }
}

export const POST = withRequestLogging("api/onboarding/submit", handleSubmit);
