import type { Metadata } from 'next';
import '@/styles/globals.css';
import { NavigationShell } from '@/components/domain/NavigationShell';

export const metadata: Metadata = {
  title: 'FundTracker - Privacy-First Personal Finance & Budgets',
  description:
    'A modern, ad-free personal finance tracker to log daily expenses, manage multi-period budgets, and visualize trends with zero tracking.',
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
