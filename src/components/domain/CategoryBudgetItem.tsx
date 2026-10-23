'use client';

import React from 'react';
import { Category } from '@/types';
import { CategoryIconAvatar } from '../primitives/CategoryIconAvatar';
import { formatCurrency } from '@/lib/store';

interface CategoryBudgetItemProps {
  category: Category;
  spentCents: number;
  limitCents: number;
  transactionCount?: number;
  className?: string;
}

export const CategoryBudgetItem: React.FC<CategoryBudgetItemProps> = ({
  category,
  spentCents,
  limitCents,
  transactionCount = 0,
  className = '',
}) => {
  const isOverspent = spentCents > limitCents;
  const pct = limitCents > 0 ? Math.min(Math.round((spentCents / limitCents) * 100), 100) : 0;

  return (
    <div
      className={`p-3.5 sm:p-4 bg-surface border border-border/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:shadow-card transition-all ${className}`}
    >
      {/* Category Avatar */}
      <CategoryIconAvatar iconName={category.icon} color={category.color} size="md" />

      {/* Center Details with Progress Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-text truncate">{category.name}</span>
          <div className="text-right">
            <span
              className={`font-display text-sm font-extrabold ${
                isOverspent ? 'text-danger' : 'text-text'
              }`}
            >
              {formatCurrency(spentCents)}
            </span>
            <span className="text-xs text-text-muted"> / {formatCurrency(limitCents)}</span>
          </div>
        </div>

        {/* Mini Progress Track */}
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverspent ? 'bg-danger' : 'bg-accent'
            }`}
            style={{ width: `${pct}%`, backgroundColor: isOverspent ? '#b91c1c' : category.color }}
          />
        </div>

        {/* Footnote: Count */}
        <div className="flex items-center justify-between text-[11px] text-text-muted mt-1">
          <span>{transactionCount} transactions</span>
          <span className={isOverspent ? 'text-danger font-semibold' : ''}>
            {isOverspent ? 'Overspent' : `${pct}% spent`}
          </span>
        </div>
      </div>
    </div>
  );
};
