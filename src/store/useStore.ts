import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  Account,
  Budget,
  Category,
  Transaction,
  UserSettings,
} from '../types';

const SECURITY_PIN_STORAGE_KEY = 'vaultpace.security_pin';

export async function loadSecurityPin(): Promise<string | undefined> {
  try {
    const storedPin = await SecureStore.getItemAsync(SECURITY_PIN_STORAGE_KEY);
    return storedPin || undefined;
  } catch {
    return undefined;
  }
}

export async function saveSecurityPin(pin: string | null): Promise<void> {
  try {
    if (!pin) {
      await SecureStore.deleteItemAsync(SECURITY_PIN_STORAGE_KEY);
      return;
    }

    await SecureStore.setItemAsync(SECURITY_PIN_STORAGE_KEY, pin);
  } catch {
    // Secure storage is unavailable; fail closed and require reconfiguration.
  }
}

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Cash Wallet',
    account_type: 'cash',
    currency: 'INR',
    initial_balance: 0,
    current_balance: 0,
    color: '#047857',
    icon: 'wallet',
    transaction_count: 0,
  },
  {
    id: 'acc-2',
    name: 'Bank Account',
    account_type: 'bank',
    currency: 'INR',
    initial_balance: 0,
    current_balance: 0,
    color: '#0369a1',
    icon: 'landmark',
    transaction_count: 0,
  },
  {
    id: 'acc-3',
    name: 'Savings Vault',
    account_type: 'savings',
    currency: 'INR',
    initial_balance: 0,
    current_balance: 0,
    color: '#b45309',
    icon: 'piggy-bank',
    transaction_count: 0,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Groceries', category_type: 'expense', color: '#047857', icon: 'shopping-bag', is_default: true, sort_order: 1 },
  { id: 'cat-2', name: 'Dining', category_type: 'expense', color: '#0369a1', icon: 'utensils', is_default: true, sort_order: 2 },
  { id: 'cat-3', name: 'Shopping', category_type: 'expense', color: '#be123c', icon: 'tag', is_default: true, sort_order: 3 },
  { id: 'cat-4', name: 'Transit', category_type: 'expense', color: '#b45309', icon: 'car', is_default: true, sort_order: 4 },
  { id: 'cat-5', name: 'Entertainment', category_type: 'expense', color: '#6d28d9', icon: 'film', is_default: true, sort_order: 5 },
  { id: 'cat-6', name: 'Health & Wellness', category_type: 'expense', color: '#0f766e', icon: 'heart-pulse', is_default: true, sort_order: 6 },
  { id: 'cat-expense-other', name: 'Other', category_type: 'expense', color: '#64748b', icon: 'more-horizontal', is_default: true, sort_order: 7 },
  { id: 'cat-7', name: 'Salary', category_type: 'income', color: '#047857', icon: 'briefcase', is_default: true, sort_order: 8 },
  { id: 'cat-8', name: 'Freelance & Bonus', category_type: 'income', color: '#1d4ed8', icon: 'briefcase', is_default: true, sort_order: 9 },
  { id: 'cat-income-other', name: 'Other', category_type: 'income', color: '#64748b', icon: 'more-horizontal', is_default: true, sort_order: 10 },
];

export const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'b-1',
    name: 'Monthly Spending',
    amount_limit: 2500000, // ₹25,000.00
    period_type: 'monthly',
    start_date: new Date().toISOString().slice(0, 7) + '-01',
    notify_threshold: 0.8,
  },
];

export const DEFAULT_CATEGORY_LIMITS: Record<string, number> = {
  'cat-1': 2000000, // Groceries ₹20,000.00
  'cat-2': 600000,  // Dining ₹6,000.00
  'cat-3': 1000000, // Shopping ₹10,000.00
  'cat-4': 500000,  // Transit ₹5,000.00
  'cat-5': 500000,  // Entertainment ₹5,000.00
  'cat-6': 500000,  // Health & Wellness ₹5,000.00
  'cat-expense-other': 500000, // Other ₹5,000.00
};

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_SETTINGS: UserSettings = {
  theme_mode: 'light',
  accent_color: 'emerald',
  default_currency: 'INR',
  first_day_of_week: 1, // Monday
  biometrics_enabled: false,
  pin_lock_enabled: false,
  security_pin: undefined,
  notifications_enabled: true,
  haptics_enabled: true,
};

