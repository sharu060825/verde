'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { PlusCircle, Search, Download, Printer, Edit2, Trash2, X } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currency = user?.currency || 'INR';

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const [txRes, catRes] = await Promise.all([
        apiFetch<Transaction[]>(`/api/transactions?${params.toString()}`),
        apiFetch<Array<{ id: string; name: string }>>('/api/categories'),
      ]);

      setTransactions(txRes);
      setCategories(catRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journal.');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadTransactions();
    }
  }, [authLoading, user, router, loadTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this record?')) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete entry.');
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditTitle(tx.title);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditType(tx.type);
    setEditPaymentMethod(tx.paymentMethod);
    setEditNotes(tx.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setIsUpdating(true);
    try {
      const updated = await apiFetch<Transaction>(`/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          amount: parseFloat(editAmount),
          category: editCategory,
          type: editType,
          paymentMethod: editPaymentMethod,
          notes: editNotes,
        }),
      });

      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTx(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update transaction.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/csv`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        a.href = downloadUrl;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('CSV export failed.'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-white text-[#0a0d0b]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Navbar title="Transaction Journal" />

        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6ebe8] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0a0d0b] uppercase tracking-wider">Audit Log</h2>
            <p className="text-xs text-[#4b554f]">Complete itemized record of inflows and outflows</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-[#d1d8d3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0a0d0b] hover:bg-[#f8faf9] transition"
            >
              <Download className="h-3.5 w-3.5 text-[#15803d]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-[#d1d8d3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0a0d0b] hover:bg-[#f8faf9] transition"
            >
              <Printer className="h-3.5 w-3.5 text-[#15803d]" />
              <span>Print View</span>
            </button>
            <Link
              href="/add-expense"
              className="flex items-center gap-1.5 rounded-lg bg-[#15803d] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#166534] transition shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Entry</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border border-[#e6ebe8] bg-white p-4 rounded-2xl text-xs shadow-xs">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#838e87]" />
            <input
              type="text"
              placeholder="Search title, category, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 pl-9 pr-3 text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split('-');
                setSortBy(by as any);
                setSortOrder(ord as any);
              }}
              className="w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-xs text-[#0a0d0b] outline-none focus:border-[#15803d]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="border border-[#e6ebe8] bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e6ebe8] bg-[#f8faf9] text-[10px] uppercase tracking-wider text-[#4b554f]">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebe8]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#838e87]">
                      Loading journal entries...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#838e87]">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f8faf9] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              tx.type === 'INCOME' ? 'bg-[#15803d]' : 'bg-[#0a0d0b]'
                            }`}
                          />
                          <div>
                            <p className="font-semibold text-[#0a0d0b]">{tx.title}</p>
                            {tx.notes && <p className="text-[10px] text-[#838e87]">{tx.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#4b554f]">{tx.category}</td>
                      <td className="py-3 px-4 text-[#838e87]">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-[#4b554f]">{tx.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-bold num-tabular">
                        <span className={tx.type === 'INCOME' ? 'text-[#15803d]' : 'text-[#0a0d0b]'}>
                          {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tx)}
                            className="rounded p-1 text-[#838e87] hover:text-[#0a0d0b] hover:bg-[#f8faf9] transition"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="rounded p-1 text-[#838e87] hover:text-[#0a0d0b] hover:bg-[#f8faf9] transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md border border-[#e6ebe8] bg-white rounded-2xl p-6 shadow-2xl text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6ebe8] pb-3">
                <h3 className="font-bold text-[#0a0d0b] text-sm uppercase tracking-wider">Modify Entry</h3>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="rounded p-1 text-[#838e87] hover:text-[#0a0d0b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Category</label>
                    <input
                      type="text"
                      required
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Payment Method</label>
                    <input
                      type="text"
                      required
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-[#4b554f]">Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#d1d8d3] bg-white py-2 px-3 text-[#0a0d0b] outline-none focus:border-[#15803d]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="rounded-lg border border-[#d1d8d3] px-3.5 py-1.5 text-[#4b554f] hover:bg-[#f8faf9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="rounded-lg bg-[#15803d] px-4 py-1.5 font-semibold text-white hover:bg-[#166534] disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
