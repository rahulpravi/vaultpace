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
  Switch,
} from 'react-native';
import { showAlert } from '../../store/useAlertStore';
import { useAppTheme } from '../../theme/useTheme';
import { useStore, parseAmountToCents, formatCurrency, getCurrencySymbol } from '../../store/useStore';
import { TransactionType, Transaction } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
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
  Plus,
  Repeat,
  ChevronDown,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard as CreditCardIcon,
  Briefcase,
  BookUser,
  Phone,
} from 'lucide-react-native';
import {
  CustomAmountKeypad,
  AmountDisplay,
} from '../common/CustomAmountKeypad';
import { AddCategoryModal } from './AddCategoryModal';
import { CalendarDatePickerModal } from '../common/CalendarDatePickerModal';
import { ContactPickerModal } from './ContactPickerModal';
import { DebtMessageModal, DebtMessageConfig } from './DebtMessageModal';
import { getCategoryIconComponent } from '../../utils/categoryIcons';

interface AddTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
  initialTransaction?: Transaction | null;
  initialContactName?: string;
  initialContactPhone?: string;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = React.memo(({
  visible,
  initialType = 'expense',
  initialTransaction = null,
  initialContactName = '',
  initialContactPhone = '',
  onClose,
}) => {
  const { colors } = useAppTheme();
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const settings = useStore((s) => s.settings);

  const isEditMode = Boolean(initialTransaction);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(
    () => new Date(Date.now() - 86400000).toISOString().split('T')[0],
    []
  );

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
    return (
      (otherCat || cats[0])?.id ||
      (targetType === 'income' ? 'cat-income-other' : 'cat-expense-other')
    );
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() =>
    getDefaultCategoryIdForType(initialType)
  );
  const [contactName, setContactName] = useState(initialContactName);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [savedDebtMessageConfig, setSavedDebtMessageConfig] = useState<DebtMessageConfig | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  // Dropdown Picker Sheet Active State: 'fromWallet' | 'toWallet' | 'category' | null
  const [activePicker, setActivePicker] = useState<'fromWallet' | 'toWallet' | 'category' | null>(
    null
  );

  // Controls whether the in-app custom keypad is active vs native system keyboard for text fields
  const [isAmountFocused, setIsAmountFocused] = useState(true);

  // Synchronize state when modal opens or initialTransaction changes
  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.transaction_type);
        setAmountStr((initialTransaction.amount / 100).toString());
        setSelectedAccountId(initialTransaction.account_id);
        setSelectedToAccountId(
          initialTransaction.to_account_id || userAccounts[1]?.id || userAccounts[0]?.id || ''
        );
        setSelectedCategoryId(
          initialTransaction.category_id ||
            getDefaultCategoryIdForType(initialTransaction.transaction_type)
        );
        setNotes(initialTransaction.notes || '');
        setContactName(initialTransaction.contact_name || '');
        setContactPhone(initialTransaction.contact_phone || initialContactPhone || '');
        setDueDate(initialTransaction.due_date || '');
        setSelectedDate(initialTransaction.transaction_date || todayStr);
        setIsRecurring(Boolean(initialTransaction.is_recurring));
        setIsAmountFocused(true);
        setError(null);
        setActivePicker(null);
        setSavedDebtMessageConfig(null);
      } else {
        const activeType = initialType || 'expense';
        setType(activeType);
        setAmountStr('');
        setNotes('');
        setContactName(initialContactName || '');
        setContactPhone(initialContactPhone || '');
        setDueDate('');
        setSelectedDate(todayStr);
        setIsRecurring(false);
        setIsAmountFocused(true);
        setError(null);
        setActivePicker(null);
        setSavedDebtMessageConfig(null);
        Keyboard.dismiss();
        setSelectedCategoryId(getDefaultCategoryIdForType(activeType));
      }
    }
  }, [visible, initialType, initialTransaction, initialContactName, initialContactPhone, todayStr]);

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
    if (!visible) return;
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
  }, [visible]);

  const handleAmountPress = () => {
    Keyboard.dismiss();
    setActivePicker(null);
    setIsAmountFocused(true);
  };

  const selectedAccount = useMemo(
    () => userAccounts.find((a) => a.id === selectedAccountId) || userAccounts[0],
    [userAccounts, selectedAccountId]
  );

  const selectedToAccount = useMemo(
    () =>
      userAccounts.find((a) => a.id === selectedToAccountId) ||
      userAccounts[1] ||
      userAccounts[0],
    [userAccounts, selectedToAccountId]
  );

  const activeCurrency = selectedAccount?.currency || settings?.default_currency || 'INR';
  const currencySymbol = getCurrencySymbol(activeCurrency);

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

  // Selected Category Entity
  const selectedCategory = useMemo(() => {
    return (
      filteredCategories.find((c) => c.id === selectedCategoryId) ||
      filteredCategories.find((c) => c.name.toLowerCase() === 'other') ||
      filteredCategories[0]
    );
  }, [filteredCategories, selectedCategoryId]);

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
    triggerHaptic('selection');
    Keyboard.dismiss();
    setActivePicker(null);
    setType(newType);
    setIsAmountFocused(true);
    setError(null);
    setSelectedCategoryId(getDefaultCategoryIdForType(newType));
  };

  const setQuickDueDate = (days: number) => {
    triggerHaptic('selection');
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const resetForm = () => {
    setAmountStr('');
    setNotes('');
    setContactName('');
    setContactPhone('');
    setDueDate('');
    setError(null);
    setType('expense');
    setSelectedDate(todayStr);
    setIsRecurring(false);
    setSelectedCategoryId(getDefaultCategoryIdForType('expense'));
    setActivePicker(null);
    setIsAmountFocused(true);
    setSavedDebtMessageConfig(null);
    Keyboard.dismiss();
  };

  const executeSave = (cents: number, finalCategoryId?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        account_id: selectedAccountId,
        category_id: finalCategoryId,
        amount: cents,
        transaction_type: type,
        transaction_date: selectedDate,
        notes: notes.trim() || undefined,
        to_account_id: type === 'transfer' ? selectedToAccountId : undefined,
        contact_name:
          type === 'borrow' || type === 'lend' ? contactName.trim() : undefined,
        contact_phone:
          (type === 'borrow' || type === 'lend') && contactPhone.trim()
            ? contactPhone.trim()
            : undefined,
        due_date:
          (type === 'borrow' || type === 'lend') && dueDate.trim()
            ? dueDate.trim()
            : undefined,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? 'monthly' : undefined,
      });

      triggerHaptic('success');
      resetForm();
      onClose();
    } else {
      addTransaction({
        account_id: selectedAccountId,
        category_id: finalCategoryId,
        amount: cents,
        transaction_type: type,
        transaction_date: selectedDate,
        transaction_time: timeStr,
        notes: notes.trim() || undefined,
        to_account_id: type === 'transfer' ? selectedToAccountId : undefined,
        contact_name:
          type === 'borrow' || type === 'lend' ? contactName.trim() : undefined,
        contact_phone:
          (type === 'borrow' || type === 'lend') && contactPhone.trim()
            ? contactPhone.trim()
            : undefined,
        due_date:
          (type === 'borrow' || type === 'lend') && dueDate.trim()
            ? dueDate.trim()
            : undefined,
        is_settled: type === 'borrow' || type === 'lend' ? false : undefined,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? 'monthly' : undefined,
      });

      triggerHaptic('success');

      if (type === 'borrow' || type === 'lend') {
        setSavedDebtMessageConfig({
          visible: true,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim() || undefined,
          messageType: 'new_entry',
          currencySymbol,
          paymentAmountFormatted: formatCurrency(cents, activeCurrency),
          netAmountFormatted: formatCurrency(cents, activeCurrency),
          movementType: type,
          date: selectedDate,
          dueDate: dueDate.trim() || undefined,
        });
      } else {
        resetForm();
        onClose();
      }
    }
  };

  const handleSave = () => {
    const cents = parseAmountToCents(amountStr);
    if (cents <= 0) {
      setError('Please enter a valid amount greater than 0.');
      triggerHaptic('error');
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
      triggerHaptic('error');
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

    // Negative balance alert for outgoing money (expense / transfer)
    if (type === 'expense' || type === 'transfer') {
      const sourceAccount = userAccounts.find((a) => a.id === selectedAccountId);
      if (sourceAccount) {
        let available = sourceAccount.current_balance;
        if (
          initialTransaction &&
          initialTransaction.account_id === selectedAccountId &&
          (initialTransaction.transaction_type === 'expense' ||
            initialTransaction.transaction_type === 'transfer')
        ) {
          available += initialTransaction.amount;
        }

        const projected = available - cents;
        if (projected < 0) {
          triggerHaptic('warning');
          showAlert({
            type: 'warning',
            title: 'Negative Balance Warning',
            message: `Spending ${formatCurrency(cents, activeCurrency)} from "${
              sourceAccount.name
            }" exceeds your available balance (${formatCurrency(
              available,
              activeCurrency
            )}) and will leave a negative balance of ${formatCurrency(
              projected,
              activeCurrency
            )}.\n\nDo you want to proceed?`,
            buttons: [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Proceed Anyway',
                style: 'destructive',
                onPress: () => executeSave(cents, finalCategoryId),
              },
            ],
          });
          return;
        }
      }
    }

    executeSave(cents, finalCategoryId);
  };

  const getAccountIcon = (accountType?: string) => {
    switch (accountType) {
      case 'bank':
        return Landmark;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCardIcon;
      case 'investment':
        return Briefcase;
      default:
        return Wallet;
    }
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditMode ? 'Edit Record' : 'Add Records'}
            </Text>
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
              <View
                style={[styles.infoBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
              >
                <Coins size={16} color="#D97706" />
                <Text style={[styles.infoBannerText, { color: '#92400E' }]}>
                  Borrowing increases your wallet balance today. You owe this back as a liability.
                </Text>
              </View>
            )}

            {type === 'lend' && (
              <View
                style={[styles.infoBanner, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}
              >
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

            {/* Compact 2-Column Dropdown Selectors Row */}
            <View style={styles.dropdownsRow}>
              {/* Dropdown 1: Source Wallet / Account */}
              <View
                style={[
                  styles.dropdownCol,
                  isDebtType && styles.dropdownColFull,
                ]}
              >
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  {type === 'transfer'
                    ? 'From Wallet'
                    : type === 'borrow'
                    ? 'Deposit Into'
                    : type === 'lend'
                    ? 'Pay From'
                    : type === 'income'
                    ? 'Deposit Into'
                    : 'Pay From'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Keyboard.dismiss();
                    triggerHaptic('light');
                    setActivePicker('fromWallet');
                  }}
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.dropdownLeft}>
                    <View
                      style={[
                        styles.dropdownIconCircle,
                        { backgroundColor: colors.accentLight },
                      ]}
                    >
                      {React.createElement(getAccountIcon(selectedAccount?.account_type), {
                        size: 15,
                        color: colors.accent,
                        strokeWidth: 2.2,
                      })}
                    </View>
                    <View style={styles.dropdownTextWrap}>
                      <Text
                        style={[styles.dropdownValue, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {selectedAccount?.name || 'Select Wallet'}
                      </Text>
                      <Text
                        style={[styles.dropdownSubtext, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {selectedAccount
                          ? formatCurrency(
                              selectedAccount.current_balance,
                              selectedAccount.currency
                            )
                          : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={15} color={colors.textMuted} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {/* Dropdown 2: Destination Wallet (Transfer) OR Category (Expense/Income) */}
              {type === 'transfer' ? (
                <View style={styles.dropdownCol}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>To Destination</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      triggerHaptic('light');
                      setActivePicker('toWallet');
                    }}
                    style={[
                      styles.dropdownTrigger,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.dropdownLeft}>
                      <View
                        style={[
                          styles.dropdownIconCircle,
                          { backgroundColor: colors.accentLight },
                        ]}
                      >
                        {React.createElement(getAccountIcon(selectedToAccount?.account_type), {
                          size: 15,
                          color: colors.accent,
                          strokeWidth: 2.2,
                        })}
                      </View>
                      <View style={styles.dropdownTextWrap}>
                        <Text
                          style={[styles.dropdownValue, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {selectedToAccount?.name || 'Select Wallet'}
                        </Text>
                        <Text
                          style={[styles.dropdownSubtext, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {selectedToAccount
                            ? formatCurrency(
                                selectedToAccount.current_balance,
                                selectedToAccount.currency
                              )
                            : ''}
                        </Text>
                      </View>
                    </View>
                    <ChevronDown size={15} color={colors.textMuted} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              ) : !isDebtType ? (
                <View style={styles.dropdownCol}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      triggerHaptic('light');
                      setActivePicker('category');
                    }}
                    style={[
                      styles.dropdownTrigger,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.dropdownLeft}>
                      <View
                        style={[
                          styles.dropdownIconCircle,
                          {
                            backgroundColor: (selectedCategory?.color || colors.accent) + '22',
                          },
                        ]}
                      >
                        {React.createElement(
                          getCategoryIconComponent(selectedCategory?.icon),
                          {
                            size: 15,
                            color: selectedCategory?.color || colors.accent,
                            strokeWidth: 2.2,
                          }
                        )}
                      </View>
                      <View style={styles.dropdownTextWrap}>
                        <Text
                          style={[styles.dropdownValue, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {selectedCategory?.name || 'Select Category'}
                        </Text>
                        <Text
                          style={[styles.dropdownSubtext, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {type === 'income' ? 'Income' : 'Expense'}
                        </Text>
                      </View>
                    </View>
                    <ChevronDown size={15} color={colors.textMuted} strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Dynamic Debt Fields: Person / Contact Name & Phone */}
            {isDebtType && (
              <View style={styles.debtFieldBlock}>
                <View style={styles.contactHeaderRow}>
                  <Text style={[styles.label, { color: colors.textMuted, marginTop: 0 }]}>
                    {type === 'borrow'
                      ? 'Borrowed From (Contact Name) *'
                      : 'Lent To (Contact Name) *'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowContactPicker(true);
                    }}
                    style={[
                      styles.pickContactBtn,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <BookUser size={13} color={colors.accent} />
                    <Text style={[styles.pickContactBtnText, { color: colors.accent }]}>
                      Pick Contact
                    </Text>
                  </TouchableOpacity>
                </View>
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
                    onFocus={() => {
                      setActivePicker(null);
                      setIsAmountFocused(false);
                    }}
                    placeholder={
                      type === 'borrow' ? 'e.g. Sarah, Dad, Acme Bank' : 'e.g. Alex, Dave, Roommate'
                    }
                    placeholderTextColor={colors.textMuted + '80'}
                    style={[styles.innerInput, { color: colors.text }]}
                  />
                </View>

                {/* Contact Phone (Optional for WhatsApp / SMS notifications) */}
                <Text style={[styles.label, { color: colors.textMuted, marginTop: 12 }]}>
                  Phone Number (Optional - for WhatsApp / SMS)
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
                  <Phone size={18} color={colors.textMuted} />
                  <TextInput
                    value={contactPhone}
                    onChangeText={(val) => {
                      setContactPhone(val);
                      setError(null);
                    }}
                    onFocus={() => {
                      setActivePicker(null);
                      setIsAmountFocused(false);
                    }}
                    placeholder="e.g. +1 555-123-4567 or 9876543210"
                    placeholderTextColor={colors.textMuted + '80'}
                    keyboardType="phone-pad"
                    style={[styles.innerInput, { color: colors.text }]}
                  />
                  {contactPhone ? (
                    <TouchableOpacity
                      onPress={() => setContactPhone('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
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
                    onFocus={() => {
                      setActivePicker(null);
                      setIsAmountFocused(false);
                    }}
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
                    style={[
                      styles.presetChip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+7 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(15)}
                    style={[
                      styles.presetChip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+15 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(30)}
                    style={[
                      styles.presetChip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+30 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setQuickDueDate(60)}
                    style={[
                      styles.presetChip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.presetText, { color: colors.text }]}>+60 Days</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Transaction Date Selector */}
            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>
              Transaction Date
            </Text>
            <View style={styles.datePillsRow}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setActivePicker(null);
                  triggerHaptic('selection');
                  setSelectedDate(todayStr);
                }}
                style={[
                  styles.datePill,
                  selectedDate === todayStr
                    ? [styles.datePillActive, { backgroundColor: colors.accent, borderColor: colors.accent }]
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.datePillText,
                    { color: selectedDate === todayStr ? colors.onAccent : colors.text },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setActivePicker(null);
                  triggerHaptic('selection');
                  setSelectedDate(yesterdayStr);
                }}
                style={[
                  styles.datePill,
                  selectedDate === yesterdayStr
                    ? [styles.datePillActive, { backgroundColor: colors.accent, borderColor: colors.accent }]
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.datePillText,
                    { color: selectedDate === yesterdayStr ? colors.onAccent : colors.text },
                  ]}
                >
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setActivePicker(null);
                  triggerHaptic('light');
                  setShowDatePicker(true);
                }}
                style={[
                  styles.datePill,
                  selectedDate !== todayStr && selectedDate !== yesterdayStr
                    ? [styles.datePillActive, { backgroundColor: colors.accent, borderColor: colors.accent }]
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Calendar
                  size={12}
                  color={
                    selectedDate !== todayStr && selectedDate !== yesterdayStr
                      ? colors.onAccent
                      : colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.datePillText,
                    {
                      color:
                        selectedDate !== todayStr && selectedDate !== yesterdayStr
                          ? colors.onAccent
                          : colors.text,
                    },
                  ]}
                >
                  {selectedDate !== todayStr && selectedDate !== yesterdayStr
                    ? selectedDate
                    : 'Other Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recurring Monthly Record (Repeat Monthly) */}
            {(type === 'expense' || type === 'income') && (
              <View
                style={[
                  styles.recurringCard,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <View style={styles.recurringInfo}>
                  <View
                    style={[
                      styles.recurringIconBox,
                      { backgroundColor: isRecurring ? colors.accentLight : colors.border + '60' },
                    ]}
                  >
                    <Repeat size={16} color={isRecurring ? colors.accent : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.recurringLabel, { color: colors.text }]}>
                      Repeat Monthly
                    </Text>
                    <Text style={[styles.recurringSub, { color: colors.textMuted }]}>
                      Auto-records every month (Salary, Rent, EMI)
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={(val) => {
                    triggerHaptic('selection');
                    setIsRecurring(val);
                  }}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={isRecurring ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>
            )}

            {/* Notes Input */}
            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>
              Notes (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onFocus={() => {
                setActivePicker(null);
                setIsAmountFocused(false);
              }}
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
          <View
            style={[
              styles.bottomDock,
              { borderTopColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
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
                {isEditMode ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
            DROPDOWN SELECTION POPUP SHEET OVERLAY
           ========================================================================= */}
        {activePicker !== null && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              activeOpacity={1}
              onPress={() => setActivePicker(null)}
            />
            <View
              style={[
                styles.pickerSheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Handle */}
              <View style={styles.sheetHandleWrap}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>

              {/* Picker Header */}
              <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>
                    {activePicker === 'fromWallet'
                      ? 'Select Pay From Wallet'
                      : activePicker === 'toWallet'
                      ? 'Select Destination Wallet'
                      : `Select ${type === 'income' ? 'Income' : 'Expense'} Category`}
                  </Text>
                  <Text style={[styles.pickerSubtitle, { color: colors.textMuted }]}>
                    {activePicker === 'category'
                      ? 'Choose a category to classify this record'
                      : 'Choose an account for this transaction'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setActivePicker(null)}
                  style={[styles.pickerCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <X size={16} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Picker List: Wallets */}
              {(activePicker === 'fromWallet' || activePicker === 'toWallet') && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerListContent}
                >
                  {userAccounts.map((acc) => {
                    const isSelected =
                      activePicker === 'fromWallet'
                        ? selectedAccountId === acc.id
                        : selectedToAccountId === acc.id;
                    const AccIcon = getAccountIcon(acc.account_type);

                    return (
                      <TouchableOpacity
                        key={acc.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          triggerHaptic('selection');
                          if (activePicker === 'fromWallet') {
                            setSelectedAccountId(acc.id);
                          } else {
                            setSelectedToAccountId(acc.id);
                          }
                          setActivePicker(null);
                          setIsAmountFocused(true);
                        }}
                        style={[
                          styles.walletOptionCard,
                          {
                            backgroundColor: isSelected
                              ? colors.accentLight
                              : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.walletOptionLeft}>
                          <View
                            style={[
                              styles.walletOptionIconBox,
                              {
                                backgroundColor: isSelected
                                  ? colors.accent
                                  : colors.surface,
                              },
                            ]}
                          >
                            <AccIcon
                              size={18}
                              color={isSelected ? colors.onAccent : colors.accent}
                              strokeWidth={2.2}
                            />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.walletOptionName,
                                { color: colors.text },
                              ]}
                            >
                              {acc.name}
                            </Text>
                            <Text
                              style={[
                                styles.walletOptionType,
                                { color: colors.textMuted },
                              ]}
                            >
                              {acc.account_type.toUpperCase()} • {acc.currency}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.walletOptionRight}>
                          <Text
                            style={[
                              styles.walletOptionBalance,
                              {
                                color:
                                  acc.current_balance < 0 ? colors.danger : colors.text,
                              },
                            ]}
                          >
                            {formatCurrency(acc.current_balance, acc.currency)}
                          </Text>
                          {isSelected && (
                            <View
                              style={[
                                styles.checkBadge,
                                { backgroundColor: colors.accent },
                              ]}
                            >
                              <Check size={12} color={colors.onAccent} strokeWidth={2.6} />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Picker List: Categories */}
              {activePicker === 'category' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerListContent}
                >
                  <View style={styles.categoriesGridContainer}>
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      const CatIcon = getCategoryIconComponent(cat.icon);

                      return (
                        <TouchableOpacity
                          key={cat.id}
                          activeOpacity={0.7}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSelectedCategoryId(cat.id);
                            setActivePicker(null);
                            setIsAmountFocused(true);
                          }}
                          style={[
                            styles.categoryOptionCard,
                            {
                              backgroundColor: isSelected
                                ? (cat.color || colors.accent) + '22'
                                : colors.surfaceSubtle,
                              borderColor: isSelected
                                ? cat.color || colors.accent
                                : colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.categoryOptionIconBox,
                              {
                                backgroundColor: isSelected
                                  ? cat.color || colors.accent
                                  : (cat.color || colors.accent) + '20',
                              },
                            ]}
                          >
                            <CatIcon
                              size={18}
                              color={
                                isSelected ? '#FFFFFF' : cat.color || colors.accent
                              }
                              strokeWidth={2.2}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryOptionName,
                              {
                                color: isSelected
                                  ? cat.color || colors.accent
                                  : colors.text,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          {isSelected && (
                            <View
                              style={[
                                styles.categoryCheckBadge,
                                { backgroundColor: cat.color || colors.accent },
                              ]}
                            >
                              <Check size={11} color="#FFFFFF" strokeWidth={2.6} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* + Add New Category Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic('light');
                      setActivePicker(null);
                      setShowAddCategoryModal(true);
                    }}
                    style={[
                      styles.addCategoryActionBtn,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Plus size={16} color={colors.accent} strokeWidth={2.4} />
                    <Text style={[styles.addCategoryActionText, { color: colors.accent }]}>
                      + Add New Category
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Nested Add Custom Category Modal */}
      <AddCategoryModal
        visible={showAddCategoryModal}
        initialType={type === 'income' ? 'income' : 'expense'}
        onClose={() => setShowAddCategoryModal(false)}
        onSuccess={(newCat) => {
          setSelectedCategoryId(newCat.id);
          setIsAmountFocused(true);
        }}
      />

      {/* Date Picker Modal */}
      <CalendarDatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Phone Contact Picker Modal */}
      <ContactPickerModal
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelectContact={(c) => {
          setContactName(c.name);
          if (c.phone) {
            setContactPhone(c.phone);
          }
        }}
      />

      {/* Debt Notification / Message Modal */}
      {savedDebtMessageConfig && (
        <DebtMessageModal
          config={savedDebtMessageConfig}
          onClose={() => {
            setSavedDebtMessageConfig(null);
            resetForm();
            onClose();
          }}
        />
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    position: 'relative',
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
    marginBottom: 10,
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
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  /* Compact 2-Column Dropdowns */
  dropdownsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  dropdownCol: {
    flex: 1,
  },
  dropdownColFull: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dropdownSubtext: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  debtFieldBlock: {
    marginBottom: 8,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  pickContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pickContactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
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
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
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
  datePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  datePillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 6,
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recurringIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  recurringSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  /* =========================================================================
     DROPDOWN PICKER SHEET STYLES
     ========================================================================= */
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 100,
    elevation: 100,
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pickerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerListContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  walletOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  walletOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  walletOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletOptionName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  walletOptionType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  walletOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletOptionBalance: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Categories Grid in Picker */
  categoriesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOptionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    position: 'relative',
  },
  categoryOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionName: {
    fontSize: 13,
    flex: 1,
  },
  categoryCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addCategoryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
