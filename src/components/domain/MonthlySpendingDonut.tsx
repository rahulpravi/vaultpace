import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useAppTheme } from '../../theme/useTheme';
import { Budget, Transaction, Category } from '../../types';
import { sortCategoriesWithOtherLast, isOtherCategory } from '../../store/useStore';
import { getCategoryIconComponent } from '../../utils/categoryIcons';
import { triggerHaptic } from '../../utils/haptics';
import { showAlert } from '../../store/useAlertStore';
import {
  Pencil,
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

/**
 * Format currency amount in standard Indian numbering format (en-IN).
 * e.g. 241000 cents -> ₹2,410 | 2500000 cents -> ₹25,000
 */
export function formatINR(cents: number): string {
  const rupees = Math.round(cents / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

/**
 * Format a YYYY-MM string to Month Year (e.g. '2026-10' -> 'October 2026')
 */
export function formatMonthYear(monthStr: string): string {
  try {
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

interface DonutSliceItem {
  category: Category;
  spent: number;
  count: number;
  ratio: number; // 0 to 1
  percentageOfTotal: number; // 0 to 100
  startAngle: number;
  endAngle: number;
  midAngle: number;
  pathData: string;
  badgeX: number;
  badgeY: number;
  showBadge: boolean;
}

export interface MonthlySpendingDonutProps {
  budget?: Budget;
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string; // e.g. '2026-10'
  onMonthChange?: (nextMonth: string) => void;
  onPressEditBudget?: () => void;
  currencySymbol?: string;
  isPrivacyMode?: boolean;
}

// Fixed dimensions for SVG canvas to guarantee crisp pixel rendering
const CHART_SIZE = 280;
const CENTER_X = CHART_SIZE / 2; // 140
const CENTER_Y = CHART_SIZE / 2; // 140
const RING_RADIUS = 88;
const STROKE_WIDTH = 22;
const BASE_BADGE_RADIUS = 118;
const BADGE_SIZE = 32;

export const MonthlySpendingDonut: React.FC<MonthlySpendingDonutProps> = ({
  budget,
  transactions,
  categories,
  selectedMonth,
  onMonthChange,
  onPressEditBudget,
  currencySymbol = '₹',
  isPrivacyMode = false,
}) => {
  const { colors, isDark } = useAppTheme();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Month navigation handlers
  const handlePrevMonth = useCallback(() => {
    triggerHaptic('selection');
    setSelectedCategoryId(null);
    if (!onMonthChange) return;
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const nextY = prevDate.getFullYear();
    const nextM = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${nextY}-${nextM}`);
  }, [selectedMonth, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    triggerHaptic('selection');
    setSelectedCategoryId(null);
    if (!onMonthChange) return;
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${nextY}-${nextM}`);
  }, [selectedMonth, onMonthChange]);

  // Filter expenses strictly for the selected month
  const monthExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.transaction_type !== 'expense') return false;
      if (t.is_settlement || t.notes?.toLowerCase().startsWith('settled:')) return false;
      return Boolean(t.transaction_date && t.transaction_date.startsWith(selectedMonth));
    });
  }, [transactions, selectedMonth]);

  // Total spent in cents for this month
  const totalSpentCents = useMemo(() => {
    return monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [monthExpenses]);

  // Budget limit in cents
  const budgetLimitCents = budget?.amount_limit || 0;
  const hasBudgetSet = budgetLimitCents > 0;

  // Percentage of total monthly budget spent
  const budgetSpentPercent = useMemo(() => {
    if (!hasBudgetSet) return 100;
    if (totalSpentCents <= 0) return 0;
    return Math.round((totalSpentCents / budgetLimitCents) * 100);
  }, [totalSpentCents, budgetLimitCents, hasBudgetSet]);

  const isOverBudget = hasBudgetSet && totalSpentCents > budgetLimitCents;
  const remainingCents = hasBudgetSet ? budgetLimitCents - totalSpentCents : 0;

  // Category breakdown calculation sorted with "Other" strictly last
  const slices: DonutSliceItem[] = useMemo(() => {
    if (totalSpentCents <= 0) return [];

    const spentMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    for (const t of monthExpenses) {
      if (t.category_id) {
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + t.amount;
        countMap[t.category_id] = (countMap[t.category_id] || 0) + 1;
      }
    }

    // Filter active categories that have positive spending in this month
    const activeCategories = categories.filter((c) => (spentMap[c.id] || 0) > 0);
    // Pin "Other" last across active categories
    const sortedCategories = sortCategoriesWithOtherLast(activeCategories);

    if (sortedCategories.length === 0) return [];

    // Helper: convert angle in degrees (clockwise from 12 o'clock) to Cartesian (x, y)
    const polarToCartesian = (deg: number, radius: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return {
        x: CENTER_X + radius * Math.cos(rad),
        y: CENTER_Y + radius * Math.sin(rad),
      };
    };

    // If only 1 category has spending, it takes the entire 360 ring
    if (sortedCategories.length === 1) {
      const cat = sortedCategories[0];
      const spent = spentMap[cat.id] || 0;
      const count = countMap[cat.id] || 0;
      const badgePos = polarToCartesian(180, BASE_BADGE_RADIUS);

      // Draw almost full circle with rounded ends visible at top
      const p1 = polarToCartesian(2, RING_RADIUS);
      const p2 = polarToCartesian(358, RING_RADIUS);
      const pathData = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;

      return [
        {
          category: cat,
          spent,
          count,
          ratio: 1,
          percentageOfTotal: 100,
          startAngle: 0,
          endAngle: 360,
          midAngle: 180,
          pathData,
          badgeX: badgePos.x,
          badgeY: badgePos.y,
          showBadge: true,
        },
      ];
    }

    // Multiple categories: distribute 360 degrees
    let currentAngle = 0;
    const items: Array<{
      category: Category;
      spent: number;
      count: number;
      ratio: number;
      percentageOfTotal: number;
      startAngle: number;
      endAngle: number;
      midAngle: number;
    }> = [];

    for (let i = 0; i < sortedCategories.length; i++) {
      const cat = sortedCategories[i];
      const spent = spentMap[cat.id] || 0;
      const count = countMap[cat.id] || 0;
      const ratio = spent / totalSpentCents;
      const percentageOfTotal = Math.round(ratio * 100);

      // Allocate angle proportional to ratio
      let sliceAngle = ratio * 360;
      // Guarantee last category covers through exactly 360 to prevent fractional gaps
      if (i === sortedCategories.length - 1) {
        sliceAngle = 360 - currentAngle;
      }

      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;

      items.push({
        category: cat,
        spent,
        count,
        ratio,
        percentageOfTotal,
        startAngle,
        endAngle,
        midAngle,
      });

      currentAngle = endAngle;
    }

    // Build SVG paths and floating badge positions with collision prevention
    return items.map((item, idx) => {
      const span = item.endAngle - item.startAngle;
      // Inset each slice slightly so strokeLinecap="round" doesn't overlap adjacent caps
      const gap = Math.min(4.5, span * 0.18);
      const startAdj = item.startAngle + gap / 2;
      const endAdj = item.endAngle - gap / 2;

      const p1 = polarToCartesian(startAdj, RING_RADIUS);
      const p2 = polarToCartesian(endAdj, RING_RADIUS);
      const largeArcFlag = endAdj - startAdj > 180 ? 1 : 0;
      const pathData = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${RING_RADIUS} ${RING_RADIUS} 0 ${largeArcFlag} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;

      // Collision/overlap prevention:
      // Hide badges for slices below 4% share to avoid badge clustering
      const showBadge = item.percentageOfTotal >= 4;

      // Check distance to next badge; if very close (< 20 deg), stagger radius
      let badgeRadius = BASE_BADGE_RADIUS;
      const nextItem = items[(idx + 1) % items.length];
      if (nextItem && Math.abs(nextItem.midAngle - item.midAngle) < 22) {
        badgeRadius = idx % 2 === 0 ? BASE_BADGE_RADIUS - 4 : BASE_BADGE_RADIUS + 6;
      }

      const badgePos = polarToCartesian(item.midAngle, badgeRadius);

      return {
        ...item,
        pathData,
        badgeX: badgePos.x,
        badgeY: badgePos.y,
        showBadge,
      };
    });
  }, [monthExpenses, categories, totalSpentCents]);

  // Selected category slice entity (if any)
  const selectedSlice = useMemo(() => {
    if (!selectedCategoryId) return null;
    return slices.find((s) => s.category.id === selectedCategoryId) || null;
  }, [slices, selectedCategoryId]);

  // Toggle category selection
  const handleToggleCategory = useCallback(
    (catId: string) => {
      triggerHaptic('selection');
      setSelectedCategoryId((prev) => (prev === catId ? null : catId));
    },
    []
  );

  const handleResetSelection = useCallback(() => {
    if (selectedCategoryId) {
      triggerHaptic('light');
      setSelectedCategoryId(null);
    }
  }, [selectedCategoryId]);

  // Info modal explaining the calculation
  const handleInfoPress = useCallback(() => {
    triggerHaptic('light');
    if (hasBudgetSet) {
      showAlert({
        type: 'info',
        title: 'Monthly Spending Rate',
        message: `You have spent ${budgetSpentPercent}% (${formatINR(
          totalSpentCents
        )}) of your ${formatINR(
          budgetLimitCents
        )} monthly spending cap for ${formatMonthYear(selectedMonth)}.`,
      });
    } else {
      showAlert({
        type: 'info',
        title: 'Spending Distribution',
        message: `Showing 100% categorical distribution for ${formatMonthYear(
          selectedMonth
        )}. Tap "Set monthly budget" to define a spending cap.`,
      });
    }
  }, [hasBudgetSet, budgetSpentPercent, totalSpentCents, budgetLimitCents, selectedMonth]);

  return (
    <View style={styles.container}>
      {/* =========================================================================
          1. Month Selector Pill (Matching Reference Header UX)
          ========================================================================= */}
      <View
        style={[
          styles.monthPill,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.monthArrowBtn}
          accessibilityLabel="Previous month"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={18} color={colors.text} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.monthPillText, { color: colors.text }]}>
          {formatMonthYear(selectedMonth)}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthArrowBtn}
          accessibilityLabel="Next month"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* =========================================================================
          2. Main Analytics Card (Donut Chart + Readout + Summary)
          ========================================================================= */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* SVG Donut Chart Area */}
        <View style={styles.chartWrapper}>
          <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
            {/* Background Base Ring */}
            <Circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={RING_RADIUS}
              stroke={colors.surfaceSubtle}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />

            {/* Category Slices */}
            {slices.map((slice) => {
              const isSelected = selectedCategoryId === slice.category.id;
              const hasSelection = Boolean(selectedCategoryId);
              const sliceOpacity = !hasSelection ? 1 : isSelected ? 1 : 0.32;
              const strokeWidth = isSelected ? STROKE_WIDTH + 3 : STROKE_WIDTH;

              return (
                <Path
                  key={slice.category.id}
                  d={slice.pathData}
                  stroke={slice.category.color || colors.accent}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                  opacity={sliceOpacity}
                  onPress={() => handleToggleCategory(slice.category.id)}
                />
              );
            })}
          </Svg>

          {/* Floating Category Icon Badges Positioned Absolutely Around the Donut */}
          {slices.map((slice) => {
            if (!slice.showBadge) return null;

            const isSelected = selectedCategoryId === slice.category.id;
            const hasSelection = Boolean(selectedCategoryId);
            const badgeOpacity = !hasSelection ? 1 : isSelected ? 1 : 0.45;
            const IconComponent = getCategoryIconComponent(slice.category.icon);

            return (
              <TouchableOpacity
                key={`badge-${slice.category.id}`}
                activeOpacity={0.75}
                onPress={() => handleToggleCategory(slice.category.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={[
                  styles.floatingBadge,
                  {
                    left: slice.badgeX - BADGE_SIZE / 2,
                    top: slice.badgeY - BADGE_SIZE / 2,
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? slice.category.color : colors.border,
                    borderWidth: isSelected ? 2 : 1.2,
                    opacity: badgeOpacity,
                    transform: [{ scale: isSelected ? 1.14 : 1 }],
                  },
                ]}
                accessibilityLabel={`${slice.category.name} category slice`}
              >
                <IconComponent
                  size={15}
                  color={slice.category.color || colors.accent}
                  strokeWidth={2.4}
                />
              </TouchableOpacity>
            );
          })}

          {/* Center Readout (Inside Donut Hole) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleResetSelection}
            style={styles.centerHole}
          >
            {selectedSlice ? (
              // Inspected Category Readout
              <View style={styles.centerContent}>
                <Text
                  style={[
                    styles.centerPercent,
                    { color: selectedSlice.category.color || colors.accent },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSlice.percentageOfTotal}%
                </Text>
                <Text
                  style={[styles.centerCategoryName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {selectedSlice.category.name}
                </Text>
                <Text
                  style={[styles.centerCategorySpent, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {isPrivacyMode ? `${currencySymbol} ••••••` : formatINR(selectedSlice.spent)}
                </Text>
              </View>
            ) : (
              // Default Overall Monthly Budget Readout
              <View style={styles.centerContent}>
                <Text
                  style={[
                    styles.centerPercent,
                    { color: isOverBudget ? colors.danger : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {totalSpentCents <= 0 ? '0%' : `${budgetSpentPercent}%`}
                </Text>

                <View style={styles.centerSubRow}>
                  <Text style={[styles.centerSubtitle, { color: colors.textMuted }]}>
                    budget spent
                  </Text>
                  <TouchableOpacity
                    onPress={handleInfoPress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.infoIconBtn}
                  >
                    <Info size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Budget Summary & Pencil Edit Button */}
        <View style={styles.summarySection}>
          <Text style={[styles.totalAmountText, { color: colors.text }]}>
            {isPrivacyMode ? `${currencySymbol} ••••••` : formatINR(totalSpentCents)}
          </Text>

          {hasBudgetSet ? (
            <View style={styles.budgetLimitRow}>
              <Text style={[styles.budgetLimitText, { color: colors.textMuted }]}>
                of{' '}
                {isPrivacyMode ? `${currencySymbol} ••••••` : formatINR(budgetLimitCents)} total
                budget
              </Text>
              {onPressEditBudget && (
                <TouchableOpacity
                  onPress={onPressEditBudget}
                  style={[
                    styles.pencilBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                  accessibilityLabel="Edit monthly budget cap"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Pencil size={11} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={onPressEditBudget}
              style={[styles.setBudgetBtn, { backgroundColor: colors.accentLight }]}
            >
              <Text style={[styles.setBudgetText, { color: colors.accent }]}>
                Set monthly budget
              </Text>
            </TouchableOpacity>
          )}

          {/* Interactive Hint */}
          <Text style={[styles.hintText, { color: colors.textSubtle }]}>
            {selectedSlice
              ? 'Tap center or active icon to reset overview'
              : 'Tap any slice or icon to inspect category'}
          </Text>
        </View>
      </View>

      {/* =========================================================================
          3. Two Summary Stat Cards (Spent & Remaining in 2 Columns)
          ========================================================================= */}
      <View style={styles.statCardsRow}>
        {/* Left Stat Card: Spent */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statCardHeader}>
            <View
              style={[
                styles.statDot,
                { backgroundColor: isDark ? '#94A3B8' : '#1E293B' },
              ]}
            />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Spent</Text>
          </View>

          <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
            {isPrivacyMode ? `${currencySymbol} ••••••` : formatINR(totalSpentCents)}
          </Text>
        </View>

        {/* Right Stat Card: Remaining / Over Budget */}
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statCardHeader}>
            <View
              style={[
                styles.statDot,
                { backgroundColor: isOverBudget ? colors.danger : colors.success },
              ]}
            />
            <Text
              style={[
                styles.statLabel,
                { color: isOverBudget ? colors.danger : colors.textMuted },
              ]}
            >
              {isOverBudget ? 'Over Budget' : 'Remaining'}
            </Text>
          </View>

          <Text
            style={[
              styles.statValue,
              { color: isOverBudget ? colors.danger : colors.success },
            ]}
            numberOfLines={1}
          >
            {isPrivacyMode
              ? `${currencySymbol} ••••••`
              : isOverBudget
              ? `-${formatINR(Math.abs(remainingCents))}`
              : formatINR(remainingCents)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  // Month selector pill
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    width: '78%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  monthArrowBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPillText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Main container card
  mainCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // Donut chart wrapper
  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating icon badges
  floatingBadge: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },

  // Center hole inside donut
  centerHole: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  centerPercent: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  centerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoIconBtn: {
    padding: 2,
  },
  centerCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  centerCategorySpent: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Bottom summary under chart
  summarySection: {
    alignItems: 'center',
    marginTop: 10,
  },
  totalAmountText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  budgetLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  budgetLimitText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pencilBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBudgetBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  setBudgetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },

  // Stat cards bottom row
  statCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
