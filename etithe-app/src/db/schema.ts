import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orgStatusEnum = pgEnum("org_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
]);

export const userRoleEnum = pgEnum("user_role", [
  "platform_admin",
  "org_admin",
  "parishioner",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: orgStatusEnum("status").notNull().default("draft"),
  contactEmail: text("contact_email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // email address
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: userRoleEnum("role").notNull().default("parishioner"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Donations store amounts in cents (integer) to avoid floating-point issues.
 * Use amountCents / 100 to display as dollars.
 */
export const donations = pgTable("donations", {
  id: text("id").primaryKey(),
  donorName: text("donor_name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  donatedAt: timestamp("donated_at", { withTimezone: true }).notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tracks the lifecycle of each organization's onboarding request.
 * One active request per organization at a time.
 */
export const onboardingRequests = pgTable("onboarding_requests", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  status: orgStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
});

/**
 * Immutable audit trail. All admin decisions and key state transitions
 * are written here. Never update or delete rows.
 */
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  actorId: text("actor_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;

export type OnboardingRequest = typeof onboardingRequests.$inferSelect;
export type NewOnboardingRequest = typeof onboardingRequests.$inferInsert;

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
