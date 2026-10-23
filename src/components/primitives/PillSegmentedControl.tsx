'use client';

import React from 'react';

interface Option<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface PillSegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function PillSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: PillSegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center p-1 bg-surface-subtle border border-border rounded-full select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isSelected
                ? 'bg-surface text-text shadow-sm scale-100'
                : 'text-text-muted hover:text-text hover:bg-surface/40'
            }`}
          >
            {opt.icon && <span className="opacity-80">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
