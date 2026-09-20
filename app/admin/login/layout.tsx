import "../admin.css";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

/**
 * The login page deliberately does NOT use the admin layout: that layout redirects anyone without a
 * session here, which would be a loop. It gets its own bare shell instead.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="ah grid min-h-dvh place-items-center p-6">{children}</div>;
}
