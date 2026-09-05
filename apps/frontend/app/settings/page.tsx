'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { CURRENCIES } from '@/lib/currency';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Save, Check, User, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setName(user.name);
      setCurrency(user.currency || 'INR');
      setNotifications(user.notifications ?? true);
    }
  }, [authLoading, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          currency,
          notifications,
        }),
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Navbar title="Preferences" />

        <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs text-xs">
          <div className="border-b border-[#e6ebe8] pb-4 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">Configuration</span>
            <h2 className="text-xl font-bold text-[#0a0d0b]">Account & Display Preferences</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-[#15803d] font-semibold">
                <Check className="h-4 w-4" />
                <span>Preferences updated successfully.</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#0a0d0b] bg-[#f8faf9] p-3 text-[#0a0d0b] font-medium">
                {error}
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4b554f]">Profile Identity</h3>

              <div>
                <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#838e87]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-3 text-[#0a0d0b] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="mt-1 w-full rounded-lg border border-[#e6ebe8] bg-[#f8faf9] py-2 px-3 text-[#838e87] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="border-t border-[#e6ebe8] pt-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4b554f]">Currency & Locality</h3>

              <div>
                <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Default Currency</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#838e87]" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.label} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e6ebe8] pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4b554f]">Alerts</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="rounded border-[#d1d8d3] text-[#15803d] focus:ring-[#15803d]"
                />
                <div>
                  <p className="font-semibold text-[#0a0d0b]">Proactive Spending Observations</p>
                  <p className="text-[10px] text-[#4b554f]">
                    Receive contextual observations from your Financial Companion when approaching budget limits.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#15803d] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] transition disabled:opacity-50 shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