function calculateBalances(accounts: Account[], transactions: Transaction[]): Account[] {
  const sanitizedAccounts = accounts.filter(
    (acc) =>
      acc &&
      acc.name?.toLowerCase() !== 'consolidated' &&
      acc.name?.toLowerCase() !== 'all' &&
      acc.id !== 'consolidated' &&
      acc.id !== 'all'
  );

  const txMap: Record<
    string,
    {
      income: number;
      expense: number;
      transferIn: number;
      transferOut: number;
      borrowIn: number;
      lendOut: number;
      count: number;
    }
  > = {};

  for (const acc of sanitizedAccounts) {
    txMap[acc.id] = {
      income: 0,
      expense: 0,
      transferIn: 0,
      transferOut: 0,
      borrowIn: 0,
      lendOut: 0,
      count: 0,
    };
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
    } else if (tx.transaction_type === 'borrow') {
      // Money borrowed flows into the selected wallet (increases wallet balance, liability)
      if (txMap[tx.account_id]) {
        txMap[tx.account_id].borrowIn += tx.amount;
        txMap[tx.account_id].count += 1;
      }
    } else if (tx.transaction_type === 'lend') {
      // Money lent flows out of the selected wallet (decreases wallet balance, receivable asset)
      if (txMap[tx.account_id]) {
        txMap[tx.account_id].lendOut += tx.amount;
        txMap[tx.account_id].count += 1;
      }
    }
  }

  return sanitizedAccounts.map((acc) => {
    const stats = txMap[acc.id] || {
      income: 0,
      expense: 0,
      transferIn: 0,
      transferOut: 0,
      borrowIn: 0,
      lendOut: 0,
      count: 0,
    };
    const current =
      acc.initial_balance +
      stats.income -
      stats.expense -
      stats.transferOut +
      stats.transferIn +
      stats.borrowIn -
      stats.lendOut;
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
  settleDebt: (id: string, settlementAccountId: string) => void;

  addAccount: (acc: Omit<Account, 'id' | 'current_balance' | 'transaction_count'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Category Limits
  categoryLimits: Record<string, number>;
  setCategoryLimit: (categoryId: string, limitCents: number) => void;

  // Lock / Security State
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  hydrateSecurityPin: () => Promise<void>;
  setSecurityPin: (pin: string | null) => Promise<void>;
  resetSecurityPin: () => Promise<void>;

  updateSettings: (settings: Partial<UserSettings>) => void;
  cleanSlateFinancialRecords: () => void;
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
      categoryLimits: DEFAULT_CATEGORY_LIMITS,
      isAppLocked: false,

      setCategoryLimit: (categoryId: string, limitCents: number) => {
        set((state) => ({
          categoryLimits: {
            ...(state.categoryLimits || DEFAULT_CATEGORY_LIMITS),
            [categoryId]: limitCents,
          },
        }));
      },

      setIsAppLocked: (locked: boolean) => {
        set({ isAppLocked: locked });
      },

      hydrateSecurityPin: async () => {
        const storedPin = await loadSecurityPin();
        set((state) => ({
          settings: {
            ...state.settings,
            security_pin: storedPin,
          },
        }));
      },

      setSecurityPin: async (pin: string | null) => {
        const safePin = pin || undefined;
        await saveSecurityPin(safePin ?? null);
        set((state) => ({
          settings: {
            ...state.settings,
            security_pin: safePin,
            pin_lock_enabled: Boolean(safePin),
          },
        }));
      },

      resetSecurityPin: async () => {
        await saveSecurityPin(null);
        set((state) => ({
          isAppLocked: false,
          settings: {
            ...state.settings,
            security_pin: undefined,
            pin_lock_enabled: false,
          },
        }));
      },

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

      settleDebt: (txId, settlementAccountId) => {
        const tx = get().transactions.find((t) => t.id === txId);
        if (!tx || tx.is_settled) return;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}:00`;

        // 1. Mark original debt movement as settled
        const updatedDebt: Transaction = {
          ...tx,
          is_settled: true,
          settled_at: today,
          settled_account_id: settlementAccountId,
        };

        // 2. Create the offsetting settlement payment movement in the selected wallet
        const settlementTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          account_id: settlementAccountId,
          amount: tx.amount,
          // Settling borrowed money means you pay it out (expense)
          // Settling lent money means you collect it in (income)
          transaction_type: tx.transaction_type === 'borrow' ? 'expense' : 'income',
          transaction_date: today,
          transaction_time: timeStr,
          is_settlement: true,
          notes:
            tx.transaction_type === 'borrow'
              ? `Settled: Repaid borrowed money to ${tx.contact_name || 'Contact'}`
              : `Settled: Collected lent money from ${tx.contact_name || 'Contact'}`,
          created_at: new Date().toISOString(),
        };

        const updatedTxList = [
          settlementTx,
          ...get().transactions.map((t) => (t.id === txId ? updatedDebt : t)),
        ];
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
          settings: {
            ...get().settings,
            ...settingsUpdates,
            security_pin: get().settings.security_pin,
          },
        });
      },

      cleanSlateFinancialRecords: () => {
        set((state) => {
          // Zero out existing user accounts, completely filtering out any "Consolidated" or pseudo accounts
          const cleanAccounts = state.accounts.filter(
            (a) =>
              a &&
              a.name?.toLowerCase() !== 'consolidated' &&
              a.name?.toLowerCase() !== 'all' &&
              a.id !== 'consolidated' &&
              a.id !== 'all'
          );
          const zeroedAccounts: Account[] = (
            cleanAccounts.length > 0 ? cleanAccounts : DEFAULT_ACCOUNTS
          ).map((acc) => ({
            ...acc,
            initial_balance: 0,
            current_balance: 0,
            transaction_count: 0,
          }));

          return {
            transactions: [],
            accounts: zeroedAccounts,
            // Category limits, budgets, categories, and settings (PIN, biometrics, theme, preferences) are preserved strictly!
          };
        });
      },

      resetToDefaults: () => {
        // Alias cleanSlateFinancialRecords to ensure core settings are never wiped
        get().cleanSlateFinancialRecords();
      },

      getTotalNetWorthCents: () => {
        return get().accounts.reduce((acc, a) => acc + a.current_balance, 0);
      },
    }),
    {
      name: 'vaultpace_mobile_store_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        categories: state.categories,
        budgets: state.budgets,
        transactions: state.transactions,
        settings: {
          ...state.settings,
          security_pin: undefined,
        },
        categoryLimits: state.categoryLimits,
      }),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) {
          return persistedState;
        }

        if (persistedState.settings) {
          persistedState.settings.security_pin = undefined;
        }

        if (version < 2) {
          return {
            accounts: DEFAULT_ACCOUNTS,
            categories: DEFAULT_CATEGORIES,
            budgets: DEFAULT_BUDGETS,
            transactions: [],
            settings: DEFAULT_SETTINGS,
            categoryLimits: DEFAULT_CATEGORY_LIMITS,
          };
        }
        if (Array.isArray(persistedState.accounts)) {
          persistedState.accounts = persistedState.accounts.filter(
            (acc: any) =>
              acc &&
              acc.name?.toLowerCase() !== 'consolidated' &&
              acc.name?.toLowerCase() !== 'all' &&
              acc.id !== 'consolidated' &&
              acc.id !== 'all'
          );
          if (persistedState.accounts.length === 0) {
            persistedState.accounts = DEFAULT_ACCOUNTS;
          }
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.accounts)) {
          state.accounts = state.accounts.filter(
            (acc) =>
              acc &&
              acc.name?.toLowerCase() !== 'consolidated' &&
              acc.name?.toLowerCase() !== 'all' &&
              acc.id !== 'consolidated' &&
              acc.id !== 'all'
          );
          if (state.accounts.length === 0) {
            state.accounts = DEFAULT_ACCOUNTS;
          }
        }
        if (state && Array.isArray(state.categories)) {
          const hasExpenseOther = state.categories.some(
            (c) => c.category_type === 'expense' && c.name.toLowerCase() === 'other'
          );
          if (!hasExpenseOther) {
            state.categories.push({
              id: 'cat-expense-other',
              name: 'Other',
              category_type: 'expense',
              color: '#64748b',
              icon: 'more-horizontal',
              is_default: true,
              sort_order: 99,
            });
          }
          const hasIncomeOther = state.categories.some(
            (c) => c.category_type === 'income' && c.name.toLowerCase() === 'other'
          );
          if (!hasIncomeOther) {
            state.categories.push({
              id: 'cat-income-other',
              name: 'Other',
              category_type: 'income',
              color: '#64748b',
              icon: 'more-horizontal',
              is_default: true,
              sort_order: 100,
            });
          }
        }
      },
    }
  )
);

export function formatCurrency(cents: number, currency?: string): string {
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const selectedCurrency = (
    currency || useStore.getState().settings?.default_currency || 'INR'
  ).toUpperCase();

  const symbolMap: Record<string, string> = {
    INR: '₹',
    IND: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
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
