'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { VerdeIcon } from '@/components/VerdeIcon';
import { BanknotesCanvas } from '@/components/landing/BanknotesCanvas';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="text-xs text-[#4b554f]">Create your personal financial account</p>
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#838e87] pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-3 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
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

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#4b554f]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#838e87] pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-10 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#838e87] hover:text-[#0a0d0b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#15803d] transition-colors duration-150"
                >
                  {showConfirmPassword ? (
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
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#4b554f]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#0a0d0b] hover:text-[#15803d] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
