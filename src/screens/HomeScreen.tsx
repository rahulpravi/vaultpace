import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency } from '../store/useStore';
import { AccountCard } from '../components/domain/AccountCard';
import { TransactionRow } from '../components/domain/TransactionRow';
import { BudgetProgressCard } from '../components/domain/BudgetProgressCard';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';

export const HomeScreen: React.FC<BottomTabProps<'HomeTab'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    accounts,
    categories,
    budgets,
    transactions,
    getTotalNetWorthCents,
    deleteTransaction,
  } = useStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const totalNetWorth = getTotalNetWorthCents();

  // Filter transactions by selected account
  const filteredTransactions = selectedAccountId
    ? transactions.filter(
        (t) => t.account_id === selectedAccountId || t.to_account_id === selectedAccountId
      )
    : transactions;

  // Monthly income and expense calculations
  const monthlyExpense = filteredTransactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyIncome = filteredTransactions
    .filter((t) => t.transaction_type === 'income')
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
            paddingBottom: insets.bottom + 90,
          },
        ]}
      >
        {/* =========================================================================
            Top Header & Privacy Badge
            ========================================================================= */}
        <View style={styles.topHeader}>
          <View>
            <View style={styles.privacyRow}>
              <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>
                TOTAL NET WORTH
              </Text>
              <View style={[styles.privacyBadge, { backgroundColor: colors.accentLight }]}>
                <ShieldCheck size={12} color={colors.accent} />
                <Text style={[styles.privacyBadgeText, { color: colors.accent }]}>
                  Local & Private
                </Text>
              </View>
            </View>

            <Text style={[styles.netWorthAmount, { color: colors.text }]}>
              {formatCurrency(totalNetWorth)}
            </Text>
          </View>
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
                +{formatCurrency(monthlyIncome)}
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
                -{formatCurrency(monthlyExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
            Financial Pools (Accounts Horizontal Carousel)
            ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Pools</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountsTab')}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.accent }]}>Manage</Text>
            <ArrowRight size={13} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poolsScroll}>
          {/* 'All' Pool Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedAccountId(null);
            }}
            style={[
              styles.allPoolCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedAccountId === null ? colors.accent : colors.border,
                borderWidth: selectedAccountId === null ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.allPoolIcon, { backgroundColor: colors.accentLight }]}>
              <TrendingUp size={18} color={colors.accent} />
            </View>
            <Text style={[styles.allPoolTitle, { color: colors.text }]}>Consolidated</Text>
            <Text style={[styles.allPoolSubtitle, { color: colors.textMuted }]}>
              All Accounts ({accounts.length})
            </Text>
          </TouchableOpacity>

          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={selectedAccountId === acc.id}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id);
              }}
            />
          ))}
        </ScrollView>

        {/* =========================================================================
            Active Budget Pace
            ========================================================================= */}
        {activeBudget && (
          <View style={styles.budgetSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Budget Pace</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('BudgetsTab')}
                style={styles.seeAllBtn}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>View All</Text>
                <ArrowRight size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <BudgetProgressCard budget={activeBudget} transactions={filteredTransactions} />
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
              No recorded movements for this pool.
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
            bottom: insets.bottom + 65,
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
  topHeader: {
    marginBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
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
  poolsScroll: {
    flexDirection: 'row',
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  allPoolCard: {
    width: 140,
    padding: 16,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 145,
  },
  allPoolIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allPoolTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  allPoolSubtitle: {
    fontSize: 11,
    fontWeight: '500',
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
});
