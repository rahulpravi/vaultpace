import React, { useState } from 'react';
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
import { useStore, formatCurrency } from '../store/useStore';
import { AppleWalletCardStack } from '../components/domain/AppleWalletCardStack';
import { TransactionRow } from '../components/domain/TransactionRow';
import { BudgetProgressCard } from '../components/domain/BudgetProgressCard';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { EditMonthlyCapModal } from '../components/domain/EditMonthlyCapModal';
import { BottomTabProps } from '../navigation/types';
import { Transaction } from '../types';
import * as Haptics from 'expo-haptics';
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
  const {
    accounts,
    categories,
    budgets,
    transactions,
    settings,
    getTotalNetWorthCents,
    deleteTransaction,
    toggleHideBalance,
  } = useStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMonthlyCapOpen, setIsEditMonthlyCapOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const totalNetWorth = getTotalNetWorthCents();

  // Filter transactions by selected account
  const filteredTransactions = selectedAccountId
    ? transactions.filter(
        (t) => t.account_id === selectedAccountId || t.to_account_id === selectedAccountId
      )
    : transactions;

  // Guarantee only user accounts (Cash Wallet, Bank Account, Savings Vault, etc.) are rendered
  const userAccounts = accounts.filter(
    (acc) =>
      acc &&
      acc.name?.toLowerCase() !== 'consolidated' &&
      acc.name?.toLowerCase() !== 'all' &&
      acc.id !== 'consolidated' &&
      acc.id !== 'all'
  );

  const selectedAccount = selectedAccountId
    ? userAccounts.find((a) => a.id === selectedAccountId)
    : null;

  // Active Debts
  const activeDebts = transactions.filter(
    (t) => (t.transaction_type === 'borrow' || t.transaction_type === 'lend') && !t.is_settled
  );
  const activeLent = activeDebts
    .filter((t) => t.transaction_type === 'lend')
    .reduce((acc, t) => acc + t.amount, 0);
  const activeBorrowed = activeDebts
    .filter((t) => t.transaction_type === 'borrow')
    .reduce((acc, t) => acc + t.amount, 0);

  // =========================================================================
  // Standard Income & Expense Calculations (Dashboard Accuracy)
  //
  // Strict Rules Applied:
  // 1. Exclude from Income: "Borrow" transactions increase the wallet balance
  //    (liabilities), but MUST NOT be added to Total Income or Monthly Income statistics.
  // 2. Exclude from Expense: "Lend" transactions decrease the wallet balance
  //    (receivables), but MUST NOT be added to Total Spent or Monthly Expense statistics.
  // 3. Only standard "Income" and "Expense" types affect the Home screen Income/Spent cards.
  //    Borrow/Lend exclusively affect the specific wallet balance and the separate Debts/IOUs ledger.
  // =========================================================================
  const isStandardIncome = (t: (typeof transactions)[0]) =>
    t.transaction_type === 'income' &&
    !t.is_settlement &&
    !t.notes?.toLowerCase().startsWith('settled:');

  const isStandardExpense = (t: (typeof transactions)[0]) =>
    t.transaction_type === 'expense' &&
    !t.is_settlement &&
    !t.notes?.toLowerCase().startsWith('settled:');

  // Total Income & Total Spent (all-time standard transactions for active view/wallet)
  const totalIncome = filteredTransactions
    .filter(isStandardIncome)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpent = filteredTransactions
    .filter(isStandardExpense)
    .reduce((acc, t) => acc + t.amount, 0);

  // Monthly Income & Monthly Expense (current calendar month standard transactions)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyIncome = filteredTransactions
    .filter((t) => isStandardIncome(t) && t.transaction_date?.startsWith(currentMonthPrefix))
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = filteredTransactions
    .filter((t) => isStandardExpense(t) && t.transaction_date?.startsWith(currentMonthPrefix))
    .reduce((acc, t) => acc + t.amount, 0);

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
            paddingBottom: insets.bottom + 110,
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleHideBalance();
              }}
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
              ? '₹ •••••••'
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
          onSelectAccount={(accId) => setSelectedAccountId(accId)}
          onManageAccounts={() => navigation.navigate('AccountsTab')}
          onAddAccount={() => navigation.navigate('AccountsTab')}
        />

        {/* =========================================================================
            Debts & IOUs Quick Access Card
            ========================================================================= */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Debts' as any);
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
                onPress={() => navigation.navigate('BudgetsTab')}
                style={styles.seeAllBtn}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>View Report</Text>
                <ArrowRight size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <BudgetProgressCard
              budget={activeBudget}
              transactions={filteredTransactions}
              onPressEdit={() => setIsEditMonthlyCapOpen(true)}
            />
          </View>
        )}

        {/* =========================================================================
            Recent Movements
            ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Movements</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionsTab')}
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
          filteredTransactions
            .slice(0, 5)
            .map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                category={categories.find((c) => c.id === tx.category_id)}
                account={accounts.find((a) => a.id === tx.account_id)}
                onDelete={deleteTransaction}
                onPress={(item) => setEditingTransaction(item)}
              />
            ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAddModalOpen(true);
        }}
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            bottom: insets.bottom + 98,
          },
        ]}
      >
        <Plus size={26} color={colors.onAccent} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        visible={Boolean(editingTransaction)}
        initialTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Edit Overall Monthly Spending Cap Modal */}
      <EditMonthlyCapModal
        visible={isEditMonthlyCapOpen}
        budget={activeBudget || null}
        onClose={() => setIsEditMonthlyCapOpen(false)}
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
