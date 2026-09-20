"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

type State = "idle" | "copied" | "failed";

/**
 * Web Share API where it exists (phones, Safari, Edge); otherwise the link is copied.
 * Copy tries the async clipboard first, then a hidden textarea for old or insecure contexts.
 */
export default function ShareButton({ title, text, accent }: { title: string; text: string; accent: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (s: State) => {
    setState(s);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2600);
  };

  const onClick = async () => {
    const url = window.location.href;
    const data = { title, text, url };

    if (typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        // Closing the share sheet is not an error. Anything else falls through to copying.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
      return;
    } catch {
      /* fall through */
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      flash(ok ? "copied" : "failed");
    } catch {
      flash("failed");
    }
  };

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 border px-5 py-3 text-sm transition-colors hover:bg-bone/[0.06]"
        style={{ borderColor: `${accent}77` }}
      >
        {state === "copied" ? <Check className="h-4 w-4" style={{ color: accent }} aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
        {state === "copied" ? "Link copied" : "Share"}
      </button>
      <span className="ml-3 text-sm text-ash" role="status" aria-live="polite">
        {state === "failed" ? "Could not copy. Use the address bar." : ""}
      </span>
    </span>
  );
}
