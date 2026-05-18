import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Electronic Giving Platform</p>
        <h1>eTithe Platform</h1>
        <p>
          Modern, secure giving for faith communities. Organizations manage donation visibility
          while parishioners contribute with confidence.
        </p>
        <div className="actions">
          <Link href="/onboarding" className="button primary">
            Register your community
          </Link>
          <Link href="/login" className="button ghost">
            Sign in
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>Demo access</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/dashboard" className="button ghost" style={{ fontSize: "0.88rem" }}>
            Org dashboard
          </Link>
          <Link href="/admin" className="button ghost" style={{ fontSize: "0.88rem" }}>
            Admin portal
          </Link>
          <Link href="/admin/onboarding" className="button ghost" style={{ fontSize: "0.88rem" }}>
            Onboarding queue
          </Link>
        </div>
        <p style={{ marginTop: 12, fontSize: "0.84rem", color: "var(--muted)" }}>
          Sign in with <code>admin@church.org</code> / <code>changeme</code> to explore.
        </p>
      </section>
    </main>
  );
}
