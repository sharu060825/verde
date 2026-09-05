'use client';

import React from 'react';
import Link from 'next/link';
import { BanknotesCanvas } from '@/components/landing/BanknotesCanvas';
import { VerdeIcon } from '@/components/VerdeIcon';

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full bg-white text-[#0a0d0b] flex flex-col justify-between overflow-hidden select-none">
      {/* Composed 3D Financial Banknote Sculpture Layer */}
      <BanknotesCanvas />

      {/* Top Header — Minimalist Brand Presence */}
      <header className="relative z-20 px-8 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <VerdeIcon size="sm" />
          <span className="text-xs font-bold tracking-widest text-[#0a0d0b] uppercase">VERDE</span>
        </div>
      </header>

      {/* Centerpiece: Brand & Direct Authentication Entry */}
      <main className="relative z-20 flex flex-col items-center justify-center text-center my-auto px-6">
        <div className="flex flex-col items-center space-y-6 max-w-sm w-full">
          {/* Subtle Emblem */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e6ebe8] bg-white/95 shadow-sm backdrop-blur-xs">
            <VerdeIcon size="md" />
          </div>

          {/* Primary Wordmark — VERDE */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0a0d0b] uppercase">
            VERDE
          </h1>

          {/* Direct Authentication Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto min-w-[150px] inline-flex items-center justify-center rounded-xl border border-[#0a0d0b] bg-white px-6 py-3 text-xs font-bold tracking-wider text-[#0a0d0b] uppercase hover:bg-[#0a0d0b] hover:text-white transition-all duration-150 shadow-2xs active:scale-98"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto min-w-[150px] inline-flex items-center justify-center rounded-xl bg-[#15803d] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase hover:bg-[#166534] transition-all duration-150 shadow-xs active:scale-98"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 px-8 py-6 text-center text-[11px] text-[#838e87] tracking-wider uppercase pointer-events-none">
        <p>© 2026 VERDE</p>
      </footer>
    </div>
  );
}
