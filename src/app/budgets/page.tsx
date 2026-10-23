'use client';

import React, { useState } from 'react';
import { useTracker } from '@/lib/useTracker';
import { BudgetProgressCard } from '@/components/domain/BudgetProgressCard';
import { CategoryBudgetItem } from '@/components/domain/CategoryBudgetItem';
import { AddBudgetModal } from '@/components/domain/AddBudgetModal';
import { Button } from '@/components/primitives/Button';
import { Plus, Target, Sparkles } from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, categories, transactions, addBudget } = useTracker();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hardcoded category sample limits for visual parity with screenshot 4
  const categoryLimits: Record<string, number> = {
    'cat-1': 25000, // Groceries $250.00
    'cat-2': 3000,  // Dining $30.00
    'cat-3': 12500, // Shopping $125.00
    'cat-4': 5000,  // Transit $50.00
    'cat-5': 6000,  // Entertainment $60.00
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Spending Budgets
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Monitor period thresholds and control category pace.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={16} />}
        >
          New Budget
        </Button>
      </div>

      {/* Main Budget Progress Card */}
      {budgets.map((b) => (
        <BudgetProgressCard key={b.id} budget={b} transactions={transactions} />
      ))}

      {/* Category Level Budgets (matches screenshot 4 & 10) */}
      <section className="flex flex-col gap-3 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Target size={16} className="text-accent" />
            <span>Category Allowances</span>
          </h2>
          <span className="text-2xs text-text-muted">Current Cycle</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {categories
            .filter((c) => c.category_type === 'expense')
            .map((cat) => {
              const catTx = transactions.filter((t) => t.category_id === cat.id);
              const spent = catTx.reduce((acc, t) => acc + t.amount, 0);
              const limit = categoryLimits[cat.id] || 10000;

              return (
                <CategoryBudgetItem
                  key={cat.id}
                  category={cat}
                  spentCents={spent}
                  limitCents={limit}
                  transactionCount={catTx.length}
                />
              );
            })}
        </div>
      </section>

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onSave={addBudget}
      />
    </div>
  );
}
