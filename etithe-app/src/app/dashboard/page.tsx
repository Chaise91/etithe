import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, organizations } from "@/db/schema";
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

  const [orgRows, donationRows] = await Promise.all([
    db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, authedSession.organizationId)),
    db
      .select()
      .from(donations)
      .where(eq(donations.organizationId, authedSession.organizationId)),
  ]);

  const orgName = orgRows[0]?.name ?? authedSession.organizationId;
  const totalUsd = donationRows.reduce((sum, d) => sum + d.amountCents / 100, 0);

  return (
    <main className="shell">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 style={{ marginTop: 4, marginBottom: 6 }}>{orgName}</h1>
            <p style={{ marginTop: 0, color: "var(--muted)" }}>Total received: {money(totalUsd)}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="button ghost" type="submit">
              Sign out
            </button>
          </form>
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
