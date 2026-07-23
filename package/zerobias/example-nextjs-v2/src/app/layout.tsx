import type { Metadata } from "next";
import { Roboto, Mitr } from "next/font/google";
import "material-symbols/outlined.css";
import "@/styles/main.scss";
import { SessionProvider } from "@/context/session-context";
import { AuthGate } from "@/components/AuthGate";
import { Header } from "@/components/Header";
import { DemoNav } from "@/components/DemoNav";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

// Mitr — the portal's brand font for the "0" page loader. Its zero glyph is
// slashed, which is what gives the ZeroBias loading mark its look (see the
// `.app-loading` port in _layout.scss). Only used by the page loader.
const mitr = Mitr({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mitr",
});

export const metadata: Metadata = {
  title: "ZeroBias v2 Example",
  description:
    "Canonical example of building a custom app on the ZeroBias platform with the v2 client + SDKs.",
  // The ZeroBias mark, same source the platform portal uses (projects/portal/src/index.html in
  // zb/com/ui): the CDN-hosted favicon. Emits <link rel="icon" type="image/png" href="…"/>.
  icons: {
    icon: [
      { url: "https://cdn.zerobias.com/static/images/zerobias/favicon.png", type: "image/png" },
    ],
  },
};

// FOWT (Flash of Wrong Theme) prevention — a port of the portal's `index.html`
// bootstrap. Runs before first paint: resolves `zb-theme-preference` (falling
// back to the OS setting) and adds the `dark-theme` class + `color-scheme`
// before React hydrates, so there is no light->dark flash. The runtime
// controller (src/lib/theme.ts) takes over from here.
const FOWT_SCRIPT = `(function(){
  var STORAGE_KEY='zb-theme-preference',DARK_CLASS='dark-theme';
  try{
    var pref=localStorage.getItem(STORAGE_KEY);
    var isDark=pref==='dark'?true:pref==='light'?false:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    if(isDark){
      document.documentElement.classList.add(DARK_CLASS);
      document.addEventListener('DOMContentLoaded',function(){document.body.classList.add(DARK_CLASS);});
    }
    document.documentElement.style.colorScheme=isDark?'dark':'light';
  }catch(e){}
})();`;

/**
 * Root layout = the app's composition root. The nesting order is the pattern to copy:
 *   SessionProvider  -> boots the v2 client once and exposes session state; outermost
 *                       so every route/component below can call `useSession()`.
 *   AuthGate         -> blocks all app UI until an authenticated user resolves (or the
 *                       client has already redirected to platform SSO).
 *   Header + <main>  -> only ever render for an authenticated user.
 *
 * Intentionally NOT a `"use client"` component: the root layout stays a Server Component
 * so `metadata` is emitted at build time. The client boundary starts inside SessionProvider.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the FOWT script adds `dark-theme` + `color-scheme`
    // to <html>/<body> before React hydrates, so their attributes intentionally
    // differ from the server HTML. This suppresses only these two elements' own
    // attribute diff (one level deep), not their children.
    <html
      lang="en"
      className={`${roboto.variable} ${mitr.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOWT_SCRIPT }} />
        <style>{`body{background:#fafafa}html.dark-theme body,body.dark-theme{background:#303030}`}</style>
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>
          <AuthGate>
            <Header />
            {/* Shell = the ngx-library showcase layout: a fixed 220px side rail of
                demos, with the demo itself rendered beside it. Demo links live in
                the rail, NOT the header (the header keeps brand + org + user). */}
            <div className="app-shell">
              <DemoNav />
              <main className="content">{children}</main>
            </div>
          </AuthGate>
        </SessionProvider>
      </body>
    </html>
  );
}
