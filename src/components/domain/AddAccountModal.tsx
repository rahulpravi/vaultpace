'use client';

import React, { useState } from 'react';
import { AccountType } from '@/types';
import { ModalDialog } from '../primitives/ModalDialog';
import { Button } from '../primitives/Button';
import { ACCENT_SWATCHES } from '../primitives/ColorSwatchPicker';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acc: {
    name: string;
    account_type: AccountType;
    currency: string;
    initial_balance: number;
    color: string;
    icon: string;
  }) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [currency, setCurrency] = useState('USD');
  const [initialDollars, setInitialDollars] = useState('0.00');
  const [color, setColor] = useState('#047857');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide an account name.');
      return;
    }

    const parsed = parseFloat(initialDollars);
    const cents = isNaN(parsed) ? 0 : Math.round(parsed * 100);

    const iconMap: Record<AccountType, string> = {
      cash: 'wallet',
      bank: 'landmark',
      savings: 'piggy-bank',
      credit: 'credit-card',
      investment: 'briefcase',
    };

    onSave({
      name: name.trim(),
      account_type: accountType,
      currency,
      initial_balance: cents,
      color,
      icon: iconMap[accountType] || 'wallet',
    });

    setName('');
    setInitialDollars('0.00');
    setError(null);
    onClose();
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Create Account">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-danger-light text-danger text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Account Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Account Name</label>
          <input
            type="text"
            placeholder="e.g. Daily Checking, Vacation Stash"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Account Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="cash">Cash / Wallet</option>
            <option value="bank">Bank Checking</option>
            <option value="savings">Savings Vault</option>
            <option value="credit">Credit Card</option>
            <option value="investment">Investment Pool</option>
          </select>
        </div>

        {/* Currency & Starting Balance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Initial Balance</label>
            <input
              type="number"
              step="0.01"
              value={initialDollars}
              onChange={(e) => setInitialDollars(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Color Choice */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Account Color</label>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {ACCENT_SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                onClick={() => setColor(swatch.hex)}
                className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${
                  color === swatch.hex ? 'scale-110 ring-2 ring-text shadow-sm' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.hex }}
                aria-label={swatch.label}
              />
            ))}
          </div>
        </div>

        <Button variant="primary" size="lg" onClick={handleSave} className="mt-3 w-full">
          Create Account
        </Button>
      </div>
    </ModalDialog>
  );
};
