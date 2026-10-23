'use client';

import React, { useState, useMemo } from 'react';
import { useTracker } from '@/lib/useTracker';
import { TransactionRow } from '@/components/domain/TransactionRow';
import { Search, Filter, Calendar } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, categories, accounts, deleteTransaction } = useTracker();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedAccId && tx.account_id !== selectedAccId && tx.to_account_id !== selectedAccId) {
        return false;
      }
      if (selectedCatId && tx.category_id !== selectedCatId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === tx.category_id);
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAmount = (tx.amount / 100).toFixed(2).includes(q);
        if (!matchesNote && !matchesCat && !matchesAmount) return false;
      }
      return true;
    });
  }, [transactions, categories, searchQuery, selectedCatId, selectedAccId]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    for (const tx of filtered) {
      const d = tx.transaction_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    const parsed = new Date(dateStr + 'T00:00:00');
    return parsed.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Audit Ledger
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Review, filter, and inspect every financial movement.
        </p>
      </div>

      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search notes, categories, amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-surface border border-border rounded-2xl text-sm font-medium text-text placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent shadow-xs"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Account Filter */}
          <select
            value={selectedAccId || ''}
            onChange={(e) => setSelectedAccId(e.target.value ? e.target.value : null)}
            className="h-8 px-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent flex-shrink-0"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Category Chips */}
          <button
            type="button"
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
              selectedCatId === null
                ? 'bg-accent text-on-accent shadow-xs'
                : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}
          >
            All Categories
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCatId(selectedCatId === c.id ? null : c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                selectedCatId === c.id
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Grouped Ledger List */}
      {groupedTransactions.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-dashed border-border rounded-2xl text-text-muted text-sm">
          No movements match your search filters.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedTransactions.map(([dateKey, txList]) => (
            <div key={dateKey} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1 text-xs font-bold text-text-muted uppercase tracking-wider">
                <Calendar size={13} />
                <span>{formatDateHeader(dateKey)}</span>
                <span className="opacity-60 text-[10px]">({txList.length})</span>
              </div>

              <div className="flex flex-col gap-2">
                {txList.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    category={categories.find((c) => c.id === tx.category_id)}
                    account={accounts.find((a) => a.id === tx.account_id)}
                    onDelete={deleteTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
