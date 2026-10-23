'use client';

import React, { useState } from 'react';
import { useTracker } from '@/lib/useTracker';
import { CategoryIconAvatar } from '@/components/primitives/CategoryIconAvatar';
import { Button } from '@/components/primitives/Button';
import { ModalDialog } from '@/components/primitives/ModalDialog';
import { ACCENT_SWATCHES } from '@/components/primitives/ColorSwatchPicker';
import { CategoryType } from '@/types';
import { Plus, Trash2, Tags } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory } = useTracker();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState('#047857');
  const [icon, setIcon] = useState('shopping-bag');
  const [error, setError] = useState<string | null>(null);

  const availableIcons = [
    'shopping-bag',
    'utensils',
    'tag',
    'car',
    'film',
    'heart-pulse',
    'dollar-sign',
    'briefcase',
    'coffee',
    'gift',
    'plane',
    'home',
    'zap',
  ];

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }
    addCategory({
      name: name.trim(),
      category_type: type,
      color,
      icon,
    });
    setName('');
    setError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Categories & Tags
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Personalize your spending taxonomy with custom icons and hues.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={16} />}
        >
          New Category
        </Button>
      </div>

      {/* Expense Categories */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider text-text-muted">
          Expense Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories
            .filter((c) => c.category_type === 'expense')
            .map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 bg-surface border border-border rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <CategoryIconAvatar iconName={cat.icon} color={cat.color} size="md" />
                  <span className="text-sm font-bold text-text">{cat.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Income Categories */}
      <section className="flex flex-col gap-3 mt-2">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider text-text-muted">
          Income Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories
            .filter((c) => c.category_type === 'income')
            .map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 bg-surface border border-border rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <CategoryIconAvatar iconName={cat.icon} color={cat.color} size="md" />
                  <span className="text-sm font-bold text-text">{cat.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* New Category Modal */}
      <ModalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Category"
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-danger-light text-danger text-xs font-medium text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Subscriptions, Hobbies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="w-full h-11 px-3.5 bg-surface-subtle border border-border rounded-xl text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Theme Color</label>
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

          {/* Icon Choice */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Icon Symbol</label>
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-surface-subtle border border-border rounded-xl">
              {availableIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-surface border-2 border-accent shadow-xs scale-105'
                      : 'hover:bg-surface/50 opacity-70'
                  }`}
                >
                  <CategoryIconAvatar iconName={ic} color={color} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={handleSave} className="mt-3 w-full">
            Save Category
          </Button>
        </div>
      </ModalDialog>
    </div>
  );
}
