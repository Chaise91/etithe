/**
 * Idempotent seed script for development and CI environments.
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npm run db:seed
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── Seed data ────────────────────────────────────────────────────────────────

const seedOrganizations: schema.NewOrganization[] = [
  {
    id: "org_platform",
    name: "eTithe Platform",
    slug: "etithe-platform",
    status: "approved",
    contactEmail: "root@etithe.io",
  },
  {
    id: "org_st_mark",
    name: "St. Mark Church",
    slug: "st-mark-church",
    status: "approved",
    contactEmail: "admin@stmark.org",
  },
  {
    id: "org_grace_fellowship",
    name: "Grace Fellowship",
    slug: "grace-fellowship",
    status: "approved",
    contactEmail: "admin@gracefellowship.org",
  },
];

const seedUsers: schema.NewUser[] = [
  {
    id: "root@etithe.io",
    organizationId: "org_platform",
    role: "platform_admin",
  },
  {
    id: "admin@church.org",
    organizationId: "org_st_mark",
    role: "org_admin",
  },
];

// amountUsd from mock-data converted to cents (integer, avoids float issues)
const seedDonations: schema.NewDonation[] = [
  {
    id: "d_1001",
    donorName: "Angela Morrison",
    amountCents: 12500,
    donatedAt: new Date("2026-04-01T14:20:00Z"),
    organizationId: "org_st_mark",
  },
  {
    id: "d_1002",
    donorName: "Evan Rivera",
    amountCents: 4500,
    donatedAt: new Date("2026-04-02T18:05:00Z"),
    organizationId: "org_st_mark",
  },
  {
    id: "d_1003",
    donorName: "Mina Patel",
    amountCents: 21000,
    donatedAt: new Date("2026-04-02T19:41:00Z"),
    organizationId: "org_grace_fellowship",
  },
  {
    id: "d_1004",
    donorName: "Noah Lee",
    amountCents: 8000,
    donatedAt: new Date("2026-04-03T09:11:00Z"),
    organizationId: "org_st_mark",
  },
];

const seedOnboardingRequests: schema.NewOnboardingRequest[] = [
  {
    id: "onb_001",
    organizationId: "org_st_mark",
    status: "approved",
    submittedAt: new Date("2026-01-10T09:00:00Z"),
    reviewedAt: new Date("2026-01-12T14:00:00Z"),
    reviewedBy: "admin@church.org",
    notes: "All documentation verified. Approved.",
  },
  {
    id: "onb_002",
    organizationId: "org_grace_fellowship",
    status: "approved",
    submittedAt: new Date("2026-02-01T10:00:00Z"),
    reviewedAt: new Date("2026-02-03T11:30:00Z"),
    reviewedBy: "admin@church.org",
    notes: "Reviewed and approved.",
  },
];

const seedAuditLog: schema.NewAuditLogEntry[] = [
  {
    id: crypto.randomUUID(),
    action: "org.approved",
    actorId: "admin@church.org",
    targetType: "organization",
    targetId: "org_st_mark",
    metadata: { onboardingRequestId: "onb_001" },
  },
  {
    id: crypto.randomUUID(),
    action: "org.approved",
    actorId: "admin@church.org",
    targetType: "organization",
    targetId: "org_grace_fellowship",
    metadata: { onboardingRequestId: "onb_002" },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding database…");

  // Run in a transaction so partial seeds don't leave inconsistent state
  await db.transaction(async (tx) => {
    // Organizations must come first (FK root)
    await tx
      .insert(schema.organizations)
      .values(seedOrganizations)
      .onConflictDoNothing();
    console.log(`  ✓ organizations (${seedOrganizations.length})`);

    await tx
      .insert(schema.users)
      .values(seedUsers)
      .onConflictDoNothing();
    console.log(`  ✓ users (${seedUsers.length})`);

    await tx
      .insert(schema.donations)
      .values(seedDonations)
      .onConflictDoNothing();
    console.log(`  ✓ donations (${seedDonations.length})`);

    await tx
      .insert(schema.onboardingRequests)
      .values(seedOnboardingRequests)
      .onConflictDoNothing();
    console.log(`  ✓ onboarding_requests (${seedOnboardingRequests.length})`);

    // Audit log IDs are random UUIDs — always insert fresh entries
    const existingCount = await tx
      .select({ count: sql<number>`count(*)` })
      .from(schema.auditLog);
    if (Number(existingCount[0]?.count) === 0) {
      await tx.insert(schema.auditLog).values(seedAuditLog);
      console.log(`  ✓ audit_log (${seedAuditLog.length})`);
    } else {
      console.log("  ~ audit_log skipped (already has data)");
    }
  });

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
