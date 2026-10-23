'use client';

import React, { useState } from 'react';
import { Category, PeriodType } from '@/types';
import { ModalDialog } from '../primitives/ModalDialog';
import { Button } from '../primitives/Button';
import { PillSegmentedControl } from '../primitives/PillSegmentedControl';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (budget: {
    name: string;
    amount_limit: number;
    period_type: PeriodType;
    start_date: string;
    end_date?: string;
    notify_threshold: number;
    category_ids?: string[];
  }) => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('500');
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(80);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const parsed = parseFloat(amountStr);
    if (!name.trim()) {
      setError('Please provide a budget name.');
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please provide a positive budget limit amount.');
      return;
    }

    onSave({
      name: name.trim(),
      amount_limit: Math.round(parsed * 100),
      period_type: period,
      start_date: startDate,
      notify_threshold: threshold / 100,
      category_ids: selectedCats.length > 0 ? selectedCats : undefined,
    });

    setName('');
    setAmountStr('500');
    setSelectedCats([]);
    setError(null);
    onClose();
  };

  return (
    <ModalDialog isOpen={isOpen} onClose={onClose} title="Configure Budget">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-danger-light text-danger text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Budget Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Budget Name</label>
          <input
            type="text"
            placeholder="e.g. Total Monthly Cap, Dining Budget"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Period Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Recurrence Cycle</label>
          <PillSegmentedControl
            value={period}
            onChange={setPeriod}
            options={[
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />
        </div>

        {/* Spending Cap Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted">Limit Amount ($ USD)</label>
          <input
            type="number"
            step="10"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Categories Selection */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-muted">Categories Included</label>
            <span className="text-2xs text-text-muted">
              {selectedCats.length === 0 ? 'All Categories' : `${selectedCats.length} selected`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-surface-subtle border border-border rounded-xl">
            {categories
              .filter((c) => c.category_type === 'expense')
              .map((c) => {
                const isChecked = selectedCats.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isChecked
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'bg-surface border border-border text-text hover:bg-border/40'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Warning Threshold Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-muted">Alert Threshold</label>
            <span className="text-xs font-bold text-accent">{threshold}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-accent cursor-pointer"
          />
        </div>

        <Button variant="primary" size="lg" onClick={handleSave} className="mt-3 w-full">
          Save Budget Cap
        </Button>
      </div>
    </ModalDialog>
  );
};
