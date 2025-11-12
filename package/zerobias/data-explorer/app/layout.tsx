import type { Metadata } from "next";
import { Roboto, Montserrat } from "next/font/google";
import { CurrentUserProvider } from "@/context/CurrentUserContext";
import { DataExplorerProvider } from "@/context/DataExplorerContext";
import "./globals.css";
import "../styles/styles.scss";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  variable: "--font-roboto",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Data Explorer - Zerobias",
  description: "Browse and explore data sources through the DataProducer interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" href="favicon.png"  />
      <body className={`${roboto.variable} ${montserrat.variable}`} style={{ fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
          <CurrentUserProvider>
            <DataExplorerProvider>
              {children}
            </DataExplorerProvider>
          </CurrentUserProvider>
      </body>
    </html>
  );
}
