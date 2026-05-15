import { redirect } from "next/navigation";
import { readSessionFromCookies } from "@/lib/auth";
import { donationSeed } from "@/lib/mock-data";

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
  const donations = donationSeed.filter(
    (donation) => donation.organizationId === authedSession.organizationId,
  );

  const total = donations.reduce((sum, donation) => sum + donation.amountUsd, 0);

  return (
    <main className="shell">
      <section className="card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 style={{ marginTop: 4, marginBottom: 6 }}>{authedSession.organizationId}</h1>
            <p style={{ marginTop: 0, color: "var(--muted)" }}>Total received: {money(total)}</p>
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
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td>{donation.id}</td>
                <td>{donation.donorName}</td>
                <td>{money(donation.amountUsd)}</td>
                <td>{new Date(donation.donatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
