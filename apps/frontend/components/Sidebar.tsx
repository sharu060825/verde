'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CircleDollarSign,
  LayoutGrid,
  ListPlus,
  Settings,
  Menu,
  X,
  LogOut,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { VerdeIcon } from './VerdeIcon';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/expenses', label: 'Transactions', icon: CircleDollarSign },
  { href: '/add-expense', label: 'Add Transaction', icon: ListPlus },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg border border-[#d1d8d3] bg-white p-2.5 text-[#0a0d0b] shadow-md md:hidden"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col justify-between border-r border-[#e6ebe8] bg-white p-5 transition-transform duration-200 ease-in-out md:sticky md:block md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <Link href="/dashboard" className="flex items-center gap-3 border-b border-[#e6ebe8] pb-5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ebe8] bg-[#f0fdf4]">
              <VerdeIcon size="sm" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-[#0a0d0b] uppercase">VERDE</p>
              <p className="text-[11px] text-[#4b554f]">Wealth Management</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                    active
                      ? 'border-l-2 border-[#15803d] bg-[#f0fdf4] text-[#15803d] font-semibold'
                      : 'text-[#4b554f] hover:bg-[#f8faf9] hover:text-[#0a0d0b]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#15803d]' : 'text-[#838e87]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer */}
        <div className="border-t border-[#e6ebe8] pt-4 mt-6">
          <div className="flex items-center justify-between rounded-xl bg-[#f8faf9] border border-[#e6ebe8] p-2.5">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-xs font-semibold text-[#0a0d0b]">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-[#4b554f]">{user?.email || 'Authenticated'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log Out"
              aria-label="Log Out"
              className="rounded p-1.5 text-[#838e87] hover:bg-white hover:text-[#15803d] transition border border-transparent hover:border-[#e6ebe8]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
