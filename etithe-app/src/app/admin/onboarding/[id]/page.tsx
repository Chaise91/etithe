"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OnboardingDetail = {
  id: string;
  organizationId: string;
  organizationName: string;
  contactEmail: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  notes: string | null;
};

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<OnboardingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Fetch the specific onboarding request
    // For MVP, we'll load from a simple endpoint
    fetch(`/api/onboarding/${requestId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.request) {
          setRequest(data.request);
          setNotes(data.request.notes || "");
        } else {
          setError("Request not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load request");
        setLoading(false);
      });
  }, [requestId]);

  async function handleReview(newStatus: "under_review" | "approved" | "rejected") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/onboarding/${requestId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update request");
        return;
      }

      router.push("/admin/onboarding");
    } catch (err) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <section className="card">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </section>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="shell">
        <section className="card">
          <h1>Not Found</h1>
          <p style={{ color: "var(--muted)" }}>{error}</p>
        </section>
      </main>
    );
  }

  const statusColors: Record<string, string> = {
    submitted: "#0066cc",
    under_review: "#ff9900",
    approved: "#009900",
    rejected: "#cc0000",
  };

  const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const bgColor = statusColors[request.status] || "#666";
  const label = statusLabels[request.status] || request.status;

  return (
    <main className="shell">
      <section className="card">
        <div style={{ marginBottom: 24 }}>
          <a
            href="/admin/onboarding"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontSize: "0.9em",
            }}
          >
            ← Back to Requests
          </a>
        </div>

        <h1 style={{ marginBottom: 8 }}>{request.organizationName}</h1>
        <span
          style={{
            display: "inline-block",
            padding: "4px 8px",
            backgroundColor: bgColor,
            color: "white",
            borderRadius: "3px",
            fontSize: "0.85em",
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          {label}
        </span>

        <div style={{ marginBottom: 24, color: "var(--muted)" }}>
          <p>
            <strong>Contact Email:</strong> {request.contactEmail}
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(request.submittedAt).toLocaleString()}
          </p>
          {request.reviewedAt && (
            <p>
              <strong>Reviewed:</strong>{" "}
              {new Date(request.reviewedAt).toLocaleString()}
            </p>
          )}
        </div>

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

        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="notes"
            style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
          >
            Internal Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            style={{
              width: "100%",
              minHeight: "120px",
              fontFamily: "monospace",
              fontSize: "0.9em",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            placeholder="Add any notes about this request..."
          />
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-start" }}>
          {request.status === "submitted" && (
            <button
              onClick={() => handleReview("under_review")}
              disabled={submitting}
              className="button primary"
            >
              {submitting ? "Updating..." : "Start Review"}
            </button>
          )}
          {request.status !== "approved" && request.status !== "rejected" && (
            <>
              <button
                onClick={() => handleReview("approved")}
                disabled={submitting}
                className="button"
                style={{ backgroundColor: "#009900", color: "white" }}
              >
                {submitting ? "Updating..." : "Approve"}
              </button>
              <button
                onClick={() => handleReview("rejected")}
                disabled={submitting}
                className="button"
                style={{ backgroundColor: "#cc0000", color: "white" }}
              >
                {submitting ? "Updating..." : "Reject"}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
