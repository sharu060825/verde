'use client';

import { useAuth } from '@/lib/auth-context';
import { CURRENCIES } from '@/lib/currency';
import Link from 'next/link';
import { Coins, LogOut } from 'lucide-react';

export function Navbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const currentCurrency = CURRENCIES.find((c) => c.code === user?.currency) || CURRENCIES[0];

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-[#e6ebe8] bg-white p-4 text-[#0a0d0b] shadow-xs md:flex-row md:items-center md:justify-between">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Overview</span>
        <h1 className="text-xl font-bold tracking-tight text-[#0a0d0b]">{title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Active Currency Indicator */}
        <Link
          href="/settings"
          title="Change currency in Settings"
          className="flex items-center gap-1.5 rounded-lg border border-[#e6ebe8] bg-[#f8faf9] px-3 py-1.5 text-xs font-medium text-[#0a0d0b] hover:border-[#15803d] transition"
        >
          <Coins className="h-3.5 w-3.5 text-[#15803d]" />
          <span>{currentCurrency.code} ({currentCurrency.symbol})</span>
        </Link>

        {/* User Identity Chip */}
        <div className="flex items-center gap-2 rounded-lg border border-[#e6ebe8] bg-[#f8faf9] px-3 py-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-[#15803d]" />
          <span className="font-medium text-[#0a0d0b]">{user?.name || 'Authenticated'}</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          title="Log Out"
          aria-label="Log Out"
          className="rounded-lg border border-[#e6ebe8] bg-[#f8faf9] p-2 text-[#838e87] transition hover:border-[#0a0d0b] hover:text-[#0a0d0b]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
