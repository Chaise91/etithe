"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  organizationName: string;
  slug: string;
  contactEmail: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Organization", "Contact", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="wizard-steps">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div
            key={label}
            className="wizard-step"
            style={{ flex: i < STEP_LABELS.length - 1 ? 1 : undefined }}
          >
            <div className={`step-dot${done ? " done" : active ? " active" : ""}`}>
              {done ? "✓" : num}
            </div>
            <span className={`step-label${active ? " active" : ""}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`step-connector${done ? " done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🏛️</div>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Get started</p>
      <h1 style={{ margin: "0 0 16px" }}>Welcome to eTithe</h1>
      <p style={{ color: "var(--muted)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6 }}>
        Set up your faith community in a few quick steps. We'll review your application
        and have you collecting tithes in no time.
      </p>
      <button
        className="button primary"
        style={{ fontSize: "1rem", padding: "12px 28px" }}
        onClick={onStart}
      >
        Get started →
      </button>
      <p style={{ marginTop: 20, fontSize: "0.88rem", color: "var(--muted)" }}>
        Already registered?{" "}
        <Link href="/login" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ─── Step 1: Organization ─────────────────────────────────────────────────────

type OrgStepProps = {
  values: FormValues;
  onChange: (field: keyof FormValues, value: string) => void;
  slugManuallyEdited: boolean;
  onSlugManualEdit: () => void;
  onNext: () => void;
  onBack: () => void;
};

function OrgStep({ values, onChange, slugManuallyEdited, onSlugManualEdit, onNext, onBack }: OrgStepProps) {
  function handleNameChange(value: string) {
    onChange("organizationName", value);
    if (!slugManuallyEdited) {
      onChange("slug", slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    onSlugManualEdit();
    onChange("slug", value.replace(/[^a-z0-9-]/g, "").slice(0, 40));
  }

  const canProceed =
    values.organizationName.trim().length > 0 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(values.slug);

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Step 1 of 3</p>
      <h2 style={{ margin: "0 0 6px" }}>Your organization</h2>
      <p style={{ margin: "0 0 28px", color: "var(--muted)" }}>
        Tell us the name of your faith community.
      </p>

      <div className="form">
        <label className="field">
          Organization name
          <input
            type="text"
            value={values.organizationName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., St. Mark Church"
            autoFocus
          />
        </label>

        <label className="field">
          Organization slug
          <input
            type="text"
            value={values.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g., st-mark-church"
          />
          <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
            Your unique URL:{" "}
            <code style={{ background: "var(--bg)", padding: "1px 5px", borderRadius: 4 }}>
              etithe.io/{values.slug || "your-slug"}
            </code>
          </span>
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="button ghost" onClick={onBack}>
          ← Back
        </button>
        <button
          className="button primary"
          onClick={onNext}
          disabled={!canProceed}
          style={{ flex: 1 }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Contact ──────────────────────────────────────────────────────────

type ContactStepProps = {
  values: FormValues;
  onChange: (field: keyof FormValues, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

function ContactStep({ values, onChange, onNext, onBack }: ContactStepProps) {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail);

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Step 2 of 3</p>
      <h2 style={{ margin: "0 0 6px" }}>Contact information</h2>
      <p style={{ margin: "0 0 28px", color: "var(--muted)" }}>
        We'll send your approval status and next steps here.
      </p>

      <div className="form">
        <label className="field">
          Contact email
          <input
            type="email"
            value={values.contactEmail}
            onChange={(e) => onChange("contactEmail", e.target.value)}
            placeholder="admin@yourcommunity.org"
            autoFocus
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="button ghost" onClick={onBack}>
          ← Back
        </button>
        <button
          className="button primary"
          onClick={onNext}
          disabled={!emailValid}
          style={{ flex: 1 }}
        >
          Review →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

type ReviewStepProps = {
  values: FormValues;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
};

function ReviewRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "12px 16px",
        borderBottom: last ? "none" : "1px solid var(--line)",
        gap: 16,
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: "0.9rem", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function ReviewStep({ values, onBack, onSubmit, loading, error }: ReviewStepProps) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Step 3 of 3</p>
      <h2 style={{ margin: "0 0 6px" }}>Review & submit</h2>
      <p style={{ margin: "0 0 24px", color: "var(--muted)" }}>
        Confirm your details before we send your application for review.
      </p>

      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <ReviewRow label="Organization name" value={values.organizationName} />
        <ReviewRow label="URL slug" value={`etithe.io/${values.slug}`} />
        <ReviewRow label="Contact email" value={values.contactEmail} last />
      </div>

      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="button ghost" onClick={onBack} disabled={loading}>
          ← Back
        </button>
        <button
          className="button primary"
          onClick={onSubmit}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Submitting…" : "Submit application →"}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: "0 0 12px" }}>You're on the list!</h2>
        <p style={{ color: "var(--muted)", maxWidth: 380, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Your onboarding request is under review. We'll reach out to your contact email
          once you're approved.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" className="button ghost">
            Back to home
          </Link>
          <Link href="/login" className="button primary">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [formData, setFormData] = useState<FormValues>({
    organizationName: "",
    slug: "",
    contactEmail: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function goNext() {
    setDir("fwd");
    setStep((s) => s + 1);
  }

  function goBack() {
    setDir("back");
    setStep((s) => s - 1);
  }

  function updateField(field: keyof FormValues, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <SuccessScreen />;

  return (
    <main className="shell">
      <section className="card wizard-card">
        {step > 0 && <StepIndicator current={step} />}

        <div key={step} className={dir === "fwd" ? "slide-in" : "slide-in-back"}>
          {step === 0 && <WelcomeStep onStart={goNext} />}
          {step === 1 && (
            <OrgStep
              values={formData}
              onChange={updateField}
              slugManuallyEdited={slugManuallyEdited}
              onSlugManualEdit={() => setSlugManuallyEdited(true)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <ContactStep
              values={formData}
              onChange={updateField}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <ReviewStep
              values={formData}
              onBack={goBack}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </section>
    </main>
  );
}
