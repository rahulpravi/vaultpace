'use client';

import { useEffect, useState } from 'react';
import { store } from './store';
import { Account, Budget, Category, Transaction, UserSettings } from '@/types';

export function useTracker() {
  const [state, setState] = useState(() => store.getState());

  useEffect(() => {
    // Initial sync
    setState({ ...store.getState() });
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  const totalNetWorthCents = state.accounts.reduce((acc, a) => acc + a.current_balance, 0);

  return {
    ...state,
    totalNetWorthCents,
    addTransaction: store.addTransaction.bind(store),
    updateTransaction: store.updateTransaction.bind(store),
    deleteTransaction: store.deleteTransaction.bind(store),
    addAccount: store.addAccount.bind(store),
    updateAccount: store.updateAccount.bind(store),
    deleteAccount: store.deleteAccount.bind(store),
    addCategory: store.addCategory.bind(store),
    updateCategory: store.updateCategory.bind(store),
    deleteCategory: store.deleteCategory.bind(store),
    addBudget: store.addBudget.bind(store),
    updateBudget: store.updateBudget.bind(store),
    deleteBudget: store.deleteBudget.bind(store),
    updateSettings: store.updateSettings.bind(store),
    resetToDefaults: store.resetToDefaults.bind(store),
  };
}
