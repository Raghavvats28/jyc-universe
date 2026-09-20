import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { adminConfigured } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  // Preview mode has no accounts to sign into — the whole panel is already open.
  if (!adminConfigured()) redirect("/admin");

  return (
    <div className="ah-panel w-full max-w-md p-8">
      <p className="ah-kicker">JYC Administration</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">City Hall</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
        Sign in with the account an owner created for you.
      </p>

      <div className="mt-7">
        <LoginForm />
      </div>

      <p className="mt-8 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
        No account? An existing owner adds you under Administrators. Access can be revoked at any time and takes
        effect on your next request.
      </p>
    </div>
  );
}
