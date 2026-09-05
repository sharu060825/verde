'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Lock, Mail, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { VerdeIcon } from '@/components/VerdeIcon';
import { BanknotesCanvas } from '@/components/landing/BanknotesCanvas';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreFillDemo = () => {
    setEmail('demo@expensetracker.ai');
    setPassword('Password123!');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white p-4 text-[#0a0d0b] overflow-hidden">
      {/* Subtle Background Banknotes */}
      <BanknotesCanvas className="opacity-30" />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e6ebe8] bg-white shadow-xs">
            <VerdeIcon size="md" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0d0b] uppercase">VERDE</h1>
          <p className="text-xs text-[#4b554f]">Sign in to your financial account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#e6ebe8] bg-white p-6 shadow-lg shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-[#0a0d0b] bg-[#f8faf9] p-3 text-xs text-[#0a0d0b] font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#4b554f]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#838e87] pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-3 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#4b554f]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#838e87] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-10 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#838e87] hover:text-[#0a0d0b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#15803d] transition-colors duration-150"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 transition-transform duration-150" />
                  ) : (
                    <EyeOff className="h-4 w-4 transition-transform duration-150" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803d] py-2.5 text-xs font-semibold text-white transition hover:bg-[#166534] disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 border-t border-[#e6ebe8]">
              <button
                type="button"
                onClick={handlePreFillDemo}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d1d8d3] bg-[#f8faf9] py-2 text-xs font-medium text-[#4b554f] hover:border-[#0a0d0b] hover:text-[#0a0d0b] transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#15803d]" />
                Pre-fill Demo Credentials
              </button>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#4b554f]">
          New to VERDE?{' '}
          <Link href="/register" className="font-semibold text-[#0a0d0b] hover:text-[#15803d] underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
