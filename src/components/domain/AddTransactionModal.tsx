import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { useStore, parseAmountToCents } from '../../store/useStore';
import { TransactionType } from '../../types';
import * as Haptics from 'expo-haptics';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  User,
  Calendar,
  Clock,
  Coins,
} from 'lucide-react-native';
import {
  CustomAmountKeypad,
  AmountDisplay,
} from '../common/CustomAmountKeypad';

interface AddTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  initialType = 'expense',
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { accounts, categories, addTransaction, settings } = useStore();

  // Guarantee only legitimate user accounts are selected/rendered
  const userAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a &&
          a.name?.toLowerCase() !== 'consolidated' &&
          a.name?.toLowerCase() !== 'all' &&
          a.id !== 'consolidated' &&
          a.id !== 'all'
      ),
    [accounts]
  );

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(userAccounts[0]?.id || '');
  const [selectedToAccountId, setSelectedToAccountId] = useState(
    userAccounts[1]?.id || userAccounts[0]?.id || ''
  );

  const getDefaultCategoryIdForType = (targetType: TransactionType): string => {
    if (targetType === 'transfer' || targetType === 'borrow' || targetType === 'lend') {
      return '';
    }
    const cats = categories.filter((c) => c.category_type === targetType);
    const otherCat = cats.find((c) => c.name.toLowerCase() === 'other');
    return (otherCat || cats[0])?.id || (targetType === 'income' ? 'cat-income-other' : 'cat-expense-other');
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() =>
    getDefaultCategoryIdForType(initialType)
  );
  const [contactName, setContactName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Controls whether the in-app custom keypad is active vs native system keyboard for text fields
  const [isAmountFocused, setIsAmountFocused] = useState(true);

  // Synchronize initialType and category selection when modal opens
  useEffect(() => {
    if (visible) {
      const activeType = initialType || 'expense';
      setType(activeType);
      setIsAmountFocused(true);
      Keyboard.dismiss();
      setSelectedCategoryId(getDefaultCategoryIdForType(activeType));
    }
  }, [visible, initialType]);

  // Synchronize default accounts if userAccounts change
  useEffect(() => {
    if (userAccounts.length > 0) {
      if (!userAccounts.some((a) => a.id === selectedAccountId)) {
        setSelectedAccountId(userAccounts[0].id);
      }
      if (!userAccounts.some((a) => a.id === selectedToAccountId)) {
        setSelectedToAccountId(userAccounts[1]?.id || userAccounts[0].id);
      }
    }
  }, [userAccounts, selectedAccountId, selectedToAccountId]);

  // Listen to keyboard visibility so custom keypad disappears when typing text and returns cleanly
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsAmountFocused(false);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsAmountFocused(true);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleAmountPress = () => {
    Keyboard.dismiss();
    setIsAmountFocused(true);
  };

  const selectedAccount = userAccounts.find((a) => a.id === selectedAccountId);
  const activeCurrency = selectedAccount?.currency || settings?.default_currency || 'INR';
  const currencySymbol =
    activeCurrency === 'INR' || activeCurrency === 'IND'
      ? '₹'
      : activeCurrency === 'USD'
      ? '$'
      : activeCurrency === 'EUR'
      ? '€'
      : activeCurrency === 'GBP'
      ? '£'
      : activeCurrency === 'JPY'
      ? '¥'
      : activeCurrency;

  const filteredCategories = useMemo(() => {
    let cats = categories.filter((c) =>
      type === 'income' ? c.category_type === 'income' : c.category_type === 'expense'
    );
    const hasOther = cats.some((c) => c.name.toLowerCase() === 'other');
    if (!hasOther) {
      const fallbackOther = {
        id: type === 'income' ? 'cat-income-other' : 'cat-expense-other',
        name: 'Other',
        category_type: type === 'income' ? 'income' : 'expense',
        color: '#64748b',
        icon: 'more-horizontal',
        is_default: true,
        sort_order: 999,
      } as const;
      cats = [...cats, fallbackOther];
    }
    return cats;
  }, [categories, type]);

  // Ensure selectedCategoryId always belongs to the active transaction type
  useEffect(() => {
    if (!visible) return;
    if (type === 'transfer' || type === 'borrow' || type === 'lend') {
      if (selectedCategoryId) {
        setSelectedCategoryId('');
      }
      return;
    }
    const isMatchingType = filteredCategories.some((c) => c.id === selectedCategoryId);
    if (!isMatchingType) {
      setSelectedCategoryId(getDefaultCategoryIdForType(type));
    }
  }, [type, visible, filteredCategories, selectedCategoryId]);

  const handleTypeChange = (newType: TransactionType) => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setType(newType);
    setIsAmountFocused(true);
    setError(null);
    setSelectedCategoryId(getDefaultCategoryIdForType(newType));
  };

  const setQuickDueDate = (days: number) => {
    Haptics.selectionAsync();
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const resetForm = () => {
    setAmountStr('');
    setNotes('');
    setContactName('');
    setDueDate('');
    setError(null);
    setType('expense');
    setSelectedCategoryId(getDefaultCategoryIdForType('expense'));
    setIsAmountFocused(true);
    Keyboard.dismiss();
  };

  const handleSave = () => {
    const cents = parseAmountToCents(amountStr);
    if (cents <= 0) {
      setError('Please enter a valid amount greater than 0.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer' && selectedAccountId === selectedToAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    if ((type === 'borrow' || type === 'lend') && !contactName.trim()) {
      setError(
        `Please enter the person's name ${type === 'borrow' ? 'you borrowed from' : 'you lent to'}.`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Defensive check: strictly match category to type, default to "Other"
    let finalCategoryId: string | undefined = undefined;
    if (type === 'expense' || type === 'income') {
      const matched = filteredCategories.find((c) => c.id === selectedCategoryId);
      if (matched) {
        finalCategoryId = matched.id;
      } else {
        const defaultCat =
          filteredCategories.find((c) => c.name.toLowerCase() === 'other') ||
          filteredCategories[0];
        finalCategoryId = defaultCat?.id;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    addTransaction({
      account_id: selectedAccountId,
      category_id: finalCategoryId,
      amount: cents,
      transaction_type: type,
      transaction_date: today,
      transaction_time: timeStr,
      notes: notes.trim() || undefined,
      to_account_id: type === 'transfer' ? selectedToAccountId : undefined,
      contact_name:
        type === 'borrow' || type === 'lend' ? contactName.trim() : undefined,
      due_date:
        (type === 'borrow' || type === 'lend') && dueDate.trim()
          ? dueDate.trim()
          : undefined,
      is_settled: type === 'borrow' || type === 'lend' ? false : undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onClose();
  };

  const isDebtType = type === 'borrow' || type === 'lend';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.overlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Records</Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            {/* 5-Option Segmented Control */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.segmentScroll}
              style={[styles.segmentContainer, { backgroundColor: colors.surfaceSubtle }]}
            >
              {/* Expense */}
              <TouchableOpacity
                onPress={() => handleTypeChange('expense')}
                style={[
                  styles.segmentBtn,
                  type === 'expense' && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
              >
                <ArrowDownLeft
                  size={14}
                  color={type === 'expense' ? colors.danger : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: type === 'expense' ? colors.text : colors.textMuted },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              {/* Income */}
              <TouchableOpacity
                onPress={() => handleTypeChange('income')}
                style={[
                  styles.segmentBtn,
                  type === 'income' && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
              >
                <ArrowUpRight
                  size={14}
                  color={type === 'income' ? colors.success : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: type === 'income' ? colors.text : colors.textMuted },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>

              {/* Transfer */}
              <TouchableOpacity
                onPress={() => handleTypeChange('transfer')}
                style={[
                  styles.segmentBtn,
                  type === 'transfer' && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
              >
                <ArrowLeftRight
                  size={14}
                  color={type === 'transfer' ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: type === 'transfer' ? colors.text : colors.textMuted },
                  ]}
                >
                  Transfer
                </Text>
              </TouchableOpacity>

              {/* Borrow */}
              <TouchableOpacity
                onPress={() => handleTypeChange('borrow')}
                style={[
                  styles.segmentBtn,
                  type === 'borrow' && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
              >
                <Coins
                  size={14}
                  color={type === 'borrow' ? '#D97706' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: type === 'borrow' ? colors.text : colors.textMuted },
                  ]}
                >
                  Borrow
                </Text>
              </TouchableOpacity>

              {/* Lend */}
              <TouchableOpacity
                onPress={() => handleTypeChange('lend')}
                style={[
                  styles.segmentBtn,
                  type === 'lend' && [styles.segmentActive, { backgroundColor: colors.surface }],
                ]}
              >
                <ArrowUpRight
                  size={14}
                  color={type === 'lend' ? '#059669' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: type === 'lend' ? colors.text : colors.textMuted },
                  ]}
                >
                  Lend
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Debt Banner Explainer */}
            {type === 'borrow' && (
              <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Coins size={16} color="#D97706" />
                <Text style={[styles.infoBannerText, { color: '#92400E' }]}>
                  Borrowing increases your wallet balance today. You owe this back as a liability.
                </Text>
              </View>
            )}

            {type === 'lend' && (
              <View style={[styles.infoBanner, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                <Coins size={16} color="#059669" />
                <Text style={[styles.infoBannerText, { color: '#065F46' }]}>
                  Lending gives money away today. Tracked as an asset to be collected later.
                </Text>
              </View>
            )}

            {/* Strict In-App Cash Display - No System Keyboard */}
            <View style={styles.amountContainer}>
              <AmountDisplay
                value={amountStr}
                currencySymbol={currencySymbol}
                placeholder="0.00"
                isFocused={isAmountFocused}
                onPress={handleAmountPress}
              />
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Dynamic Debt Fields: Person / Contact Name */}
            {isDebtType && (
              <View style={styles.debtFieldBlock}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  {type === 'borrow' ? 'Borrowed From (Contact Name) *' : 'Lent To (Contact Name) *'}
                </Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <User size={18} color={colors.textMuted} />
                  <TextInput
                    value={contactName}
                    onChangeText={(val) => {
                      setContactName(val);
                      setError(null);
                    }}
                    onFocus={() => setIsAmountFocused(false)}
                    placeholder={
                      type === 'borrow' ? 'e.g. Sarah, Dad, Acme Bank' : 'e.g. Alex, Dave, Roommate'
                    }
                    placeholderTextColor={colors.textMuted + '80'}
                    style={[styles.innerInput, { color: colors.text }]}
                  />
                </View>

                {/* Due Date Field */}
                <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>
                  Due Date (Optional)
                </Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Calendar size={18} color={colors.textMuted} />
                  <TextInput
                    value={dueDate}
                    onChangeText={(val) => {
                      setDueDate(val);
                      setError(null);
                    }}
                    onFocus={() => setIsAmountFocused(false)}
                    placeholder="YYYY-MM-DD (e.g. 2026-11-30)"
                    placeholderTextColor={colors.textMuted + '80'}
                    style={[styles.innerInput, { color: colors.text }]}
                  />
                  {dueDate ? (
                    <TouchableOpacity
                      onPress={() => setDueDate('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Quick Due Date Presets */}
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity
                    onPress={() => setQuickDueDate(7)}
                    style={[styles.presetChip, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+7 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(15)}
                    style={[styles.presetChip, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+15 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(30)}
                    style={[styles.presetChip, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+30 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(60)}
                    style={[styles.presetChip, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+60 Days</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Account Selector */}
            <Text style={[styles.label, { color: colors.textMuted, marginTop: isDebtType ? 14 : 0 }]}>
              {type === 'transfer'
                ? 'From Account'
                : type === 'borrow'
                ? 'Deposit Borrowed Cash Into Wallet'
                : type === 'lend'
                ? 'Pay Lent Money Out Of Wallet'
                : type === 'income'
                ? 'Deposit Into Wallet'
                : 'Pay From Wallet'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {userAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedAccountId(acc.id);
                      setIsAmountFocused(true);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? colors.onAccent : colors.text },
                      ]}
                    >
                      {acc.name} ({acc.currency})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Destination Account for Transfer */}
            {type === 'transfer' && (
              <>
                <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>
                  To Destination Account
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {userAccounts.map((acc) => {
                    const isSelected = selectedToAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedToAccountId(acc.id);
                          setIsAmountFocused(true);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? colors.onAccent : colors.text },
                          ]}
                        >
                          {acc.name} ({acc.currency})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Category Selector (Only for Expense & Income) */}
            {!isDebtType && type !== 'transfer' && (
              <>
                <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>
                  Category
                </Text>
                <View style={styles.categoriesGrid}>
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedCategoryId(cat.id);
                          setIsAmountFocused(true);
                        }}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            { color: isSelected ? colors.onAccent : colors.text },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Notes Input */}
            <Text style={[styles.label, { color: colors.textMuted, marginTop: 16 }]}>
              Notes (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setIsAmountFocused(false)}
              placeholder={
                isDebtType
                  ? 'e.g. Terms, reason for loan, repayment plan...'
                  : 'e.g. Lunch with friends, groceries...'
              }
              placeholderTextColor={colors.textMuted + '80'}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </ScrollView>

          {/* Bottom Fixed Area: Custom In-App Cash Keypad + Save Button */}
          <View style={[styles.bottomDock, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            {isAmountFocused && (
              <CustomAmountKeypad
                value={amountStr}
                onChange={(val) => {
                  setAmountStr(val);
                  setError(null);
                }}
                onClear={() => {
                  setAmountStr('');
                  setError(null);
                }}
                keyHeight={48}
              />
            )}

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.accent,
                  marginTop: isAmountFocused ? 8 : 4,
                },
              ]}
              activeOpacity={0.8}
            >
              <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
              <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '92%',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingTop: 10,
  },
  bottomDock: {
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  segmentContainer: {
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  segmentScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 6,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    gap: 6,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  errorBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  debtFieldBlock: {
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  innerInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
