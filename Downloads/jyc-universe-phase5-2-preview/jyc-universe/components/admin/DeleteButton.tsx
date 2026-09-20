"use client";

import { useFormStatus } from "react-dom";

/**
 * Delete, behind a confirm(). Some of these cascade — removing a world removes its clubs, their
 * events, photos and buildings — so the caller passes a warning that says exactly what goes.
 */

function Inner({ label, warning }: { label: string; warning: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="ah-btn ah-btn--danger"
      disabled={pending}
      // The confirm sits on the button, not on the form: with a Server Action as the form's
      // `action`, preventing the default on submit is not a reliable way to stop it.
      onClick={(e) => {
        if (!window.confirm(warning)) e.preventDefault();
      }}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}

export default function DeleteButton({
  action,
  warning,
  label = "Delete",
}: {
  action: () => Promise<void>;
  warning: string;
  label?: string;
}) {
  return (
    <form action={action}>
      <Inner label={label} warning={warning} />
    </form>
  );
}
