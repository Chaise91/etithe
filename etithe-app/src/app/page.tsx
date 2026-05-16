import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">MVP</p>
        <h1>eTithe Platform</h1>
        <p>
          Organizations can manage donation visibility while parishioners contribute securely.
          This starter build includes demo auth and donation dashboards.
        </p>
        <div className="actions">
          <Link href="/login" className="button primary">
            Sign in
          </Link>
          <Link href="/admin" className="button ghost">
            Admin portal
          </Link>
          <Link href="/dashboard" className="button ghost">
            View dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
