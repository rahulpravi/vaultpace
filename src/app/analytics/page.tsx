'use client';

import React, { useState, useMemo } from 'react';
import { useTracker } from '@/lib/useTracker';
import { CategoryDonutChart } from '@/components/domain/CategoryDonutChart';
import { SpendingLineGraph, TrendPoint } from '@/components/domain/SpendingLineGraph';
import { PillSegmentedControl } from '@/components/primitives/PillSegmentedControl';
import { CategoryIconAvatar } from '@/components/primitives/CategoryIconAvatar';
import { formatCurrency } from '@/lib/store';
import { TrendingUp, PieChart, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, categories } = useTracker();
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Expense breakdown by category
  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.transaction_type === 'expense'),
    [transactions]
  );

  const totalExpenseCents = useMemo(
    () => expenseTransactions.reduce((acc, t) => acc + t.amount, 0),
    [expenseTransactions]
  );

  const categorySliceData = useMemo(() => {
    if (totalExpenseCents === 0) return [];

    const map: Record<string, { category: (typeof categories)[0]; amountCents: number }> = {};
    for (const cat of categories) {
      if (cat.category_type === 'expense') {
        map[cat.id] = { category: cat, amountCents: 0 };
      }
    }

    for (const tx of expenseTransactions) {
      if (tx.category_id && map[tx.category_id]) {
        map[tx.category_id].amountCents += tx.amount;
      }
    }

    return Object.values(map)
      .filter((item) => item.amountCents > 0)
      .map((item) => ({
        category: item.category,
        amountCents: item.amountCents,
        percentage: Math.round((item.amountCents / totalExpenseCents) * 100),
      }))
      .sort((a, b) => b.amountCents - a.amountCents);
  }, [categories, expenseTransactions, totalExpenseCents]);

  const topCategory = categorySliceData[0];

  const trendPoints: TrendPoint[] = [
    { label: 'Jul 1', amountCents: 4500 },
    { label: 'Jul 9', amountCents: 12000 },
    { label: 'Jul 16', amountCents: 21500 },
    { label: 'Jul 24', amountCents: 31000 },
    { label: 'Jul 31', amountCents: totalExpenseCents },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header with Time Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Visual Analytics
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Breakdown your spending patterns and category velocity.
          </p>
        </div>

        <PillSegmentedControl
          value={timeRange}
          onChange={setTimeRange}
          options={[
            { label: 'Monthly', value: 'month' },
            { label: 'Quarterly', value: 'quarter' },
            { label: 'Yearly', value: 'year' },
          ]}
        />
      </div>

      {/* Top Highlight Card */}
      {topCategory && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-surface to-surface-subtle border border-border rounded-2xl flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-light text-accent flex items-center justify-center">
              <Award size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-text-muted">Top Expense Area</div>
              <div className="text-sm font-bold text-text flex items-center gap-1.5 mt-0.5">
                <span>{topCategory.category.name}</span>
                <span className="text-xs font-normal text-text-muted">
                  ({topCategory.percentage}% of all expenses)
                </span>
              </div>
            </div>
          </div>
          <div className="font-display text-base sm:text-lg font-extrabold text-text">
            {formatCurrency(topCategory.amountCents)}
          </div>
        </div>
      )}

      {/* Interactive Donut Chart */}
      <section className="p-6 bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-card flex flex-col items-center">
        <h2 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
          <PieChart size={16} className="text-accent" />
          <span>Category Distribution</span>
        </h2>

        <CategoryDonutChart
          data={categorySliceData}
          totalCents={totalExpenseCents}
        />
      </section>

      {/* Velocity Trend Curve */}
      <section>
        <SpendingLineGraph points={trendPoints} height={200} />
      </section>

      {/* Ranked Categories Breakdown List */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-bold text-text mb-1">Detailed Breakdown</h2>
        {categorySliceData.map((item, idx) => (
          <div
            key={item.category.id}
            className="p-3.5 bg-surface border border-border rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-xs font-bold text-text-muted">{idx + 1}.</span>
              <CategoryIconAvatar iconName={item.category.icon} color={item.category.color} size="sm" />
              <span className="text-sm font-bold text-text">{item.category.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold font-display text-text">
                {formatCurrency(item.amountCents)}
              </div>
              <div className="text-2xs text-accent font-semibold">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
