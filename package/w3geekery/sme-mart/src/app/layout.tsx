import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Box from '@mui/material/Box';
import { ThemeContextProvider } from '@/context/ThemeContext';
import { ZeroBiasProvider } from '@/context/ZeroBiasContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppTopBar } from '@/components/layout';
import { ImpersonationSwitcher } from '@/components/dev/ImpersonationSwitcher';
import '@/styles/globals.scss';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SME Mart - Marketplace for Compliance Experts",
  description: "Find and hire compliance SMEs, assessors, advisors, and AI agent builders for your attestation needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ZeroBiasProvider>
            <QueryProvider>
            <ThemeContextProvider>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppTopBar />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    mt: { xs: '56px', sm: '64px' }, // Offset for fixed AppBar
                    p: { xs: 2, sm: 3 },
                  }}
                >
                  {children}
                </Box>
              </Box>
              <ImpersonationSwitcher />
            </ThemeContextProvider>
            </QueryProvider>
          </ZeroBiasProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
