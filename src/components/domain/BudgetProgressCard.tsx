'use client';

import React from 'react';
import { Budget, Transaction } from '@/types';
import { formatCurrency } from '@/lib/store';
import { History, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressCardProps {
  budget: Budget;
  transactions: Transaction[];
  onHistoryClick?: () => void;
  className?: string;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budget,
  transactions,
  onHistoryClick,
  className = '',
}) => {
  // Filter transactions belonging to this budget's period and categories
  const relevantTransactions = transactions.filter((t) => {
    if (t.transaction_type !== 'expense') return false;
    if (budget.start_date && t.transaction_date < budget.start_date) return false;
    if (budget.end_date && t.transaction_date > budget.end_date) return false;
    if (budget.category_ids && budget.category_ids.length > 0) {
      if (!t.category_id || !budget.category_ids.includes(t.category_id)) return false;
    }
    return true;
  });

  const totalSpentCents = relevantTransactions.reduce((acc, t) => acc + t.amount, 0);
  const remainingCents = budget.amount_limit - totalSpentCents;
  const isOverspent = remainingCents < 0;

  const spendPercentage = Math.min(
    Math.round((totalSpentCents / budget.amount_limit) * 100),
    200
  );

  // Calendar Day Calculation (Assuming current month)
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const todayMarkerPercent = Math.min(100, Math.max(0, (currentDay / daysInMonth) * 100));

  // Daily pace projection
  const dailyAllowanceCents = isOverspent ? 0 : Math.round(remainingCents / daysRemaining);

  return (
    <div
      className={`relative p-5 sm:p-6 bg-gradient-to-br from-surface to-surface-subtle border border-border rounded-2xl sm:rounded-3xl shadow-card transition-all ${className}`}
    >
      {/* Header: Title and History Action */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg sm:text-xl font-bold text-text">
          {budget.name}
        </h3>
        {onHistoryClick && (
          <button
            type="button"
            onClick={onHistoryClick}
            className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-border/60 flex items-center justify-center text-text-muted hover:text-text transition-colors"
            title="View budget cycle history"
            aria-label="View budget cycle history"
          >
            <History size={16} />
          </button>
        )}
      </div>

      {/* Subheader: Amount Remaining / Overspent */}
      <div className="mb-4">
        {isOverspent ? (
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <span className="font-display text-xl sm:text-2xl font-extrabold">
              {formatCurrency(Math.abs(remainingCents))} overspent
            </span>
            <span className="text-xs text-text-muted">
              of {formatCurrency(budget.amount_limit)}
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl sm:text-2xl font-extrabold text-text">
              {formatCurrency(remainingCents)} left
            </span>
            <span className="text-xs sm:text-sm text-text-muted">
              of {formatCurrency(budget.amount_limit)}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Container with Today Marker */}
      <div className="relative pt-6 pb-2">
        {/* Floating "Today" Badge */}
        <div
          className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${todayMarkerPercent}%` }}
        >
          <span className="bg-text text-bg text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            Today
          </span>
          <div className="w-0.5 h-3 bg-text/80 mt-0.5" />
        </div>

        {/* The Track */}
        <div className="relative w-full h-3.5 bg-border rounded-full overflow-hidden">
          {/* The Fill Bar */}
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 ${
              isOverspent
                ? 'bg-danger'
                : spendPercentage >= budget.notify_threshold * 100
                ? 'bg-warning'
                : 'bg-accent'
            }`}
            style={{ width: `${Math.min(spendPercentage, 100)}%` }}
          />
        </div>

        {/* Start / Percentage / End Date Row */}
        <div className="flex items-center justify-between text-2xs text-text-muted mt-2 font-medium">
          <span>{budget.start_date || 'Day 1'}</span>
          <span className="font-bold text-text">{spendPercentage}%</span>
          <span>{budget.end_date || `Day ${daysInMonth}`}</span>
        </div>
      </div>

      {/* Pace Guidance Text */}
      <div className="mt-3 text-xs text-text-muted flex items-center gap-1.5 border-t border-border/40 pt-3">
        {isOverspent ? (
          <span className="text-danger font-medium">
            Over threshold by {formatCurrency(Math.abs(remainingCents))} this cycle.
          </span>
        ) : (
          <>
            <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
            <span>
              You can keep spending{' '}
              <strong className="text-text font-semibold">
                {formatCurrency(dailyAllowanceCents)}/day
              </strong>{' '}
              for {daysRemaining} more days
            </span>
          </>
        )}
      </div>
    </div>
  );
};
