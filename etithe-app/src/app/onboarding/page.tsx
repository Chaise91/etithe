"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const organizationName = formData.get("organizationName") as string;
    const contactEmail = formData.get("contactEmail") as string;
    const slug = formData.get("slug") as string;

    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          contactEmail,
          slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="shell">
        <section className="card">
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2>Thank you!</h2>
            <p style={{ marginTop: 8, color: "var(--muted)" }}>
              Your onboarding request has been submitted and is under review. 
              We&apos;ll be in touch shortly.
            </p>
            <p style={{ marginTop: 16, fontSize: "0.9em", color: "var(--muted)" }}>
              Redirecting to login...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="card">
        <h1 style={{ marginBottom: 24 }}>Join eTithe</h1>
        <p style={{ marginBottom: 24, color: "var(--muted)" }}>
          Register your faith community to begin collecting donations through eTithe.
        </p>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              color: "#c00",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="organizationName" style={{ display: "block", marginBottom: 4 }}>
              Organization Name
            </label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="e.g., St. Mark Church"
              required
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="slug" style={{ display: "block", marginBottom: 4 }}>
              Organization Slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              placeholder="e.g., st-mark-church"
              required
              disabled={loading}
              style={{ width: "100%" }}
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
            />
            <p style={{ marginTop: 4, fontSize: "0.85em", color: "var(--muted)" }}>
              Used for your unique organization URL
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="contactEmail" style={{ display: "block", marginBottom: 4 }}>
              Contact Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              placeholder="admin@example.com"
              required
              disabled={loading}
              style={{ width: "100%" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button primary"
            style={{ width: "100%" }}
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: "0.9em", color: "var(--muted)", textAlign: "center" }}>
          Already registered?{" "}
          <Link href="/login" style={{ textDecoration: "underline", color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
