import { redirect } from "next/navigation";
import { desc, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, organizations, onboardingRequests } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

export default async function AdminPage() {
  const session = await readSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "org_admin" && session.role !== "platform_admin") {
    redirect("/dashboard");
  }

  const db = getDb();

  const [orgRows, donationRows, pendingRequests] = await Promise.all([
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        status: organizations.status,
        donationCount: sql<number>`cast(count(${donations.id}) as int)`,
        totalCents: sql<number>`cast(coalesce(sum(${donations.amountCents}), 0) as int)`,
      })
      .from(organizations)
      .leftJoin(donations, sql`${donations.organizationId} = ${organizations.id}`)
      .where(ne(organizations.id, "org_platform"))
      .groupBy(organizations.id),
    db
      .select({
        id: donations.id,
        donorName: donations.donorName,
        amountCents: donations.amountCents,
        donatedAt: donations.donatedAt,
        organizationId: donations.organizationId,
        organizationName: organizations.name,
      })
      .from(donations)
      .innerJoin(organizations, sql`${donations.organizationId} = ${organizations.id}`)
      .orderBy(desc(donations.donatedAt))
      .limit(5),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(onboardingRequests)
      .where(sql`${onboardingRequests.status} IN ('submitted', 'under_review')`),
  ]);

  const totalCents = orgRows.reduce((sum, o) => sum + (o.totalCents ?? 0), 0);
  const totalDonations = orgRows.reduce((sum, o) => sum + (o.donationCount ?? 0), 0);
  const pendingCount = pendingRequests[0]?.count ?? 0;

  return (
    <main className="shell">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Site Admin</p>
            <h1 style={{ marginTop: 4, marginBottom: 6 }}>Platform Control Center</h1>
            <p style={{ marginTop: 0, color: "var(--muted)" }}>
              Monitor organizations, donation flow, and operational readiness.
            </p>
          </div>
          <div className="actions">
            <a className="button ghost" href="/dashboard">
              Org Dashboard
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="button primary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <p>Total Donation Volume</p>
            <h2>{money(totalCents / 100)}</h2>
          </article>
          <article className="stat-card">
            <p>Organizations Onboarded</p>
            <h2>{orgRows.length}</h2>
          </article>
          <article className="stat-card">
            <p>Recorded Donations</p>
            <h2>{totalDonations}</h2>
          </article>
          <article className="stat-card">
            <p>{session.role === "platform_admin" ? "Platform Admin" : "Admin Session"}</p>
            <h2>{session.userId}</h2>
          </article>
        </div>

        {pendingCount > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              backgroundColor: "#fff8e1",
              border: "1px solid #ffe082",
              borderRadius: 4,
            }}
          >
            <strong>{pendingCount} onboarding request{pendingCount !== 1 ? "s" : ""} pending review.</strong>{" "}
            <a href="/admin/onboarding" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              Review now →
            </a>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Organization Directory</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Org ID</th>
              <th>Donations</th>
              <th>Volume</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orgRows.map((org) => (
              <tr key={org.id}>
                <td>{org.name}</td>
                <td>{org.id}</td>
                <td>{org.donationCount ?? 0}</td>
                <td>{money((org.totalCents ?? 0) / 100)}</td>
                <td>
                  <span className="status-pill">{org.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Recent Platform Activity</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Donation ID</th>
              <th>Donor</th>
              <th>Organization</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {donationRows.map((donation) => (
              <tr key={donation.id}>
                <td>{donation.id}</td>
                <td>{donation.donorName}</td>
                <td>{donation.organizationName}</td>
                <td>{money(donation.amountCents / 100)}</td>
                <td>{formatDate(donation.donatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}