'use client';

import React, { useState } from 'react';
import { Account, Category, TransactionType } from '@/types';
import { ModalDialog } from '../primitives/ModalDialog';
import { PillSegmentedControl } from '../primitives/PillSegmentedControl';
import { NumericAmountInput } from '../primitives/NumericAmountInput';
import { CategoryIconAvatar } from '../primitives/CategoryIconAvatar';
import { Button } from '../primitives/Button';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Calendar } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSave: (tx: {
    account_id: string;
    category_id?: string;
    amount: number;
    transaction_type: TransactionType;
    transaction_date: string;
    transaction_time: string;
    notes?: string;
    to_account_id?: string;
  }) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [cents, setCents] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.category_type === 'income' : c.category_type === 'expense'
  );

  const handleSave = () => {
    if (cents <= 0) {
      setError('Please enter a positive transaction amount.');
      return;
    }
    if (!accountId) {
      setError('Please select an account.');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setError('Please select a category.');
      return;
    }
    if (type === 'transfer' && accountId === toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    onSave({
      account_id: accountId,
      category_id: type === 'transfer' ? undefined : categoryId,
      amount: cents,
      transaction_type: type,
      transaction_date: date,
      transaction_time: timeStr,
      notes: notes.trim() || undefined,
      to_account_id: type === 'transfer' ? toAccountId : undefined,
    });

    // Reset and close
    setCents(0);
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Record Transaction">
      <div className="flex flex-col gap-5">
        {/* Type Toggle */}
        <div className="flex justify-center">
          <PillSegmentedControl
            value={type}
            onChange={(v) => {
              setType(v);
              setError(null);
            }}
            options={[
              { label: 'Expense', value: 'expense', icon: <ArrowDownLeft size={14} className="text-danger" /> },
              { label: 'Income', value: 'income', icon: <ArrowUpRight size={14} className="text-success" /> },
              { label: 'Transfer', value: 'transfer', icon: <ArrowLeftRight size={14} className="text-accent" /> },
            ]}
          />
        </div>

        {/* Large Amount Input */}
        <NumericAmountInput
          cents={cents}
          onChangeCents={(val) => {
            setCents(val);
            if (error) setError(null);
          }}
          currency={accounts.find((a) => a.id === accountId)?.currency || 'USD'}
        />

        {error && (
          <div className="p-2.5 rounded-xl bg-danger-light text-danger text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Account Pickers */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">
            {type === 'transfer' ? 'From Account' : 'Account'}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </div>

        {type === 'transfer' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Picker (if not transfer) */}
        {type !== 'transfer' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Category</label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-border/60 rounded-xl bg-surface-subtle">
              {filteredCategories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-surface border-2 border-accent shadow-sm scale-100'
                        : 'hover:bg-surface/60 opacity-80'
                    }`}
                  >
                    <CategoryIconAvatar iconName={c.icon} color={c.color} size="sm" />
                    <span className="text-[11px] font-semibold text-text truncate max-w-full mt-1">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date & Notes Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-muted">Date</label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface-subtle border border-border rounded-xl text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-muted">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lunch with colleagues"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3 bg-surface-subtle border border-border rounded-xl text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button variant="primary" size="lg" onClick={handleSave} className="mt-2 w-full">
          Save Transaction
        </Button>
      </div>
    </ModalDialog>
  );
};
