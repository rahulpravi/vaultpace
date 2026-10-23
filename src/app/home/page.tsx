'use client';

import React, { useState } from 'react';
import { useTracker } from '@/lib/useTracker';
import { AccountCarousel } from '@/components/domain/AccountCarousel';
import { BudgetProgressCard } from '@/components/domain/BudgetProgressCard';
import { TransactionRow } from '@/components/domain/TransactionRow';
import { AddAccountModal } from '@/components/domain/AddAccountModal';
import { SpendingLineGraph, TrendPoint } from '@/components/domain/SpendingLineGraph';
import { formatCurrency } from '@/lib/store';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const {
    accounts,
    categories,
    budgets,
    transactions,
    totalNetWorthCents,
    deleteTransaction,
    addAccount,
  } = useTracker();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Filter transactions by selected account if any
  const filteredTransactions = selectedAccountId
    ? transactions.filter(
        (t) => t.account_id === selectedAccountId || t.to_account_id === selectedAccountId
      )
    : transactions;

  const activeBudget = budgets[0];

  // Calculate monthly income vs expense
  const monthlyExpense = filteredTransactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyIncome = filteredTransactions
    .filter((t) => t.transaction_type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  // Velocity points for line graph
  const trendPoints: TrendPoint[] = [
    { label: 'Oct 1', amountCents: 1450 },
    { label: 'Oct 8', amountCents: 10200 },
    { label: 'Oct 15', amountCents: 18400 },
    { label: 'Oct 20', amountCents: 26500 },
    { label: 'Oct 23', amountCents: monthlyExpense },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* =========================================================================
          Top Header: Total Net Worth & Privacy Badge
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Total Net Worth
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-full">
              <ShieldCheck size={12} /> Local & Private
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-extrabold text-text mt-1 tracking-tight">
            {formatCurrency(totalNetWorthCents)}
          </div>
        </div>

        {/* Quick Month Metrics Pill */}
        <div className="flex items-center gap-3 bg-surface border border-border p-2 sm:p-2.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-xl bg-success-light text-success flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Income</div>
              <div className="text-xs font-bold text-success font-display">
                +{formatCurrency(monthlyIncome)}
              </div>
            </div>
          </div>

          <div className="w-px h-7 bg-border" />

          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-xl bg-danger-light text-danger flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Spent</div>
              <div className="text-xs font-bold text-danger font-display">
                -{formatCurrency(monthlyExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Account Pools Carousel
          ========================================================================= */}
      <section aria-labelledby="accounts-section">
        <div className="flex items-center justify-between mb-2">
          <h2 id="accounts-section" className="text-sm font-bold text-text">
            Financial Pools
          </h2>
          <Link href="/accounts" className="text-xs font-semibold text-accent hover:underline">
            Manage
          </Link>
        </div>

        <AccountCarousel
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onAddAccountClick={() => setIsAccountModalOpen(true)}
        />
      </section>

      {/* =========================================================================
          Budget Progress & Spending Pace
          ========================================================================= */}
      {activeBudget && (
        <section aria-labelledby="budget-section">
          <div className="flex items-center justify-between mb-2">
            <h2 id="budget-section" className="text-sm font-bold text-text">
              Active Budget Pace
            </h2>
            <Link href="/budgets" className="text-xs font-semibold text-accent hover:underline">
              View All
            </Link>
          </div>

          <BudgetProgressCard
            budget={activeBudget}
            transactions={filteredTransactions}
          />
        </section>
      )}

      {/* =========================================================================
          Velocity Trend Line Curve
          ========================================================================= */}
      <section>
        <SpendingLineGraph points={trendPoints} />
      </section>

      {/* =========================================================================
          Recent Activity Feed
          ========================================================================= */}
      <section aria-labelledby="recent-activity-section" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="recent-activity-section" className="text-sm font-bold text-text">
            Recent Movements
          </h2>
          <Link href="/transactions" className="text-xs font-semibold text-accent hover:underline">
            Full Ledger ({transactions.length})
          </Link>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-dashed border-border rounded-2xl text-text-muted text-sm">
            No movements recorded for this account pool.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTransactions.slice(0, 5).map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                category={categories.find((c) => c.id === tx.category_id)}
                account={accounts.find((a) => a.id === tx.account_id)}
                onDelete={deleteTransaction}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={addAccount}
      />
    </div>
  );
}
