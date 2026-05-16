import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { onboardingRequests, organizations } from "@/db/schema";
import { readSessionFromCookies } from "@/lib/auth";

export default async function AdminOnboardingPage() {
  const session = await readSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  // For now, allow any org_admin to see onboarding (would be more restricted in prod)
  if (session.role !== "org_admin" && session.role !== "platform_admin") {
    return (
      <main className="shell">
        <section className="card">
          <h1>Access Denied</h1>
          <p style={{ color: "var(--muted)" }}>
            You don't have permission to access this page.
          </p>
        </section>
      </main>
    );
  }

  const db = getDb();
  const requests = await db
    .select({
      id: onboardingRequests.id,
      organizationId: onboardingRequests.organizationId,
      organizationName: organizations.name,
      contactEmail: organizations.contactEmail,
      status: onboardingRequests.status,
      submittedAt: onboardingRequests.submittedAt,
      reviewedAt: onboardingRequests.reviewedAt,
      notes: onboardingRequests.notes,
    })
    .from(onboardingRequests)
    .innerJoin(
      organizations,
      eq(onboardingRequests.organizationId, organizations.id)
    )
    .where(
      inArray(onboardingRequests.status, [
        "submitted",
        "under_review",
        "approved",
        "rejected",
      ])
    );

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

  return (
    <main className="shell">
      <section className="card">
        <h1 style={{ marginBottom: 24 }}>Onboarding Requests</h1>

        {requests.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No onboarding requests to review.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact Email</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const bgColor = statusColors[request.status] || "#666";
                  const label = statusLabels[request.status] || request.status;

                  return (
                    <tr key={request.id}>
                      <td style={{ fontWeight: 500 }}>{request.organizationName}</td>
                      <td>{request.contactEmail}</td>
                      <td>{new Date(request.submittedAt || "").toLocaleDateString()}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            backgroundColor: bgColor,
                            color: "white",
                            borderRadius: "3px",
                            fontSize: "0.85em",
                            fontWeight: 500,
                          }}
                        >
                          {label}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/admin/onboarding/${request.id}`}
                          style={{
                            color: "var(--primary)",
                            textDecoration: "underline",
                            cursor: "pointer",
                          }}
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
