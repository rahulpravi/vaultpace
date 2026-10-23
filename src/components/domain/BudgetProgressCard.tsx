import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { Budget, Transaction } from '../../types';
import { formatCurrency } from '../../store/useStore';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';

interface BudgetProgressCardProps {
  budget: Budget;
  transactions: Transaction[];
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  budget,
  transactions,
}) => {
  const { colors } = useAppTheme();

  // Filter transactions for this budget (expenses only)
  const spentCents = transactions
    .filter((t) => {
      if (t.transaction_type !== 'expense') return false;
      if (budget.category_ids && budget.category_ids.length > 0) {
        return t.category_id && budget.category_ids.includes(t.category_id);
      }
      return true;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const ratio = Math.min(spentCents / budget.amount_limit, 1);
  const percentage = Math.round((spentCents / budget.amount_limit) * 100);
  const isOver = spentCents > budget.amount_limit;
  const isNear = percentage >= (budget.notify_threshold || 0.8) * 100;

  const barColor = isOver ? colors.danger : isNear ? colors.warning : colors.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.budgetName, { color: colors.text }]}>{budget.name}</Text>
          <Text style={[styles.budgetPeriod, { color: colors.textMuted }]}>
            {budget.period_type.toUpperCase()} CAP
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOver
                ? colors.dangerLight
                : isNear
                ? colors.warningLight
                : colors.accentLight,
            },
          ]}
        >
          {isOver || isNear ? (
            <AlertTriangle size={12} color={barColor} />
          ) : (
            <CheckCircle size={12} color={barColor} />
          )}
          <Text style={[styles.badgeText, { color: barColor }]}>
            {isOver ? 'Exceeded' : isNear ? 'Warning' : 'On Track'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.barBg, { backgroundColor: colors.surfaceSubtle }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.spentText, { color: colors.text }]}>
          {formatCurrency(spentCents)}{' '}
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }}>
            / {formatCurrency(budget.amount_limit)}
          </Text>
        </Text>

        <Text style={[styles.percentText, { color: barColor }]}>{percentage}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  budgetPeriod: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
