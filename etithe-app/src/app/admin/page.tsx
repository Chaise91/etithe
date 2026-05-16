import { redirect } from "next/navigation";
import { donationSeed } from "@/lib/mock-data";
import { readSessionFromCookies } from "@/lib/auth";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default async function AdminPage() {
  const session = await readSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "org_admin") {
    redirect("/dashboard");
  }

  const totalVolume = donationSeed.reduce((sum, donation) => sum + donation.amountUsd, 0);
  const organizations = new Map(
    donationSeed.map((donation) => [donation.organizationId, donation.organizationName]),
  );

  const donationsByOrg = donationSeed.reduce<Record<string, number>>((acc, donation) => {
    acc[donation.organizationId] = (acc[donation.organizationId] ?? 0) + 1;
    return acc;
  }, {});

  const recentActivity = [...donationSeed]
    .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime())
    .slice(0, 5);

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
            <h2>{money(totalVolume)}</h2>
          </article>
          <article className="stat-card">
            <p>Organizations Onboarded</p>
            <h2>{organizations.size}</h2>
          </article>
          <article className="stat-card">
            <p>Recorded Donations</p>
            <h2>{donationSeed.length}</h2>
          </article>
          <article className="stat-card">
            <p>Admin Session</p>
            <h2>{session.userId}</h2>
          </article>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Organization Directory</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Org ID</th>
              <th>Donations</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(organizations.entries()).map(([id, name]) => (
              <tr key={id}>
                <td>{name}</td>
                <td>{id}</td>
                <td>{donationsByOrg[id] ?? 0}</td>
                <td>
                  <span className="status-pill">Active</span>
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
            {recentActivity.map((donation) => (
              <tr key={donation.id}>
                <td>{donation.id}</td>
                <td>{donation.donorName}</td>
                <td>{donation.organizationName}</td>
                <td>{money(donation.amountUsd)}</td>
                <td>{formatDate(donation.donatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}