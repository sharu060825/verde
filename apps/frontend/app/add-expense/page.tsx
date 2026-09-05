'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Sparkles, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function AddExpensePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Smart Categorize State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string;
    confidence: number;
    reasoning?: string;
  } | null>(null);

  // New Category Creation
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      apiFetch<Array<{ id: string; name: string; type: string }>>('/api/categories')
        .then((cats) => {
          setCategories(cats);
          if (cats.length > 0 && !category) {
            setCategory(cats[0].name);
          }
        })
        .catch(() => {});
    }
  }, [authLoading, user, router, category]);

  const handleAiCategorize = async () => {
    if (!title.trim()) {
      alert('Please enter a description first to auto-categorize.');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await apiFetch<{
        category: string;
        confidence: number;
        reasoning?: string;
        suggested_type?: string;
      }>('/api/ai/categorize', {
        method: 'POST',
        body: JSON.stringify({
          title,
          notes,
          type,
          amount: amount ? parseFloat(amount) : undefined,
        }),
      });

      setAiSuggestion(res);
      setCategory(res.category);
      if (res.suggested_type === 'INCOME' || res.suggested_type === 'EXPENSE') {
        setType(res.suggested_type);
      }
    } catch {
      alert('Categorization service is busy. Please choose category manually.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await apiFetch<{ id: string; name: string; type: string }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName.trim(),
          type,
        }),
      });
      setCategories((prev) => [...prev, created]);
      setCategory(created.name);
      setNewCatName('');
      setIsCreatingCategory(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          type,
          category,
          date: new Date(date).toISOString(),
          paymentMethod,
          notes: notes.trim() || undefined,
        }),
      });

      router.push('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Navbar title="Record Entry" />

        <div className="border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803d]">New Transaction</span>
              <h2 className="text-xl font-bold text-[#0a0d0b]">Log Financial Activity</h2>
            </div>
            <Link
              href="/expenses"
              className="flex items-center gap-1.5 text-xs text-[#4b554f] hover:text-[#0a0d0b] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Journal</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && (
              <div className="rounded-lg border border-[#0a0d0b] bg-[#f8faf9] p-3 text-[#0a0d0b] font-medium">
                {error}
              </div>
            )}

            {/* Type Selector (Income / Expense) */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Transaction Type</label>
              <div className="mt-1.5 grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`rounded-xl py-2 text-xs font-semibold transition border ${
                    type === 'EXPENSE'
                      ? 'border-[#0a0d0b] bg-[#0a0d0b] text-white'
                      : 'border-[#d1d8d3] bg-white text-[#4b554f] hover:bg-[#f8faf9]'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`rounded-xl py-2 text-xs font-semibold transition border ${
                    type === 'INCOME'
                      ? 'border-[#15803d] bg-[#f0fdf4] text-[#15803d]'
                      : 'border-[#d1d8d3] bg-white text-[#4b554f] hover:bg-[#f8faf9]'
                  }`}
                >
                  Income Inflow
                </button>
              </div>
            </div>

            {/* Title with Smart Categorize Trigger */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Description</label>
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={isAiLoading || !title.trim()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#15803d] hover:underline disabled:opacity-40"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isAiLoading ? 'Analyzing...' : 'Smart Categorize'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Flight tickets to Mumbai or Consulting Fee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white py-2.5 px-3 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
              />
            </div>

            {/* Suggestion Insight Pill */}
            {aiSuggestion && (
              <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#15803d] font-semibold text-[11px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Classified Category: {aiSuggestion.category}</span>
                  <span className="text-[#4b554f]">({Math.round(aiSuggestion.confidence * 100)}% confidence)</span>
                </div>
                {aiSuggestion.reasoning && (
                  <p className="mt-1 text-[11px] text-[#0f5132]">{aiSuggestion.reasoning}</p>
                )}
              </div>
            )}

            {/* Amount and Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Amount ({user?.currency || 'INR'})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] num-tabular outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-[11px] font-semibold text-[#15803d] hover:underline"
                  >
                    + Custom
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="rounded-lg bg-[#15803d] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Date and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#4b554f]">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Additional audit notes or receipt info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#d1d8d3] bg-white p-3 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d]"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#15803d] py-3 text-xs font-semibold text-white transition hover:bg-[#166534] disabled:opacity-50 shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'Recording Entry...' : 'Commit to Ledger'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
