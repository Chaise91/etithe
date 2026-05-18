import { cookies } from "next/headers";
import Link from "next/link";

const SESSION_COOKIE = "etithe_session";

export default async function Navbar() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get(SESSION_COOKIE)?.value;

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        eTithe
      </Link>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="button ghost navbar-btn">
              Dashboard
            </Link>
            <form action="/api/auth/logout" method="post" style={{ margin: 0 }}>
              <button type="submit" className="button ghost navbar-btn">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/onboarding" className="button ghost navbar-btn">
              Get started
            </Link>
            <Link href="/login" className="button primary navbar-btn">
              Sign in
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
