import { NextResponse } from "next/server";
import { withRequestLogging } from "@/lib/request-logging";

async function handleHealthCheck() {
  return NextResponse.json({ status: "ok" });
}

export const GET = withRequestLogging("api/health", handleHealthCheck);
