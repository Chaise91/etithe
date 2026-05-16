import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, organizations } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";
import { withRequestLogging } from "@/lib/request-logging";

async function handleDonations(request: Request) {
  const session = await readSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId") ?? session.organizationId;

  const db = getDb();
  const rows = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      amountCents: donations.amountCents,
      donatedAt: donations.donatedAt,
      organizationId: donations.organizationId,
      organizationName: organizations.name,
    })
    .from(donations)
    .innerJoin(organizations, eq(donations.organizationId, organizations.id))
    .where(eq(donations.organizationId, organizationId));

  const totalCents = rows.reduce((sum, d) => sum + d.amountCents, 0);

  return NextResponse.json({
    organizationId,
    totalCents,
    totalUsd: totalCents / 100,
    donations: rows.map((d) => ({
      id: d.id,
      donorName: d.donorName,
      amountUsd: d.amountCents / 100,
      donatedAt: d.donatedAt,
      organizationId: d.organizationId,
      organizationName: d.organizationName,
    })),
  });
}

export const GET = withRequestLogging("api/donations", handleDonations);
