'use client';

import React from 'react';
import { useTracker } from '@/lib/useTracker';
import { ColorSwatchPicker } from '@/components/primitives/ColorSwatchPicker';
import { PillSegmentedControl } from '@/components/primitives/PillSegmentedControl';
import { Button } from '@/components/primitives/Button';
import { ThemeMode, AccentColor } from '@/types';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, resetToDefaults, transactions, accounts, categories, budgets } =
    useTracker();

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      accounts,
      categories,
      budgets,
      transactions,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fundtracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = 'ID,Date,Time,Type,Amount_Cents,Account,Category,Notes\n';
    for (const t of transactions) {
      const acc = accounts.find((a) => a.id === t.account_id)?.name || '';
      const cat = categories.find((c) => c.id === t.category_id)?.name || '';
      csv += `"${t.id}","${t.transaction_date}","${t.transaction_time || ''}","${t.transaction_type}",${t.amount},"${acc}","${cat}","${t.notes || ''}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fundtracker-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Customize themes, accent palette, and local offline backups.
        </p>
      </div>

      {/* Visual Appearance Section */}
      <section className="p-5 bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-card flex flex-col gap-5">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider text-text-muted">
          Appearance & Hues
        </h2>

        {/* Theme Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-text">Display Theme</div>
            <div className="text-xs text-text-muted">Choose between light, dark, or system</div>
          </div>

          <PillSegmentedControl
            value={settings.theme_mode}
            onChange={(mode) => updateSettings({ theme_mode: mode as ThemeMode })}
            options={[
              { label: 'Light', value: 'light', icon: <Sun size={14} /> },
              { label: 'Dark', value: 'dark', icon: <Moon size={14} /> },
              { label: 'System', value: 'system', icon: <Laptop size={14} /> },
            ]}
          />
        </div>

        {/* 10 Swatch Color Picker */}
        <div className="border-t border-border/50 pt-4">
          <ColorSwatchPicker
            value={settings.accent_color}
            onChange={(color) => updateSettings({ accent_color: color as AccentColor })}
            className="p-0 border-none bg-transparent"
          />
        </div>
      </section>

      {/* Regional & Financial Defaults */}
      <section className="p-5 bg-surface border border-border rounded-2xl shadow-card flex flex-col gap-4">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider text-text-muted">
          Regional Settings
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-text">Primary Currency</div>
            <div className="text-xs text-text-muted">Default unit for new accounts and budgets</div>
          </div>

          <select
            value={settings.default_currency}
            onChange={(e) => updateSettings({ default_currency: e.target.value })}
            className="h-10 px-3 bg-surface-subtle border border-border rounded-xl text-xs font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="IND">IND (₹) - Indian Rupee (IND)</option>
            <option value="USD">USD ($) - United States Dollar</option>
            <option value="EUR">EUR (€) - Euro</option>
            <option value="GBP">GBP (£) - British Pound</option>
            <option value="CAD">CAD (CA$) - Canadian Dollar</option>
            <option value="AUD">AUD (A$) - Australian Dollar</option>
            <option value="JPY">JPY (¥) - Japanese Yen</option>
          </select>
        </div>
      </section>

      {/* Data Portability & Backup */}
      <section className="p-5 bg-surface border border-border rounded-2xl shadow-card flex flex-col gap-4">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider text-text-muted">
          Data Portability & Backup
        </h2>
        <p className="text-xs text-text-muted">
          Your financial data stays 100% on this device. You can download a complete backup at any time.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportJSON}
            icon={<Download size={15} />}
          >
            Export JSON Backup
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download size={15} />}
          >
            Export CSV Ledger
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            icon={<RefreshCw size={15} />}
          >
            Reset Sample Data
          </Button>
        </div>
      </section>

      {/* Clean Room Statement & Version Info */}
      <section className="p-5 bg-surface-subtle border border-border rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-text">FundTracker v0.1.0</div>
            <div className="text-[11px] text-text-muted">
              Privacy-first • Zero advertisements • 100% Client verified
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-accent">
          <CheckCircle2 size={15} />
          <span>Offline Ready</span>
        </div>
      </section>
    </div>
  );
}
