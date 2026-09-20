"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/lib/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ah-btn w-full justify-center" disabled={pending}>
      {pending ? "Checking…" : "Sign in"}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useFormState(signIn, null);

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && (
        <p role="alert" className="ah-note ah-note--bad">
          {state.error}
        </p>
      )}

      <div className="ah-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="ah-input" />
      </div>

      <div className="ah-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="ah-input"
        />
      </div>

      <Submit />
    </form>
  );
}
