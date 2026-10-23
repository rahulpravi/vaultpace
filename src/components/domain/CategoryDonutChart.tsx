'use client';

import React, { useState } from 'react';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/store';
import { ShoppingBag, Utensils, Tag, Car, Film, HeartPulse, HelpCircle, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'utensils': Utensils,
  'tag': Tag,
  'car': Car,
  'film': Film,
  'heart-pulse': HeartPulse,
};

interface SliceData {
  category: Category;
  amountCents: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  data: SliceData[];
  totalCents: number;
  title?: string;
  onSliceClick?: (category: Category) => void;
  className?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  totalCents,
  title = 'Spending Breakdown',
  onSliceClick,
  className = '',
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const size = 260;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative angles for slices and icon positioning
  let cumulativePercent = 0;
  const slices = data.map((d, index) => {
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + d.percentage;
    cumulativePercent += d.percentage;

    const strokeDasharray = `${(d.percentage * circumference) / 100} ${circumference}`;
    const strokeDashoffset = -((startPercent * circumference) / 100);

    // Angle in radians for center of slice
    const midPercent = (startPercent + endPercent) / 2;
    const midAngle = (midPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const iconX = center + radius * Math.cos(midAngle);
    const iconY = center + radius * Math.sin(midAngle);

    return {
      ...d,
      index,
      strokeDasharray,
      strokeDashoffset,
      iconX,
      iconY,
      hasIcon: d.percentage >= 6, // Suppress icon if slice too narrow
    };
  });

  const activeSlice = selectedIdx !== null ? slices[selectedIdx] : null;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative w-[260px] h-[260px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 overflow-visible"
        >
          {/* Background Ring Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isSelected = selectedIdx === slice.index;
            return (
              <circle
                key={slice.category.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.category.color}
                strokeWidth={isSelected ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onClick={() => {
                  setSelectedIdx(selectedIdx === slice.index ? null : slice.index);
                  onSliceClick?.(slice.category);
                }}
              />
            );
          })}
        </svg>

        {/* Center Hole Information Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          {activeSlice ? (
            <>
              <span className="text-xs font-semibold text-text-muted truncate max-w-[120px]">
                {activeSlice.category.name}
              </span>
              <span className="font-display text-xl font-extrabold text-text mt-0.5">
                {formatCurrency(activeSlice.amountCents)}
              </span>
              <span className="text-2xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent-light mt-1">
                {activeSlice.percentage}% of spend
              </span>
            </>
          ) : (
            <>
              <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">
                Total Expenses
              </span>
              <span className="font-display text-xl sm:text-2xl font-extrabold text-text mt-0.5">
                {formatCurrency(totalCents)}
              </span>
              <span className="text-2xs text-text-muted mt-1">
                {data.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Category Mini Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-sm">
        {data.map((d, idx) => (
          <button
            key={d.category.id}
            type="button"
            onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              selectedIdx === idx
                ? 'bg-surface border border-accent ring-1 ring-accent text-text font-bold shadow-sm'
                : 'bg-surface-subtle text-text-muted hover:text-text'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.category.color }}
            />
            <span className="truncate max-w-[90px]">{d.category.name}</span>
            <span className="opacity-70 font-mono text-[10px]">{d.percentage}%</span>
          </button>
        ))}
      </div>
    </div>
  );
};
