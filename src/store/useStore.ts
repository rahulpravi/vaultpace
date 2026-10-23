import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  Budget,
  Category,
  Transaction,
  UserSettings,
} from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Wallet',
    account_type: 'cash',
    currency: 'USD',
    initial_balance: 15000, // $150.00
    current_balance: -4154, // -$41.54 USD
    color: '#047857',
    icon: 'wallet',
    transaction_count: 178,
  },
  {
    id: 'acc-2',
    name: 'Euros Account',
    account_type: 'bank',
    currency: 'EUR',
    initial_balance: 50000,
    current_balance: -10300, // -€103.00 EUR
    color: '#0369a1',
    icon: 'landmark',
    transaction_count: 5,
  },
  {
    id: 'acc-3',
    name: 'Savings Vault',
    account_type: 'savings',
    currency: 'USD',
    initial_balance: 385000, // $3,850.00 USD
    current_balance: 385000,
    color: '#b45309',
    icon: 'piggy-bank',
    transaction_count: 12,
  },
  {
    id: 'acc-4',
    name: 'Rewards Credit',
    account_type: 'credit',
    currency: 'USD',
    initial_balance: 0,
    current_balance: -24580, // -$245.80 USD
    color: '#be123c',
    icon: 'credit-card',
    transaction_count: 24,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Groceries', category_type: 'expense', color: '#047857', icon: 'shopping-bag', is_default: true, sort_order: 1 },
  { id: 'cat-2', name: 'Dining', category_type: 'expense', color: '#0369a1', icon: 'utensils', is_default: true, sort_order: 2 },
  { id: 'cat-3', name: 'Shopping', category_type: 'expense', color: '#be123c', icon: 'tag', is_default: true, sort_order: 3 },
  { id: 'cat-4', name: 'Transit', category_type: 'expense', color: '#b45309', icon: 'car', is_default: true, sort_order: 4 },
  { id: 'cat-5', name: 'Entertainment', category_type: 'expense', color: '#6d28d9', icon: 'film', is_default: true, sort_order: 5 },
  { id: 'cat-6', name: 'Health & Wellness', category_type: 'expense', color: '#0f766e', icon: 'heart-pulse', is_default: true, sort_order: 6 },
  { id: 'cat-7', name: 'Salary', category_type: 'income', color: '#047857', icon: 'dollar-sign', is_default: true, sort_order: 7 },
  { id: 'cat-8', name: 'Freelance', category_type: 'income', color: '#1d4ed8', icon: 'briefcase', is_default: true, sort_order: 8 },
];

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'b-1',
    name: 'Monthly Spending',
    amount_limit: 50000, // $500.00
    period_type: 'monthly',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    notify_threshold: 0.8,
  },
  {
    id: 'b-2',
    name: 'Groceries Cap',
    amount_limit: 25000, // $250.00
    period_type: 'monthly',
    start_date: '2026-10-01',
    category_ids: ['cat-1'],
    notify_threshold: 0.85,
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    account_id: 'acc-1',
    category_id: 'cat-1',
    amount: 17419, // $174.19
    transaction_type: 'expense',
    transaction_date: '2026-10-23',
    transaction_time: '14:20:00',
    notes: 'Weekly fresh market produce & supplies',
  },
  {
    id: 'tx-2',
    account_id: 'acc-1',
    category_id: 'cat-3',
    amount: 11518, // $115.18
    transaction_type: 'expense',
    transaction_date: '2026-10-22',
    transaction_time: '18:15:00',
    notes: 'Home essentials & cookware',
  },
  {
    id: 'tx-3',
    account_id: 'acc-1',
    category_id: 'cat-2',
    amount: 8487, // $84.87
    transaction_type: 'expense',
    transaction_date: '2026-10-21',
    transaction_time: '20:45:00',
    notes: 'Bistro dinner with friends',
  },
  {
    id: 'tx-4',
    account_id: 'acc-1',
    category_id: 'cat-4',
    amount: 1450, // $14.50
    transaction_type: 'expense',
    transaction_date: '2026-10-20',
    transaction_time: '09:10:00',
    notes: 'City rail morning transit ticket',
  },
  {
    id: 'tx-5',
    account_id: 'acc-1',
    category_id: 'cat-5',
    amount: 2500, // $25.00
    transaction_type: 'expense',
    transaction_date: '2026-10-18',
    transaction_time: '19:00:00',
    notes: 'Cinema tickets',
  },
  {
    id: 'tx-6',
    account_id: 'acc-1',
    category_id: 'cat-7',
    amount: 320000, // +$3,200.00
    transaction_type: 'income',
    transaction_date: '2026-10-01',
    transaction_time: '08:00:00',
    notes: 'Monthly direct payroll deposit',
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  theme_mode: 'light',
  accent_color: 'emerald',
  default_currency: 'USD',
  first_day_of_week: 1, // Monday
  biometrics_enabled: false,
  notifications_enabled: true,
  haptics_enabled: true,
};

