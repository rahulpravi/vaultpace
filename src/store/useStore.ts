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
import { evaluateMathExpression } from '../utils/calculator';

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

/**
 * Helper to determine if a category represents an 'Other' fallback category.
 * Matches by dedicated system ID ('cat-expense-other', 'cat-income-other') or by trimmed case-insensitive name 'other'.
 */
export const isOtherCategory = (cat?: { id?: string; name?: string } | null): boolean => {
  if (!cat) return false;
  if (cat.id === 'cat-expense-other' || cat.id === 'cat-income-other') return true;
  return Boolean(cat.name?.trim().toLowerCase() === 'other');
};

/**
 * Reusable utility to ensure the 'Other' category is always pinned to the end.
 * Works seamlessly for:
 * 1. Single category type lists (e.g. only expenses, or only incomes) -> 'Other' at the end.
 * 2. Mixed category lists (both expense and income) -> Expenses first (with expense 'Other' last), then Incomes (with income 'Other' last).
 * Preserves the relative order of all non-Other categories without mutating the input array.
 */
export const sortCategoriesWithOtherLast = <T extends { id?: string; name?: string; category_type?: string }>(
  categories: T[]
): T[] => {
  if (!Array.isArray(categories)) return [];

  const hasExpenses = categories.some((c) => c.category_type === 'expense');
  const hasIncomes = categories.some((c) => c.category_type === 'income');

  // If the list contains both expense and income categories, keep them grouped or separated properly
  if (hasExpenses && hasIncomes) {
    const expenses = categories.filter((c) => c.category_type === 'expense');
    const incomes = categories.filter((c) => c.category_type === 'income');
    const others = categories.filter((c) => c.category_type !== 'expense' && c.category_type !== 'income');

    const sortGroup = (list: T[]) => [
      ...list.filter((c) => !isOtherCategory(c)),
      ...list.filter((c) => isOtherCategory(c)),
    ];

    return [...sortGroup(expenses), ...sortGroup(incomes), ...sortGroup(others)];
  }

  // Single category type (or untyped list)
  return [
    ...categories.filter((c) => !isOtherCategory(c)),
    ...categories.filter((c) => isOtherCategory(c)),
  ];
};

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
  { id: 'cat-2', name: 'Food', category_type: 'expense', color: '#0369a1', icon: 'utensils', is_default: true, sort_order: 2 },
  { id: 'cat-3', name: 'Shopping', category_type: 'expense', color: '#be123c', icon: 'tag', is_default: true, sort_order: 3 },
  { id: 'cat-4', name: 'Travel', category_type: 'expense', color: '#b45309', icon: 'car', is_default: true, sort_order: 4 },
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
  'cat-2': 600000,  // Food ₹6,000.00
  'cat-3': 1000000, // Shopping ₹10,000.00
  'cat-4': 500000,  // Travel ₹5,000.00
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
  is_balance_hidden: false,
  auto_lock_interval: 'immediate',
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
  settleDebt: (id: string, settlementAccountId: string, partialAmountCents?: number) => void;
  settlePersonBalance: (
    contactName: string,
    contactPhone: string | undefined,
    amountCents: number,
    actionType: 'collect' | 'pay',
    settlementAccountId: string,
    customNotes?: string
  ) => void;

  addAccount: (acc: Omit<Account, 'id' | 'current_balance' | 'transaction_count'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  setMonthlySpendingCap: (amountCents: number) => void;

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
  restoreBackupData: (payload: {
    accounts: Account[];
    transactions: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
    categoryLimits?: Record<string, number>;
    settings?: Partial<UserSettings>;
  }) => void;

  // Computed helper
  getTotalNetWorthCents: () => number;

  // Hide balance toggle
  toggleHideBalance: () => void;

  // Recurring transactions processor
  processRecurringTransactions: () => void;

  // First-launch security onboarding
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
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
      hasCompletedOnboarding: false,

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

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

      settleDebt: (txId, settlementAccountId, partialAmountCents) => {
        const tx = get().transactions.find((t) => t.id === txId);
        if (!tx || tx.is_settled) return;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}:00`;

        const isPartial = Boolean(
          partialAmountCents && partialAmountCents > 0 && partialAmountCents < tx.amount
        );
        const settledAmount = isPartial ? partialAmountCents! : tx.amount;
        const remainingAmount = tx.amount - settledAmount;

        // 1. Mark original debt movement as settled or reduce amount if partial
        const updatedDebt: Transaction = isPartial
          ? {
              ...tx,
              amount: remainingAmount,
            }
          : {
              ...tx,
              is_settled: true,
              settled_at: today,
              settled_account_id: settlementAccountId,
            };

        // 2. Create the offsetting settlement payment movement in the selected wallet
        const settlementTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          account_id: settlementAccountId,
          amount: settledAmount,
          // Settling borrowed money means you pay it out (expense)
          // Settling lent money means you collect it in (income)
          transaction_type: tx.transaction_type === 'borrow' ? 'expense' : 'income',
          transaction_date: today,
          transaction_time: timeStr,
          is_settlement: true,
          contact_name: tx.contact_name,
          contact_phone: tx.contact_phone,
          settlement_for_id: tx.id,
          notes: isPartial
            ? tx.transaction_type === 'borrow'
              ? `Partial Repayment: Paid to ${tx.contact_name || 'Contact'} (${formatCurrency(remainingAmount, get().settings.default_currency)} remaining)`
              : `Partial Collection: Received from ${tx.contact_name || 'Contact'} (${formatCurrency(remainingAmount, get().settings.default_currency)} remaining)`
            : tx.transaction_type === 'borrow'
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

      settlePersonBalance: (
        contactName,
        contactPhone,
        amountCents,
        actionType,
        settlementAccountId,
        customNotes
      ) => {
        // Collect: Contact is paying user back (applies to active 'lend' transactions)
        // Pay: User is paying contact back (applies to active 'borrow' transactions)
        const targetType = actionType === 'collect' ? 'lend' : 'borrow';
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}:00`;

        let remainingToSettle = amountCents;
        const currentTxs = [...get().transactions];

        const updatedTxs = currentTxs.map((t) => {
          if (remainingToSettle <= 0) return t;
          if (t.transaction_type !== targetType || t.is_settled) return t;

          const matchesContact =
            (t.contact_name && t.contact_name.trim().toLowerCase() === contactName.trim().toLowerCase()) ||
            (contactPhone && t.contact_phone && t.contact_phone === contactPhone);

          if (!matchesContact) return t;

          if (t.amount <= remainingToSettle) {
            remainingToSettle -= t.amount;
            return {
              ...t,
              is_settled: true,
              settled_at: today,
              settled_account_id: settlementAccountId,
            };
          } else {
            const newAmount = t.amount - remainingToSettle;
            remainingToSettle = 0;
            return {
              ...t,
              amount: newAmount,
            };
          }
        });

        // Create settlement payment record in wallet
        const settlementTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          account_id: settlementAccountId,
          amount: amountCents,
          transaction_type: actionType === 'pay' ? 'expense' : 'income',
          transaction_date: today,
          transaction_time: timeStr,
          is_settlement: true,
          contact_name: contactName,
          contact_phone: contactPhone,
          notes:
            customNotes ||
            (actionType === 'pay'
              ? `Repayment: Paid debt to ${contactName}`
              : `Collection: Received repayment from ${contactName}`),
          created_at: new Date().toISOString(),
        };

        const updatedList = [settlementTx, ...updatedTxs];
        const updatedAccounts = calculateBalances(get().accounts, updatedList);

        set({
          transactions: updatedList,
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
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        };
        const updated = sortCategoriesWithOtherLast([...get().categories, newCat]);
        set({ categories: updated });
        return newCat;
      },

      updateCategory: (id, updates) => {
        const updated = sortCategoriesWithOtherLast(
          get().categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        set({ categories: updated });
      },

      deleteCategory: (id) => {
        const catToDelete = get().categories.find((c) => c.id === id);
        // Prevent deleting the fallback 'Other' category
        if (!catToDelete || isOtherCategory(catToDelete)) {
          return;
        }

        // Find the corresponding fallback 'Other' category of the same type
        const fallbackOther = get().categories.find(
          (c) =>
            c.id !== id &&
            c.category_type === catToDelete.category_type &&
            isOtherCategory(c)
        );
        const fallbackOtherId =
          fallbackOther?.id ||
          (catToDelete.category_type === 'income' ? 'cat-income-other' : 'cat-expense-other');

        // Automatically reassign all records to 'Other' so zero transactions are lost
        const updatedTransactions = get().transactions.map((t) =>
          t.category_id === id ? { ...t, category_id: fallbackOtherId } : t
        );

        // Remove category allowance if set
        const nextCategoryLimits = { ...get().categoryLimits };
        delete nextCategoryLimits[id];

        set({
          categories: sortCategoriesWithOtherLast(get().categories.filter((c) => c.id !== id)),
          categoryLimits: nextCategoryLimits,
          transactions: updatedTransactions,
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

      setMonthlySpendingCap: (amountCents: number) => {
        const budgets = get().budgets;
        const targetBudget =
          budgets.find((b) => b.id === 'b-1' || b.period_type === 'monthly') || budgets[0];

        if (targetBudget) {
          get().updateBudget(targetBudget.id, { amount_limit: amountCents });
        } else {
          get().addBudget({
            name: 'Monthly Spending',
            amount_limit: amountCents,
            period_type: 'monthly',
            start_date: new Date().toISOString().slice(0, 7) + '-01',
            notify_threshold: 0.8,
          });
        }
      },

      updateSettings: (settingsUpdates) => {
        const currentSettings = get().settings;
        const newCurrency = settingsUpdates.default_currency;
        let updatedAccounts = get().accounts;

        // When default_currency is changed, synchronize all existing accounts so symbols match globally
        if (newCurrency && newCurrency !== currentSettings.default_currency) {
          updatedAccounts = updatedAccounts.map((acc) => ({
            ...acc,
            currency: newCurrency,
          }));
        }

        set({
          accounts: updatedAccounts,
          settings: {
            ...currentSettings,
            ...settingsUpdates,
            security_pin: currentSettings.security_pin,
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

      restoreBackupData: (payload) => {
        set((state) => {
          // 1. Sanitize & calculate balances for accounts
          const cleanAccounts = (payload.accounts || []).filter(
            (a) =>
              a &&
              a.name?.toLowerCase() !== 'consolidated' &&
              a.name?.toLowerCase() !== 'all' &&
              a.id !== 'consolidated' &&
              a.id !== 'all'
          );
          const validAccounts = cleanAccounts.length > 0 ? cleanAccounts : DEFAULT_ACCOUNTS;
          const validTransactions = Array.isArray(payload.transactions) ? payload.transactions : [];
          const calculatedAccounts = calculateBalances(validAccounts, validTransactions);

          // 2. Categories
          const validCategories =
            Array.isArray(payload.categories) && payload.categories.length > 0
              ? sortCategoriesWithOtherLast(payload.categories)
              : state.categories;

          // 3. Budgets
          const validBudgets = Array.isArray(payload.budgets) ? payload.budgets : state.budgets;

          // 4. Category Limits
          const validLimits =
            payload.categoryLimits && typeof payload.categoryLimits === 'object'
              ? payload.categoryLimits
              : state.categoryLimits;

          // 5. Settings: Strictly preserve active security_pin, pin_lock_enabled, biometrics_enabled
          const mergedSettings: UserSettings = {
            ...state.settings,
            ...(payload.settings || {}),
            security_pin: state.settings.security_pin,
            pin_lock_enabled: state.settings.pin_lock_enabled,
            biometrics_enabled: state.settings.biometrics_enabled,
            last_backup_date: new Date().toISOString(),
          };

          return {
            accounts: calculatedAccounts,
            transactions: validTransactions,
            categories: validCategories,
            budgets: validBudgets,
            categoryLimits: validLimits,
            settings: mergedSettings,
          };
        });
      },

      getTotalNetWorthCents: () => {
        return get().accounts.reduce((acc, a) => acc + a.current_balance, 0);
      },

      toggleHideBalance: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            is_balance_hidden: !state.settings?.is_balance_hidden,
          },
        }));
      },

      processRecurringTransactions: () => {
        const state = get();
        const currentMonthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
        const todayStr = new Date().toISOString().split('T')[0];

        const recurringTemplates = state.transactions.filter(
          (t) => t.is_recurring && t.recurring_frequency === 'monthly'
        );

        if (recurringTemplates.length === 0) return;

        let hasAdded = false;
        let newTransactions = [...state.transactions];

        for (const template of recurringTemplates) {
          const templateDateDay = template.transaction_date.slice(8, 10) || '01';
          const targetDateForMonth = `${currentMonthKey}-${templateDateDay}`;

          // Check if this recurring item has already been recorded this month
          const alreadyRecordedThisMonth = newTransactions.some(
            (t) =>
              t.account_id === template.account_id &&
              t.amount === template.amount &&
              t.transaction_type === template.transaction_type &&
              t.transaction_date.startsWith(currentMonthKey)
          );

          if (!alreadyRecordedThisMonth && template.transaction_date < targetDateForMonth) {
            const recurringTx: Transaction = {
              id: `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              account_id: template.account_id,
              category_id: template.category_id,
              amount: template.amount,
              transaction_type: template.transaction_type,
              transaction_date: targetDateForMonth <= todayStr ? targetDateForMonth : todayStr,
              transaction_time: template.transaction_time || '09:00:00',
              notes: template.notes
                ? `${template.notes} (Monthly Recurring)`
                : 'Monthly Recurring Record',
              to_account_id: template.to_account_id,
              is_recurring: true,
              recurring_frequency: 'monthly',
              created_at: new Date().toISOString(),
            };
            newTransactions = [recurringTx, ...newTransactions];
            hasAdded = true;
          }
        }

        if (hasAdded) {
          const updatedAccounts = calculateBalances(state.accounts, newTransactions);
          set({
            transactions: newTransactions,
            accounts: updatedAccounts,
          });
        }
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
        hasCompletedOnboarding: state.hasCompletedOnboarding,
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
        if (state) {
          // If onboarding flag not yet recorded, detect if this is an existing user
          if (
            state.hasCompletedOnboarding === undefined &&
            (state.settings?.pin_lock_enabled ||
              state.settings?.biometrics_enabled ||
              (Array.isArray(state.transactions) && state.transactions.length > 0))
          ) {
            state.hasCompletedOnboarding = true;
          }

          // Ensure all accounts' currency is aligned with active default_currency
          if (state.settings?.default_currency && Array.isArray(state.accounts)) {
            const defCurr = state.settings.default_currency;
            state.accounts = state.accounts.map((acc) => ({
              ...acc,
              currency: defCurr,
            }));
          }
        }

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
          // Globally migrate legacy default categories: "Dining" -> "Food", "Transit" -> "Travel"
          state.categories = state.categories.map((c) => {
            if (c.id === 'cat-2' || c.name.toLowerCase() === 'dining') {
              return { ...c, name: 'Food' };
            }
            if (c.id === 'cat-4' || c.name.toLowerCase() === 'transit') {
              return { ...c, name: 'Travel' };
            }
            return c;
          });

          const hasExpenseOther = state.categories.some(
            (c) => c.category_type === 'expense' && isOtherCategory(c)
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
            (c) => c.category_type === 'income' && isOtherCategory(c)
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

          // Always pin 'Other' category last across all category types
          state.categories = sortCategoriesWithOtherLast(state.categories);
        }

        if (state && typeof state.processRecurringTransactions === 'function') {
          setTimeout(() => {
            state.processRecurringTransactions();
          }, 200);
        }
      },
    }
  )
);

// Cached NumberFormat instances to prevent garbage collection spikes
const numberFormatterCache: Record<string, Intl.NumberFormat> = {};

function getCachedNumberFormatter(locale: string): Intl.NumberFormat {
  let formatter = numberFormatterCache[locale];
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    numberFormatterCache[locale] = formatter;
  }
  return formatter;
}

const SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  IND: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
};

export function getCurrencySymbol(currencyCode?: string): string {
  const defaultCurrency = useStore.getState().settings?.default_currency || 'INR';
  const code = (currencyCode || defaultCurrency).toUpperCase();
  return SYMBOL_MAP[code] || SYMBOL_MAP[defaultCurrency] || '$';
}

export function formatCurrency(cents: number, currency?: string): string {
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const defaultCurrency = useStore.getState().settings?.default_currency || 'INR';
  const selectedCurrency = (
    currency || defaultCurrency
  ).toUpperCase();

  const sym = SYMBOL_MAP[selectedCurrency] || SYMBOL_MAP[defaultCurrency] || selectedCurrency + ' ';
  const locale = selectedCurrency === 'INR' || selectedCurrency === 'IND' ? 'en-IN' : 'en-US';

  const formatted = getCachedNumberFormatter(locale).format(absDollars);

  return isNegative ? `-${sym}${formatted}` : `${sym}${formatted}`;
}

export function parseAmountToCents(amountStr: string): number {
  if (!amountStr || !amountStr.trim()) return 0;
  // If user entered a calculation expression (e.g. "500 + 250"), evaluate safely
  const evaluated = evaluateMathExpression(amountStr);
  if (evaluated !== null && !isNaN(evaluated) && evaluated >= 0) {
    return Math.round(evaluated * 100);
  }
  const cleaned = amountStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
