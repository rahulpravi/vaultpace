import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(50),
  account_type: z.enum(['cash', 'bank', 'credit', 'savings', 'investment']),
  currency: z.string().length(3).default('USD'),
  initial_balance: z.number().int().default(0), // Cents
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  icon: z.string().min(1).default('wallet'),
});

export const updateAccountSchema = createAccountSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50),
  category_type: z.enum(['expense', 'income']),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  icon: z.string().min(1).default('tag'),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTransactionSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
  category_id: z.string().optional(),
  amount: z.number().int().positive('Amount must be positive in integer cents'),
  transaction_type: z.enum(['expense', 'income', 'transfer']),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  transaction_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  notes: z.string().max(250).optional(),
  to_account_id: z.string().optional(),
}).refine(
  (data) => {
    if (data.transaction_type === 'transfer') {
      return !!data.to_account_id && data.to_account_id !== data.account_id;
    }
    return !!data.category_id;
  },
  {
    message: 'Transfers require a distinct destination account; expenses/incomes require a category.',
  }
);

export const updateTransactionSchema = z.object({
  account_id: z.string().min(1).optional(),
  category_id: z.string().optional(),
  amount: z.number().int().positive().optional(),
  transaction_type: z.enum(['expense', 'income', 'transfer']).optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(250).optional(),
});

export const createBudgetSchema = z.object({
  name: z.string().trim().min(1, 'Budget name is required').max(50),
  amount_limit: z.number().int().positive('Budget cap must be positive integer cents'),
  period_type: z.enum(['weekly', 'monthly', 'yearly', 'custom']).default('monthly'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notify_threshold: z.number().min(0.1).max(1.0).default(0.8),
  category_ids: z.array(z.string()).optional(),
  account_ids: z.array(z.string()).optional(),
});

export const updateSettingsSchema = z.object({
  theme_mode: z.enum(['system', 'light', 'dark']).optional(),
  accent_color: z.enum(['emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'fuchsia', 'rose', 'amber', 'yellow']).optional(),
  default_currency: z.string().length(3).optional(),
  first_day_of_week: z.number().int().min(0).max(6).optional(),
  biometrics_enabled: z.boolean().optional(),
});
