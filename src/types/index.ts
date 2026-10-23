export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';

export interface Account {
  id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  initial_balance: number; // Stored in integer cents
  current_balance: number; // Stored in integer cents (computed)
  color: string;
  icon: string;
  is_archived?: boolean;
  sort_order?: number;
  transaction_count?: number;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  category_type: CategoryType;
  color: string;
  icon: string;
  is_default?: boolean;
  sort_order?: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  account_id: string;
  category_id?: string;
  amount: number; // Integer cents (strictly positive)
  transaction_type: TransactionType;
  transaction_date: string; // YYYY-MM-DD
  transaction_time?: string; // HH:MM:SS
  notes?: string;
  to_account_id?: string; // For transfers
  created_at?: string;
}

export type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Budget {
  id: string;
  name: string;
  amount_limit: number; // Integer cents
  period_type: PeriodType;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  notify_threshold: number; // 0.0 - 1.0 (default 0.80)
  category_ids?: string[]; // Empty means all categories
  account_ids?: string[]; // Empty means all accounts
}

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentColor =
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'rose'
  | 'amber'
  | 'yellow';

export interface UserSettings {
  theme_mode: ThemeMode;
  accent_color: AccentColor;
  default_currency: string;
  first_day_of_week: number; // 0=Sunday, 1=Monday
  biometrics_enabled: boolean;
  last_backup_date?: string;
  notifications_enabled: boolean;
  haptics_enabled: boolean;
}

// React Navigation Types
export type BottomTabParamList = {
  HomeTab: undefined;
  TransactionsTab: undefined;
  BudgetsTab: undefined;
  AccountsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  HelpContact: undefined;
  AddTransaction: undefined;
  AddAccount: undefined;
  AddBudget: undefined;
  Categories: undefined;
};
