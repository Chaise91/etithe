import { NextResponse } from "next/server";
import { donationSeed } from "@/lib/mock-data";
import { readSessionFromCookies } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await readSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId") ?? session.organizationId;

  const donations = donationSeed.filter((donation) => donation.organizationId === organizationId);
  const total = donations.reduce((sum, donation) => sum + donation.amountUsd, 0);

  return NextResponse.json({
    organizationId,
    total,
    donations,
  });
}
