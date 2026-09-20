"use client";

import Link from "next/link";

/**
 * Admin-side error boundary. The most likely cause by far is a missing table or a missing row in
 * `admins`, so the message says what to check rather than apologising.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const notAuthorised = error.message === "NOT_AUTHORISED";

  return (
    <div className="ah-panel p-7">
      <p className="ah-kicker">City Hall</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">
        {notAuthorised ? "Not an administrator" : "That did not work"}
      </h2>

      <p className="mt-4 max-w-xl text-sm" style={{ color: "var(--muted)" }}>
        {notAuthorised ? (
          <>
            You are signed in, but your account is not on the admin list. An owner needs to add you under
            Administrators.
          </>
        ) : (
          <>
            Check that <code>supabase/schema.sql</code> and{" "}
            <code>supabase/migrations/0001_admin_writes.sql</code> have both been run, and that your user id is
            in the <code>admins</code> table.
          </>
        )}
      </p>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="ah-btn">
          Try again
        </button>
        <Link href="/admin/login" className="ah-btn ah-btn--ghost">
          Sign in again
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
