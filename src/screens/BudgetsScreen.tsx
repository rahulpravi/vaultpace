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
import { BudgetProgressCard } from '../components/domain/BudgetProgressCard';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import { Target, Plus, AlertCircle } from 'lucide-react-native';

export const BudgetsScreen: React.FC<BottomTabProps<'BudgetsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { budgets, categories, transactions } = useStore();

  // Category allowance limits matching the original app schema
  const categoryLimits: Record<string, number> = {
    'cat-1': 25000, // Groceries $250.00
    'cat-2': 3000,  // Dining $30.00
    'cat-3': 12500, // Shopping $125.00
    'cat-4': 5000,  // Transit $50.00
    'cat-5': 6000,  // Entertainment $60.00
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Spending Budgets</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Monitor thresholds and pace limits
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Main Budget Progress Cards */}
        {budgets.map((b) => (
          <BudgetProgressCard key={b.id} budget={b} transactions={transactions} />
        ))}

        {/* Category Allowances */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Target size={16} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Allowances
            </Text>
          </View>
          <Text style={[styles.cycleText, { color: colors.textMuted }]}>Current Cycle</Text>
        </View>

        <View style={styles.categoryList}>
          {categories
            .filter((c) => c.category_type === 'expense')
            .map((cat) => {
              const catTx = transactions.filter((t) => t.category_id === cat.id);
              const spent = catTx.reduce((acc, t) => acc + t.amount, 0);
              const limit = categoryLimits[cat.id] || 10000;
              const percentage = Math.round((spent / limit) * 100);
              const isOver = spent > limit;
              const barColor = isOver ? colors.danger : colors.accent;

              return (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catColorDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                    </View>

                    <Text style={[styles.catLimit, { color: colors.text }]}>
                      {formatCurrency(spent)}{' '}
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        / {formatCurrency(limit)}
                      </Text>
                    </Text>
                  </View>

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

                  <View style={styles.cardBottom}>
                    <Text style={[styles.txCount, { color: colors.textMuted }]}>
                      {catTx.length} movements
                    </Text>
                    <Text
                      style={[
                        styles.pctText,
                        { color: isOver ? colors.danger : colors.accent },
                      ]}
                    >
                      {percentage}%
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cycleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryList: {
    gap: 10,
  },
  categoryCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
  },
  catLimit: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  pctText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
