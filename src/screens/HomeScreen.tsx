import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency, getCurrencySymbol } from '../store/useStore';
import { AppleWalletCardStack } from '../components/domain/AppleWalletCardStack';
import { TransactionRow } from '../components/domain/TransactionRow';
import { BudgetProgressCard } from '../components/domain/BudgetProgressCard';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { EditMonthlyCapModal } from '../components/domain/EditMonthlyCapModal';
import { BottomTabProps } from '../navigation/types';
import { Transaction } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Coins,
  Eye,
  EyeOff,
} from 'lucide-react-native';

export const HomeScreen: React.FC<BottomTabProps<'HomeTab'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const transactions = useStore((s) => s.transactions);
  const settings = useStore((s) => s.settings);
  const getTotalNetWorthCents = useStore((s) => s.getTotalNetWorthCents);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const toggleHideBalance = useStore((s) => s.toggleHideBalance);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMonthlyCapOpen, setIsEditMonthlyCapOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalNetWorth = useMemo(() => getTotalNetWorthCents(), [accounts, getTotalNetWorthCents]);

  // Guarantee only user accounts (Cash Wallet, Bank Account, Savings Vault, etc.) are rendered
  const userAccounts = useMemo(
    () =>
      accounts.filter(
        (acc) =>
          acc &&
          acc.name?.toLowerCase() !== 'consolidated' &&
          acc.name?.toLowerCase() !== 'all' &&
          acc.id !== 'consolidated' &&
          acc.id !== 'all'
      ),
    [accounts]
  );

  const selectedAccount = useMemo(
    () => (selectedAccountId ? userAccounts.find((a) => a.id === selectedAccountId) || null : null),
    [selectedAccountId, userAccounts]
  );

  // Fast O(1) Lookup Maps for Category & Account Entities
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Filter transactions by selected account with useMemo
  const filteredTransactions = useMemo(
    () =>
      selectedAccountId
        ? transactions.filter(
            (t) => t.account_id === selectedAccountId || t.to_account_id === selectedAccountId
          )
        : transactions,
    [transactions, selectedAccountId]
  );

  // Active Debts aggregated in a single O(N) pass
  const { activeDebts, activeLent, activeBorrowed } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    const debts: typeof transactions = [];
    for (const t of transactions) {
      if ((t.transaction_type === 'borrow' || t.transaction_type === 'lend') && !t.is_settled) {
        debts.push(t);
        if (t.transaction_type === 'lend') {
          lent += t.amount;
        } else if (t.transaction_type === 'borrow') {
          borrowed += t.amount;
        }
      }
    }
    return { activeDebts: debts, activeLent: lent, activeBorrowed: borrowed };
  }, [transactions]);

  // Total & Monthly Income & Expense calculated in a single O(N) pass
  const { totalIncome, totalSpent, monthlyIncome, monthlyExpense } = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    let inc = 0;
    let spent = 0;
    let mInc = 0;
    let mSpent = 0;

    for (const t of filteredTransactions) {
      if (t.is_settlement || t.notes?.toLowerCase().startsWith('settled:')) continue;

      const isCurrentMonth = t.transaction_date?.startsWith(currentMonthPrefix);

      if (t.transaction_type === 'income') {
        inc += t.amount;
        if (isCurrentMonth) mInc += t.amount;
      } else if (t.transaction_type === 'expense') {
        spent += t.amount;
        if (isCurrentMonth) mSpent += t.amount;
      }
    }

    return {
      totalIncome: inc,
      totalSpent: spent,
      monthlyIncome: mInc,
      monthlyExpense: mSpent,
    };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(
    () => filteredTransactions.slice(0, 5),
    [filteredTransactions]
  );

  const handleEditTransaction = useCallback((item: Transaction) => {
    setEditingTransaction(item);
  }, []);

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      deleteTransaction(id);
    },
    [deleteTransaction]
  );

  const handleSelectAccount = useCallback((id: string | null) => {
    setSelectedAccountId(id);
  }, []);

  const handleToggleHideBalance = useCallback(() => {
    triggerHaptic('selection');
    toggleHideBalance();
  }, [toggleHideBalance]);

  const handleNavigateAccounts = useCallback(() => {
    navigation.navigate('AccountsTab');
  }, [navigation]);

  const handleNavigateTransactions = useCallback(() => {
    navigation.navigate('TransactionsTab');
  }, [navigation]);

  const handleNavigateDebts = useCallback(() => {
    navigation.navigate('Debts' as any);
  }, [navigation]);

  const handleNavigateBudgets = useCallback(() => {
    navigation.navigate('BudgetsTab');
  }, [navigation]);

  const handleOpenAddModal = useCallback(() => {
    triggerHaptic('light');
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleOpenMonthlyCap = useCallback(() => {
    setIsEditMonthlyCapOpen(true);
  }, []);

  const handleCloseMonthlyCap = useCallback(() => {
    setIsEditMonthlyCapOpen(false);
  }, []);

  const activeBudget = budgets[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* =========================================================================
            Brand App Bar with VaultPace Logo
            ========================================================================= */}
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>VaultPace</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                Private Financial Tracker
              </Text>
            </View>
          </View>

          <View style={[styles.privacyBadge, { backgroundColor: colors.accentLight }]}>
            <ShieldCheck size={12} color={colors.accent} />
            <Text style={[styles.privacyBadgeText, { color: colors.accent }]}>
              Local & Private
            </Text>
          </View>
        </View>

        {/* =========================================================================
            Top Net Worth Summary / Active Wallet Balance
            ========================================================================= */}
        <View style={styles.topHeader}>
          <View style={styles.netWorthHeaderRow}>
            <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>
              {selectedAccount ? `${selectedAccount.name.toUpperCase()} BALANCE` : 'TOTAL NET WORTH'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleHideBalance}
              style={[
                styles.eyeBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel={settings.is_balance_hidden ? 'Show Balance' : 'Hide Balance'}
            >
              {settings.is_balance_hidden ? (
                <EyeOff size={14} color={colors.accent} />
              ) : (
                <Eye size={14} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.netWorthAmount, { color: colors.text }]}>
            {settings.is_balance_hidden
              ? `${getCurrencySymbol(selectedAccount?.currency || settings.default_currency)} •••••••`
              : formatCurrency(
                  selectedAccount ? selectedAccount.current_balance : totalNetWorth,
                  selectedAccount?.currency || settings.default_currency
                )}
          </Text>
        </View>

        {/* =========================================================================
            Income & Spent Metrics Pill
            ========================================================================= */}
        <View
          style={[
            styles.metricsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricItem}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.successLight }]}>
              <ArrowDownLeft size={16} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>INCOME</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {settings.is_balance_hidden
                  ? '••••••'
                  : `+${formatCurrency(totalIncome, settings.default_currency)}`}
              </Text>
            </View>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metricItem}>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.dangerLight }]}>
              <ArrowUpRight size={16} color={colors.danger} />
            </View>
            <View>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>SPENT</Text>
              <Text style={[styles.metricValue, { color: colors.danger }]}>
                {settings.is_balance_hidden
                  ? '••••••'
                  : `-${formatCurrency(totalSpent, settings.default_currency)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
            Wallets & Accounts (Apple Wallet Stacked Cards Interface)
            ========================================================================= */}
        <AppleWalletCardStack
          accounts={userAccounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
          onManageAccounts={handleNavigateAccounts}
          onAddAccount={handleNavigateAccounts}
        />

        {/* =========================================================================
            Debts & IOUs Quick Access Card
            ========================================================================= */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('light');
            handleNavigateDebts();
          }}
          style={[
            styles.debtsBannerCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.debtsBannerLeft}>
            <View style={[styles.debtsIconWrap, { backgroundColor: colors.accentLight }]}>
              <Coins size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.debtsBannerTitle, { color: colors.text }]}>Debts & IOUs</Text>
              <Text style={[styles.debtsBannerSubtitle, { color: colors.textMuted }]}>
                {activeDebts.length > 0
                  ? `${activeDebts.length} active records`
                  : 'Track money borrowed & lent'}
              </Text>
            </View>
          </View>

          <View style={styles.debtsBannerRight}>
            {activeDebts.length > 0 ? (
              <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
                {activeLent > 0 && (
                  <Text style={[styles.debtsBadgeLent, { color: '#059669' }]}>
                    +{formatCurrency(activeLent, settings.default_currency)} (Lent)
                  </Text>
                )}
                {activeBorrowed > 0 && (
                  <Text style={[styles.debtsBadgeBorrowed, { color: '#D97706' }]}>
                    -{formatCurrency(activeBorrowed, settings.default_currency)} (Owe)
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.seeAllText, { color: colors.accent, marginRight: 4 }]}>
                View
              </Text>
            )}
            <ArrowRight size={14} color={colors.accent} />
          </View>
        </TouchableOpacity>

        {/* =========================================================================
            Spending Report (Budget Pace)
            ========================================================================= */}
        {activeBudget && (
          <View style={styles.budgetSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Report</Text>
              <TouchableOpacity
                onPress={handleNavigateBudgets}
                style={styles.seeAllBtn}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>View Report</Text>
                <ArrowRight size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <BudgetProgressCard
              budget={activeBudget}
              transactions={filteredTransactions}
              onPressEdit={handleOpenMonthlyCap}
            />
          </View>
        )}

        {/* =========================================================================
            Recent Movements
            ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Movements</Text>
          <TouchableOpacity
            onPress={handleNavigateTransactions}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.accent }]}>
              Ledger ({transactions.length})
            </Text>
            <ArrowRight size={13} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {filteredTransactions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No recorded movements for this wallet.
            </Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              category={categoryMap.get(tx.category_id || '')}
              account={accountMap.get(tx.account_id)}
              onDelete={handleDeleteTransaction}
              onPress={handleEditTransaction}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenAddModal}
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            bottom: Math.max(insets.bottom, 16) + 100,
          },
        ]}
      >
        <Plus size={26} color={colors.onAccent} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Unified Add / Edit Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen || Boolean(editingTransaction)}
        initialTransaction={editingTransaction}
        onClose={handleCloseAddModal}
      />

      {/* Edit Overall Monthly Spending Cap Modal */}
      <EditMonthlyCapModal
        visible={isEditMonthlyCapOpen}
        budget={activeBudget || null}
        onClose={handleCloseMonthlyCap}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  topHeader: {
    marginBottom: 16,
  },
  netWorthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eyeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netWorthLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  netWorthAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  metricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    width: 1,
    height: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  budgetSection: {
    marginBottom: 8,
  },
  emptyState: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
  debtsBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  debtsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  debtsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtsBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  debtsBannerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  debtsBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  debtsBadgeLent: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  debtsBadgeBorrowed: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
