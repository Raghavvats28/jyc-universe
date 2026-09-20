/** The banner after a redirect back from a save or a delete. Server component: no JS. */
export default function Notices({
  saved,
  deleted,
  preview,
  error,
}: {
  saved?: string;
  deleted?: string;
  /** Set when a form submitted successfully but there is no database to store it in. */
  preview?: string;
  error?: string;
}) {
  if (!saved && !deleted && !preview && !error) return null;
  return (
    <div className="mt-5 space-y-2">
      {saved && <p className="ah-note ah-note--ok">Saved. The site has been updated.</p>}
      {deleted && <p className="ah-note ah-note--ok">Deleted.</p>}
      {preview && (
        <p className="ah-note ah-note--bad">
          Looks good, but nothing was stored — there is no database connected yet. Connect Supabase to make this
          change real.
        </p>
      )}
      {error && (
        <p role="alert" className="ah-note ah-note--bad">
          {error}
        </p>
      )}
    </div>
  );
}
