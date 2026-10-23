'use client';

import React from 'react';
import { AccentColor } from '@/types';
import { Check } from 'lucide-react';

export const ACCENT_SWATCHES: { name: AccentColor; hex: string; label: string }[] = [
  { name: 'emerald', hex: '#047857', label: 'Emerald Green' },
  { name: 'teal', hex: '#0f766e', label: 'Teal Mint' },
  { name: 'cyan', hex: '#0369a1', label: 'Sky Cyan' },
  { name: 'blue', hex: '#1d4ed8', label: 'Royal Blue' },
  { name: 'indigo', hex: '#4338ca', label: 'Deep Indigo' },
  { name: 'violet', hex: '#6d28d9', label: 'Electric Violet' },
  { name: 'fuchsia', hex: '#a21caf', label: 'Magenta Fuchsia' },
  { name: 'rose', hex: '#be123c', label: 'Coral Rose' },
  { name: 'amber', hex: '#b45309', label: 'Warm Amber' },
  { name: 'yellow', hex: '#a16207', label: 'Golden Sun' },
];

interface ColorSwatchPickerProps {
  value: AccentColor;
  onChange: (color: AccentColor) => void;
  className?: string;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-surface rounded-2xl border border-border ${className}`}>
      <h4 className="text-sm font-bold text-text mb-3">Select Color</h4>
      <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label="Color Palette">
        {ACCENT_SWATCHES.map((swatch) => {
          const isSelected = swatch.name === value;
          return (
            <button
              key={swatch.name}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={swatch.label}
              onClick={() => onChange(swatch.name)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              style={{ backgroundColor: swatch.hex }}
            >
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-text shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
