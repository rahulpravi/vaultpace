'use client';

import React from 'react';
import { Account } from '@/types';
import { AccountCard } from './AccountCard';
import { Plus } from 'lucide-react';

interface AccountCarouselProps {
  accounts: Account[];
  selectedAccountId?: string | null;
  onSelectAccount: (id: string | null) => void;
  onAddAccountClick?: () => void;
  className?: string;
}

export const AccountCarousel: React.FC<AccountCarouselProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddAccountClick,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none no-scrollbar">
        {/* All Accounts toggle chip */}
        <button
          type="button"
          onClick={() => onSelectAccount(null)}
          className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col justify-center items-center flex-shrink-0 min-h-[96px] min-w-[90px] select-none ${
            selectedAccountId === null
              ? 'bg-accent text-on-accent border-accent shadow-card'
              : 'bg-surface text-text border-border hover:border-text-muted/40'
          }`}
        >
          <span className="text-sm uppercase tracking-wide">All</span>
          <span className="text-2xs opacity-80 mt-1 font-normal">
            {accounts.length} Pools
          </span>
        </button>

        {/* Individual Account Cards */}
        {accounts.map((acc) => (
          <AccountCard
            key={acc.id}
            account={acc}
            isSelected={selectedAccountId === acc.id}
            onClick={() => onSelectAccount(selectedAccountId === acc.id ? null : acc.id)}
          />
        ))}

        {/* Add Account Card Button */}
        {onAddAccountClick && (
          <button
            type="button"
            onClick={onAddAccountClick}
            className="flex flex-col items-center justify-center min-w-[90px] min-h-[96px] p-3 rounded-2xl border border-dashed border-border text-text-muted hover:text-accent hover:border-accent hover:bg-surface-subtle transition-all flex-shrink-0"
            title="Create New Account"
          >
            <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center mb-1">
              <Plus size={16} />
            </div>
            <span className="text-2xs font-semibold">New</span>
          </button>
        )}
      </div>
    </div>
  );
};
