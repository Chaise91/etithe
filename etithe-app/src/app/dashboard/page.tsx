import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, onboardingRequests, organizations } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const session = await readSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  const authedSession = session;
  const db = getDb();

  const [orgRows, donationRows, requestRows] = await Promise.all([
    db
      .select({ name: organizations.name, status: organizations.status })
      .from(organizations)
      .where(eq(organizations.id, authedSession.organizationId)),
    db
      .select()
      .from(donations)
      .where(eq(donations.organizationId, authedSession.organizationId)),
    db
      .select({
        id: onboardingRequests.id,
        status: onboardingRequests.status,
        submittedAt: onboardingRequests.submittedAt,
        reviewedAt: onboardingRequests.reviewedAt,
      })
      .from(onboardingRequests)
      .where(eq(onboardingRequests.organizationId, authedSession.organizationId))
      .orderBy(desc(onboardingRequests.submittedAt))
      .limit(1),
  ]);

  const orgName = orgRows[0]?.name ?? authedSession.organizationId;
  const orgStatus = orgRows[0]?.status ?? "draft";
  const latestRequest = requestRows[0];
  const totalUsd = donationRows.reduce((sum, d) => sum + d.amountCents / 100, 0);

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const visibleStatus = latestRequest?.status ?? orgStatus;

  return (
    <main className="shell">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 style={{ marginTop: 4, marginBottom: 6 }}>{orgName}</h1>
            <p style={{ marginTop: 0, color: "var(--muted)" }}>Total received: {money(totalUsd)}</p>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            {(authedSession.role === "org_admin" || authedSession.role === "platform_admin") && (
              <Link className="button ghost" href="/admin/onboarding">
                Onboarding workflow
              </Link>
            )}
            {authedSession.role === "platform_admin" && (
              <Link className="button ghost" href="/admin">
                Platform admin
              </Link>
            )}
            <form action="/api/auth/logout" method="post">
              <button className="button ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            marginBottom: 12,
            padding: "12px 16px",
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "#f7faf6",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            Onboarding status: {statusLabel[visibleStatus] ?? visibleStatus}
          </p>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            {latestRequest
              ? `Latest request ${latestRequest.id} submitted ${new Date(latestRequest.submittedAt).toLocaleDateString()}.`
              : "No onboarding request found for this organization yet."}
          </p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Donation ID</th>
              <th>Donor</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {donationRows.map((donation) => (
              <tr key={donation.id}>
                <td>{donation.id}</td>
                <td>{donation.donorName}</td>
                <td>{money(donation.amountCents / 100)}</td>
                <td>{new Date(donation.donatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
