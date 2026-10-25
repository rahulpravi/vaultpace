import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency, parseAmountToCents } from '../store/useStore';
import { BudgetProgressCard } from '../components/domain/BudgetProgressCard';
import { PinVerificationModal } from '../components/security/PinVerificationModal';
import { exportTransactionsToPdf } from '../utils/exportPdf';
import { BottomTabProps } from '../navigation/types';
import { Category } from '../types';
import * as Haptics from 'expo-haptics';
import { Target, Pencil, X, Check, BarChart3, TrendingUp, AlertTriangle, FileDown } from 'lucide-react-native';

export const BudgetsScreen: React.FC<BottomTabProps<'BudgetsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    budgets,
    categories,
    transactions,
    accounts,
    settings,
    categoryLimits,
    setCategoryLimit,
    getTotalNetWorthCents,
  } = useStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newLimitStr, setNewLimitStr] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const currencySymbol =
    settings.default_currency === 'INR' || settings.default_currency === 'IND'
      ? '₹'
      : settings.default_currency === 'USD'
      ? '$'
      : settings.default_currency === 'EUR'
      ? '€'
      : settings.default_currency === 'GBP'
      ? '£'
      : settings.default_currency;

  const handleOpenEdit = (cat: Category, currentLimitCents: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory(cat);
    const standardAmount = (currentLimitCents / 100).toFixed(0);
    setNewLimitStr(standardAmount === '0' ? '' : standardAmount);
  };

  const handleSaveLimit = () => {
    if (!editingCategory) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cents = parseAmountToCents(newLimitStr);
    setCategoryLimit(editingCategory.id, cents);
    setEditingCategory(null);
    setNewLimitStr('');
  };

  const addQuickIncrement = (additionalRupees: number) => {
    Haptics.selectionAsync();
    const currentVal = parseFloat(newLimitStr) || 0;
    setNewLimitStr((currentVal + additionalRupees).toString());
  };

  const handleExportReportPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPinModalOpen(true);
  };

  const handlePinExportSuccess = async () => {
    try {
      setIsExportingPdf(true);
      await exportTransactionsToPdf({
        accounts,
        categories,
        budgets,
        transactions,
        settings,
        totalNetWorth: getTotalNetWorthCents(),
      });
    } catch {
      Alert.alert('Export Error', 'Unable to generate spending report PDF.');
    } finally {
      setIsExportingPdf(false);
    }
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
        <View style={styles.headerLeft}>
          <View style={[styles.reportIconBox, { backgroundColor: colors.accentLight }]}>
            <BarChart3 size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Spending Report</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              Category allowances & limit analytics
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleExportReportPress}
          disabled={isExportingPdf}
          style={[
            styles.exportBtn,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <FileDown size={15} color={colors.accent} />
          <Text style={[styles.exportBtnText, { color: colors.text }]}>
            {isExportingPdf ? 'Exporting...' : 'PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Main Spending Progress Cards */}
        {budgets.map((b) => (
          <BudgetProgressCard key={b.id} budget={b} transactions={transactions} />
        ))}

        {/* Category Allowances Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.titleWithIcon}>
            <Target size={16} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Allowances
            </Text>
          </View>
          <Text style={[styles.cycleText, { color: colors.textMuted }]}>Monthly Caps</Text>
        </View>

        {/* Category Cards with Dynamic Limit Editing */}
        <View style={styles.categoryList}>
          {categories
            .filter((c) => c.category_type === 'expense')
            .map((cat) => {
              const catTx = transactions.filter((t) => t.category_id === cat.id);
              const spent = catTx.reduce((acc, t) => acc + t.amount, 0);
              const limit =
                categoryLimits?.[cat.id] !== undefined
                  ? categoryLimits[cat.id]
                  : 500000; // fallback ₹5,000
              const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              const isOver = limit > 0 && spent > limit;
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

                    <View style={styles.catRightActions}>
                      <Text style={[styles.catLimit, { color: colors.text }]}>
                        {formatCurrency(spent, settings.default_currency)}{' '}
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                          / {limit > 0 ? formatCurrency(limit, settings.default_currency) : 'No Cap'}
                        </Text>
                      </Text>

                      {/* Edit Limit Button */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenEdit(cat, limit)}
                        style={[
                          styles.editLimitBtn,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Pencil size={12} color={colors.accent} />
                        <Text style={[styles.editLimitBtnText, { color: colors.accent }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.barBg, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${limit > 0 ? Math.min(percentage, 100) : 0}%`,
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
                      {limit > 0 ? `${percentage}%` : 'Uncapped'}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Edit Category Limit Modal */}
      <Modal
        visible={editingCategory !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <View
                  style={[
                    styles.catColorDotLarge,
                    { backgroundColor: editingCategory?.color || colors.accent },
                  ]}
                />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingCategory?.name} Limit
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setEditingCategory(null)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Instruction */}
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Adjust monthly spending ceiling for {editingCategory?.name}. VaultPace will track and
              warn you as you approach this cap.
            </Text>

            {/* Amount Input with Currency Prefix */}
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: colors.accent }]}>
                {currencySymbol}
              </Text>
              <TextInput
                value={newLimitStr}
                onChangeText={setNewLimitStr}
                placeholder="0"
                placeholderTextColor={colors.textMuted + '80'}
                keyboardType="numeric"
                style={[styles.limitInput, { color: colors.text }]}
                autoFocus
              />
            </View>

            {/* Quick Adjustment Chips */}
            <Text style={[styles.chipLabel, { color: colors.textMuted }]}>Quick Increments</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => addQuickIncrement(1000)}
                style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.quickChipText, { color: colors.text }]}>+1,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => addQuickIncrement(5000)}
                style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.quickChipText, { color: colors.text }]}>+5,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => addQuickIncrement(10000)}
                style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.quickChipText, { color: colors.text }]}>+10,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewLimitStr('0')}
                style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.quickChipText, { color: colors.danger }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setEditingCategory(null)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveLimit}
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              >
                <Check size={16} color={colors.onAccent} strokeWidth={2.5} />
                <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
                  Save Limit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reusable PIN Verification Modal for PDF Export */}
      <PinVerificationModal
        visible={isPinModalOpen}
        title="Export Spending Report"
        subtitle="Enter your 4-digit PIN to authorize and generate your spending statement PDF."
        actionType="primary"
        onSuccess={handlePinExportSuccess}
        onClose={() => setIsPinModalOpen(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cycleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '700',
  },
  catRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catLimit: {
    fontSize: 13,
    fontWeight: '700',
  },
  editLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  editLimitBtnText: {
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
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catColorDotLarge: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
  },
  limitInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
