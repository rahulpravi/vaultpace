import type { Metadata } from 'next';
import '@/styles/globals.css';
import { NavigationShell } from '@/components/domain/NavigationShell';

export const metadata: Metadata = {
  title: 'VaultPace - Privacy-First Personal Finance & Burn Rate Budgets',
  description:
    'A modern, ad-free personal finance tracker to log daily expenses, manage multi-period budgets, and visualize burn-rate pace with zero surveillance.',
  manifest: '/manifest.json',
  themeColor: '#047857',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NavigationShell>{children}</NavigationShell>
      </body>
    </html>
  );
}
