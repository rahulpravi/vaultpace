'use client';

import React from 'react';
import { Account, Category, Transaction } from '@/types';
import { CategoryIconAvatar } from '../primitives/CategoryIconAvatar';
import { formatCurrency } from '@/lib/store';
import { Trash2 } from 'lucide-react';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onDelete?: (id: string) => void;
  className?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  category,
  account,
  onDelete,
  className = '',
}) => {
  const isExpense = transaction.transaction_type === 'expense';
  const isIncome = transaction.transaction_type === 'income';
  const isTransfer = transaction.transaction_type === 'transfer';

  const amountColor = isExpense
    ? 'text-text font-bold'
    : isIncome
    ? 'text-success font-bold'
    : 'text-accent font-bold';

  const prefix = isExpense ? '-' : isIncome ? '+' : '⇄ ';

  return (
    <div
      className={`group flex items-center justify-between p-3.5 sm:p-4 bg-surface hover:bg-surface-subtle border border-border/70 rounded-2xl transition-all duration-150 select-none ${className}`}
    >
      {/* Left: Avatar & Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <CategoryIconAvatar
          iconName={category?.icon || (isTransfer ? 'landmark' : 'tag')}
          color={category?.color || '#047857'}
          size="md"
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text truncate">
              {category?.name || (isTransfer ? 'Account Transfer' : 'Uncategorized')}
            </span>
            {account && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-text-muted font-medium truncate max-w-[100px]">
                {account.name}
              </span>
            )}
          </div>

          <span className="text-xs text-text-muted truncate mt-0.5">
            {transaction.notes || transaction.transaction_date}
          </span>
        </div>
      </div>

      {/* Right: Amount & Delete Action */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-3">
        <div className="text-right">
          <div className={`font-display text-sm sm:text-base ${amountColor}`}>
            {prefix}
            {formatCurrency(transaction.amount, account?.currency || 'USD')}
          </div>
          <div className="text-[11px] text-text-muted">
            {transaction.transaction_time?.slice(0, 5) || ''}
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction.id);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-all"
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
