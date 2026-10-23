'use client';

import React, { useState } from 'react';
import { useTracker } from '@/lib/useTracker';
import { AddAccountModal } from '@/components/domain/AddAccountModal';
import { Button } from '@/components/primitives/Button';
import { formatCurrency } from '@/lib/store';
import { Plus, Wallet, Trash2, Landmark, PiggyBank, CreditCard, Briefcase } from 'lucide-react';

export default function AccountsPage() {
  const { accounts, addAccount, deleteAccount } = useTracker();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCard;
      case 'investment':
        return Briefcase;
      default:
        return Wallet;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Account Pools
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Organize separate checking, savings, cash, and credit cards.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={16} />}
        >
          Add Pool
        </Button>
      </div>

      {/* Account List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.account_type);
          const isNegative = acc.current_balance < 0;

          return (
            <div
              key={acc.id}
              className="p-5 bg-surface border border-border rounded-2xl shadow-card flex flex-col justify-between hover:shadow-elevated transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: acc.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text">{acc.name}</h3>
                      <span className="text-[11px] text-text-muted uppercase font-semibold">
                        {acc.account_type} • {acc.currency}
                      </span>
                    </div>
                  </div>

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteAccount(acc.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                      title="Delete account"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="my-2">
                  <div className="text-xs text-text-muted">Current Balance</div>
                  <div
                    className={`font-display text-2xl font-extrabold mt-0.5 ${
                      isNegative ? 'text-danger' : 'text-text'
                    }`}
                  >
                    {formatCurrency(acc.current_balance, acc.currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-2xs text-text-muted mt-2">
                <span>Initial: {formatCurrency(acc.initial_balance, acc.currency)}</span>
                <span>{acc.transaction_count ?? 0} transactions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addAccount}
      />
    </div>
  );
}
