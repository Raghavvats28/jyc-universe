import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/cookie";
import { adminConfigured } from "@/lib/admin/configured";

/**
 * First gate on the admin panel: no session cookie, no admin pages.
 *
 * This is a cheap check, not the real one — it only looks for the cookie's presence, because the
 * middleware runs on the edge and should not make a database round trip on every request. The real
 * check is `requireAdmin()` in the admin layout (allow-list) and the RLS policies in Postgres. A
 * forged cookie gets past this line and then fails both of the others.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Preview mode (no database yet): the whole panel is open, no session needed. See
  // app/admin/layout.tsx and lib/admin/preview.ts.
  if (!adminConfigured()) return NextResponse.next();

  const signedIn = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  if (!signedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Come back to where they were trying to go once they are in.
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Admin pages only. The public site never runs this.
  matcher: ["/admin/:path*"],
};
