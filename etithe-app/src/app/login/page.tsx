"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@church.org");
  const [password, setPassword] = useState("changeme");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Login failed" }));
      setError(body.message ?? "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 460 }}>
        <p className="eyebrow">Sign in</p>
        <h1>Organization Access</h1>
        <p>Use the demo credentials from .env.example to sign in locally.</p>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
            Need to register your organization?{" "}
            <a href="/onboarding" style={{ color: "var(--accent)", textDecoration: "underline" }}>
              Submit an onboarding request
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