function calculateBalances(accounts: Account[], transactions: Transaction[]): Account[] {
  const txMap: Record<
    string,
    { income: number; expense: number; transferIn: number; transferOut: number; count: number }
  > = {};

  for (const acc of accounts) {
    txMap[acc.id] = { income: 0, expense: 0, transferIn: 0, transferOut: 0, count: 0 };
  }

  for (const tx of transactions) {
    if (tx.transaction_type === 'income' && txMap[tx.account_id]) {
      txMap[tx.account_id].income += tx.amount;
      txMap[tx.account_id].count += 1;
    } else if (tx.transaction_type === 'expense' && txMap[tx.account_id]) {
      txMap[tx.account_id].expense += tx.amount;
      txMap[tx.account_id].count += 1;
    } else if (tx.transaction_type === 'transfer') {
      if (txMap[tx.account_id]) {
        txMap[tx.account_id].transferOut += tx.amount;
        txMap[tx.account_id].count += 1;
      }
      if (tx.to_account_id && txMap[tx.to_account_id]) {
        txMap[tx.to_account_id].transferIn += tx.amount;
        txMap[tx.to_account_id].count += 1;
      }
    }
  }

  return accounts.map((acc) => {
    const stats = txMap[acc.id] || { income: 0, expense: 0, transferIn: 0, transferOut: 0, count: 0 };
    const current = acc.initial_balance + stats.income - stats.expense - stats.transferOut + stats.transferIn;
    return {
      ...acc,
      current_balance: current,
      transaction_count: stats.count,
    };
  });
}

interface TrackerStore {
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  settings: UserSettings;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id' | 'current_balance' | 'transaction_count'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  updateSettings: (settings: Partial<UserSettings>) => void;
  resetToDefaults: () => void;

  // Computed helper
  getTotalNetWorthCents: () => number;
}

export const useStore = create<TrackerStore>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      categories: DEFAULT_CATEGORIES,
      budgets: DEFAULT_BUDGETS,
      transactions: DEFAULT_TRANSACTIONS,
      settings: DEFAULT_SETTINGS,

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: new Date().toISOString(),
        };

        const updatedTxList = [newTx, ...get().transactions];
        const updatedAccounts = calculateBalances(get().accounts, updatedTxList);

        set({
          transactions: updatedTxList,
          accounts: updatedAccounts,
        });

        return newTx;
      },

      updateTransaction: (id, updates) => {
        const updatedTxList = get().transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
        const updatedAccounts = calculateBalances(get().accounts, updatedTxList);

        set({
          transactions: updatedTxList,
          accounts: updatedAccounts,
        });
      },

      deleteTransaction: (id) => {
        const updatedTxList = get().transactions.filter((t) => t.id !== id);
        const updatedAccounts = calculateBalances(get().accounts, updatedTxList);

        set({
          transactions: updatedTxList,
          accounts: updatedAccounts,
        });
      },

      addAccount: (acc) => {
        const newAccount: Account = {
          ...acc,
          id: `acc-${Date.now()}`,
          current_balance: acc.initial_balance,
          transaction_count: 0,
        };

        const updatedAccounts = calculateBalances([...get().accounts, newAccount], get().transactions);

        set({
          accounts: updatedAccounts,
        });

        return newAccount;
      },

      updateAccount: (id, updates) => {
        const updatedAccounts = get().accounts.map((a) => (a.id === id ? { ...a, ...updates } : a));
        set({
          accounts: calculateBalances(updatedAccounts, get().transactions),
        });
      },

      deleteAccount: (id) => {
        const remainingAccounts = get().accounts.filter((a) => a.id !== id);
        const remainingTxList = get().transactions.filter(
          (t) => t.account_id !== id && t.to_account_id !== id
        );

        set({
          accounts: calculateBalances(remainingAccounts, remainingTxList),
          transactions: remainingTxList,
        });
      },

      addCategory: (cat) => {
        const newCat: Category = {
          ...cat,
          id: `cat-${Date.now()}`,
        };
        set({ categories: [...get().categories, newCat] });
        return newCat;
      },

      updateCategory: (id, updates) => {
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        });
      },

      deleteCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          transactions: get().transactions.map((t) =>
            t.category_id === id ? { ...t, category_id: undefined } : t
          ),
        });
      },

      addBudget: (budget) => {
        const newBudget: Budget = {
          ...budget,
          id: `b-${Date.now()}`,
        };
        set({ budgets: [...get().budgets, newBudget] });
        return newBudget;
      },

      updateBudget: (id, updates) => {
        set({
          budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        });
      },

      deleteBudget: (id) => {
        set({
          budgets: get().budgets.filter((b) => b.id !== id),
        });
      },

      updateSettings: (settingsUpdates) => {
        set({
          settings: { ...get().settings, ...settingsUpdates },
        });
      },

      resetToDefaults: () => {
        set({
          accounts: calculateBalances(DEFAULT_ACCOUNTS, DEFAULT_TRANSACTIONS),
          categories: DEFAULT_CATEGORIES,
          budgets: DEFAULT_BUDGETS,
          transactions: DEFAULT_TRANSACTIONS,
          settings: DEFAULT_SETTINGS,
        });
      },

      getTotalNetWorthCents: () => {
        return get().accounts.reduce((acc, a) => acc + a.current_balance, 0);
      },
    }),
    {
      name: 'vaultpace_mobile_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function formatCurrency(cents: number, currency?: string): string {
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const selectedCurrency = (
    currency || useStore.getState().settings?.default_currency || 'USD'
  ).toUpperCase();

  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    IND: '₹',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const sym = symbolMap[selectedCurrency] || selectedCurrency + ' ';
  const locale = selectedCurrency === 'INR' || selectedCurrency === 'IND' ? 'en-IN' : 'en-US';

  const formatted = absDollars.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-${sym}${formatted}` : `${sym}${formatted}`;
}

export function parseAmountToCents(amountStr: string): number {
  const cleaned = amountStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
