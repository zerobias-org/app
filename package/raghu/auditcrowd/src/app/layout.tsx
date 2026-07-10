import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "material-symbols/outlined.css";
import { SessionProvider } from "@/context/session-context";
import { CurrentUserProvider } from "@/context/CurrentUserContext";
import { AuthGate } from "@/components/AuthGate";
import { ActionForms } from "@/components/ActionForms";
import "@/styles/main.scss";
import "@/styles/ac-globals.css";
import "@/styles/styles.scss";
import "@/styles/brand.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "AuditCrowd — Verifiable Assessment Marketplace",
  description: "Verifiable audits on the ZeroBias transparency architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        {/* cosmic backdrop */}
        <div className="ac-backdrop" aria-hidden="true">
          <div className="ac-aurora a1" />
          <div className="ac-aurora a2" />
          <div className="ac-aurora a3" />
          <div className="ac-grid" />
        </div>
        <SessionProvider>
          <AuthGate>
            <CurrentUserProvider>
              {children}
              <ActionForms />
            </CurrentUserProvider>
          </AuthGate>
        </SessionProvider>
      </body>
    </html>
  );
}
