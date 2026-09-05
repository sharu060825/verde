import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { FinancialCompanion } from '@/components/companion/FinancialCompanion';

export const metadata: Metadata = {
  title: 'VERDE — Personal Finance & Wealth Growth',
  description: 'Manage your money. Grow with purpose. Personal finance, budgeting, and transaction analytics built for financial clarity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-white text-[#0a0d0b]">
        <AuthProvider>
          {children}
          <FinancialCompanion />
        </AuthProvider>
      </body>
    </html>
  );
}
