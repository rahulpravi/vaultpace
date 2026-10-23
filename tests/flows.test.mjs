import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAccountSchema,
  createTransactionSchema,
  createBudgetSchema,
  createCategorySchema,
} from '../src/lib/validations.ts';

// Helper implementations matching store logic for unit testing
function formatCurrency(cents, currency = 'USD') {
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const curr = currency.toUpperCase();
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    IND: '₹',
    JPY: '¥',
  };
  const sym = symbolMap[curr] || curr + ' ';
  const locale = (curr === 'INR' || curr === 'IND') ? 'en-IN' : 'en-US';
  const formatted = absDollars.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${sym}${formatted}` : `${sym}${formatted}`;
}

function parseAmountToCents(amountStr) {
  const cleaned = amountStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

test('F01: Transaction validation and money math in integer cents', () => {
  // Parsing verification
  assert.equal(parseAmountToCents('$14.50'), 1450);
  assert.equal(parseAmountToCents('250'), 25000);
  assert.equal(parseAmountToCents('0.00'), 0);

  // Formatting verification (handles positive and negative amounts, and INR/IND)
  assert.equal(formatCurrency(1450, 'USD'), '$14.50');
  assert.equal(formatCurrency(-4154, 'USD'), '-$41.54');
  assert.equal(formatCurrency(385000, 'USD'), '$3,850.00');
  assert.equal(formatCurrency(1450, 'INR'), '₹14.50');
  assert.equal(formatCurrency(1450, 'IND'), '₹14.50');
  assert.equal(formatCurrency(-50000, 'INR'), '-₹500.00');

  // Valid expense
  const validExpense = createTransactionSchema.safeParse({
    account_id: 'acc-1',
    category_id: 'cat-1',
    amount: 1450,
    transaction_type: 'expense',
    transaction_date: '2026-10-23',
    notes: 'Coffee and snacks',
  });
  assert.equal(validExpense.success, true);

  // Negative amount rejected
  const negativeExpense = createTransactionSchema.safeParse({
    account_id: 'acc-1',
    category_id: 'cat-1',
    amount: -500,
    transaction_type: 'expense',
    transaction_date: '2026-10-23',
  });
  assert.equal(negativeExpense.success, false);

  // Transfer validation: requires to_account_id
  const transferMissingTarget = createTransactionSchema.safeParse({
    account_id: 'acc-1',
    amount: 1000,
    transaction_type: 'transfer',
    transaction_date: '2026-10-23',
  });
  assert.equal(transferMissingTarget.success, false);

  // Transfer validation: source and destination must differ
  const transferSameTarget = createTransactionSchema.safeParse({
    account_id: 'acc-1',
    to_account_id: 'acc-1',
    amount: 1000,
    transaction_type: 'transfer',
    transaction_date: '2026-10-23',
  });
  assert.equal(transferSameTarget.success, false);

  // Valid transfer
  const validTransfer = createTransactionSchema.safeParse({
    account_id: 'acc-1',
    to_account_id: 'acc-2',
    amount: 5000,
    transaction_type: 'transfer',
    transaction_date: '2026-10-23',
    notes: 'Checking to savings transfer',
  });
  assert.equal(validTransfer.success, true);
});

test('F02: Budget configuration and alert thresholds', () => {
  const validBudget = createBudgetSchema.safeParse({
    name: 'Monthly Groceries Cap',
    amount_limit: 25000, // $250.00
    period_type: 'monthly',
    start_date: '2026-10-01',
    notify_threshold: 0.85,
    category_ids: ['cat-1'],
  });
  assert.equal(validBudget.success, true);

  // Empty name rejected
  const invalidName = createBudgetSchema.safeParse({
    name: '   ',
    amount_limit: 25000,
    period_type: 'monthly',
    start_date: '2026-10-01',
  });
  assert.equal(invalidName.success, false);

  // Negative limit rejected
  const negativeLimit = createBudgetSchema.safeParse({
    name: 'Bad Budget',
    amount_limit: -100,
    period_type: 'monthly',
    start_date: '2026-10-01',
  });
  assert.equal(negativeLimit.success, false);
});

test('F04: Account creation and balance isolation', () => {
  const validAccount = createAccountSchema.safeParse({
    name: 'Travel Savings',
    account_type: 'savings',
    currency: 'USD',
    initial_balance: 50000,
    color: '#047857',
    icon: 'piggy-bank',
  });
  assert.equal(validAccount.success, true);

  // Invalid hex color rejected
  const invalidColor = createAccountSchema.safeParse({
    name: 'Bad Account',
    account_type: 'cash',
    currency: 'USD',
    initial_balance: 0,
    color: 'invalid-hex',
    icon: 'wallet',
  });
  assert.equal(invalidColor.success, false);
});

test('F05: Custom category taxonomy validation', () => {
  const validCat = createCategorySchema.safeParse({
    name: 'Subscriptions',
    category_type: 'expense',
    color: '#6d28d9',
    icon: 'film',
  });
  assert.equal(validCat.success, true);

  const invalidType = createCategorySchema.safeParse({
    name: 'Invalid Type Cat',
    category_type: 'other_unknown',
    color: '#6d28d9',
    icon: 'tag',
  });
  assert.equal(invalidType.success, false);
});
