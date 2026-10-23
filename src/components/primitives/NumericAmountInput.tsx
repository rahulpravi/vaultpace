'use client';

import React from 'react';
import { formatCurrency } from '@/lib/store';

interface NumericAmountInputProps {
  cents: number;
  onChangeCents: (cents: number) => void;
  currency?: string;
  className?: string;
}

export const NumericAmountInput: React.FC<NumericAmountInputProps> = ({
  cents,
  onChangeCents,
  currency = 'USD',
  className = '',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    onChangeCents(isNaN(num) ? 0 : num);
  };

  const addAmount = (centsToAdd: number) => {
    onChangeCents(cents + centsToAdd);
  };

  const clearAmount = () => {
    onChangeCents(0);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <label htmlFor="amount-input" className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
        Amount
      </label>

      <div className="relative flex items-center justify-center my-2">
        <input
          id="amount-input"
          type="text"
          inputMode="numeric"
          value={(cents / 100).toFixed(2)}
          onChange={handleInputChange}
          className="text-center font-display text-4xl sm:text-5xl font-extrabold text-text bg-transparent border-none focus:outline-none focus:ring-0 tracking-tight"
          aria-label="Transaction Amount"
        />
      </div>

      {/* Quick Add Chips */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
        {[100, 500, 1000, 5000].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => addAmount(step)}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-subtle border border-border text-text hover:bg-border/60 transition-colors active:scale-95"
          >
            +{formatCurrency(step, currency).replace('.00', '')}
          </button>
        ))}
        {cents > 0 && (
          <button
            type="button"
            onClick={clearAmount}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-danger-light text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
