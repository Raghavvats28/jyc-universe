"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addAdmin } from "@/lib/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ah-btn" disabled={pending}>
      {pending ? "Adding…" : "Add administrator"}
    </button>
  );
}

export default function AddAdminForm() {
  const [state, action] = useFormState(addAdmin, null);

  return (
    <form action={action} className="space-y-4">
      {state && (state.ok ? (
        <p className="ah-note ah-note--ok">Added. They can sign in now.</p>
      ) : (
        <p role="alert" className="ah-note ah-note--bad">
          {state.error}
        </p>
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="ah-field md:col-span-2">
          <label htmlFor="user_id">User UUID</label>
          <input id="user_id" name="user_id" required className="ah-input" placeholder="00000000-0000-0000-0000-000000000000" />
          <p className="ah-help">From Supabase → Authentication → Users.</p>
        </div>
        <div className="ah-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="ah-input" />
        </div>
        <div className="ah-field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" className="ah-input" defaultValue="editor">
            <option value="editor">editor — edits content</option>
            <option value="owner">owner — also manages this list</option>
          </select>
        </div>
      </div>

      <Submit />
    </form>
  );
}
