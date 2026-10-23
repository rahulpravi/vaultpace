'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Settings,
  Plus,
  Wallet,
  Tags,
} from 'lucide-react';
import { useTracker } from '@/lib/useTracker';
import { AddTransactionModal } from './AddTransactionModal';

interface NavigationShellProps {
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { settings, accounts, categories, addTransaction } = useTracker();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('09:16');
  const [dayStr, setDayStr] = useState('Monday');
  const [dateStr, setDateStr] = useState('August 7, 2023');

  // Clock for desktop sidebar matching screenshot 9 & 12
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        })
      );
      setDayStr(now.toLocaleDateString('en-US', { weekday: 'long' }));
      setDateStr(now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme and accent color to document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme_mode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    root.setAttribute('data-accent', settings.accent_color || 'emerald');
  }, [settings.theme_mode, settings.accent_color]);

  const navItems = [
    { label: 'Home', href: '/home', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Budgets', href: '/budgets', icon: PieChart },
    { label: 'Analytics', href: '/analytics', icon: TrendingUp },
    { label: 'Accounts', href: '/accounts', icon: Wallet },
    { label: 'Categories', href: '/categories', icon: Tags },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-text transition-colors">
      {/* =========================================================================
          Desktop / Tablet Sidebar (matches screenshot 9 & 12)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border bg-surface p-6 flex-shrink-0 min-h-screen justify-between sticky top-0 h-screen select-none">
        <div>
          {/* Top Digital Clock Widget */}
          <div className="mb-8 pt-2">
            <div className="font-display text-4xl lg:text-5xl font-extrabold text-text tracking-tight">
              {timeStr}
            </div>
            <div className="text-sm font-bold text-text-muted mt-1">{dayStr}</div>
            <div className="text-xs text-text-muted/80">{dateStr}</div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Desktop Navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-accent/15 text-accent font-bold shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-surface-subtle'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Add Button in Sidebar */}
        <div className="pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-accent text-on-accent font-bold text-sm shadow-card hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          Main Content Container
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        {children}
      </main>

      {/* =========================================================================
          Mobile Bottom Navigation Bar
          ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around shadow-lg"
        aria-label="Mobile Navigation"
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? 'text-accent scale-105' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* =========================================================================
          Floating Action Button (Mobile & quick desktop access)
          ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-popover hover:scale-105 active:scale-95 transition-transform"
        aria-label="Add transaction"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSave={addTransaction}
      />
    </div>
  );
};
