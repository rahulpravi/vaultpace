'use client';

import React from 'react';
import { Account } from '@/types';
import { formatCurrency } from '@/lib/store';

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const isNegative = account.current_balance < 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative min-w-[145px] sm:min-w-[160px] p-4 bg-surface rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left flex flex-col justify-between ${
        isSelected
          ? 'border-accent ring-2 ring-accent/30 shadow-card scale-[1.02]'
          : 'border-border hover:border-text-muted/40 hover:shadow-card'
      } ${className}`}
    >
      {/* Top Row: Account Name & Color Dot */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-text truncate">
          {account.name}
        </span>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: account.color }}
          title={account.account_type}
        />
      </div>

      {/* Middle Row: Balance Display */}
      <div className="my-1">
        <div
          className={`font-display text-base sm:text-lg font-bold tracking-tight truncate ${
            isNegative ? 'text-danger' : 'text-text'
          }`}
        >
          {formatCurrency(account.current_balance, account.currency)}
        </div>
      </div>

      {/* Bottom Row: Transaction Count */}
      <div className="text-2xs text-text-muted mt-1 truncate">
        {account.transaction_count ?? 0} transactions
      </div>
    </div>
  );
};
