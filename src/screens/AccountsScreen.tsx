import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../store/useAlertStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency, parseAmountToCents } from '../store/useStore';
import { AccountType } from '../types';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import {
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  Briefcase,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  Globe,
} from 'lucide-react-native';

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF (Fr) - Swiss Franc' },
];

export const AccountsScreen: React.FC<BottomTabProps<'AccountsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const accounts = useStore((s) => s.accounts);
  const addAccount = useStore((s) => s.addAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const settings = useStore((s) => s.settings);

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState(settings?.default_currency || 'INR');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [color, setColor] = useState('#047857');
  const [error, setError] = useState<string | null>(null);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCard;
      case 'investment':
        return Briefcase;
      default:
        return Wallet;
    }
  };

  const handleOpenModal = () => {
    setName('');
    setAccountType('bank');
    setCurrency(settings?.default_currency || 'INR');
    setInitialBalanceStr('');
    setError(null);
    setIsCurrencyPickerOpen(false);
    setIsModalOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a wallet name.');
      return;
    }

    if (
      name.trim().toLowerCase() === 'consolidated' ||
      name.trim().toLowerCase() === 'all'
    ) {
      setError('Please choose a specific wallet name.');
      return;
    }

    const initialCents = parseAmountToCents(initialBalanceStr);
    addAccount({
      name: name.trim(),
      account_type: accountType,
      currency: currency || settings.default_currency || 'INR',
      initial_balance: initialCents,
      color,
      icon: 'wallet',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    setInitialBalanceStr('');
    setError(null);
    setIsModalOpen(false);
  };

  const handleDelete = useCallback(
    (id: string, accName: string) => {
      if (userAccounts.length <= 1) {
        showAlert({
          type: 'warning',
          title: 'Cannot Delete',
          message: 'You must maintain at least one active wallet.',
        });
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showAlert({
        type: 'danger',
        title: 'Remove Wallet',
        message: `Are you sure you want to delete "${accName}"? Movements associated with this wallet will be unlinked.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Wallet',
            style: 'destructive',
            onPress: () => {
              deleteAccount(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
      });
    },
    [userAccounts.length, deleteAccount]
  );

  const currentCurrencyInfo =
    CURRENCY_OPTIONS.find((c) => c.code === currency) || {
      code: currency,
      symbol: currency,
      label: `${currency} Currency`,
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Wallets & Accounts</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Checking, cash, savings, and credit wallets
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenModal}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Plus size={18} color={colors.onAccent} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={styles.accountGrid}>
          {userAccounts.map((acc) => {
            const IconComponent = getAccountIcon(acc.account_type);
            const isNegative = acc.current_balance < 0;

            return (
              <View
                key={acc.id}
                style={[
                  styles.accountCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.leftMeta}>
                    <View style={[styles.iconWrap, { backgroundColor: acc.color || colors.accent }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={[styles.accName, { color: colors.text }]}>{acc.name}</Text>
                      <Text style={[styles.accType, { color: colors.textMuted }]}>
                        {acc.account_type.toUpperCase()} • {acc.currency}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(acc.id, acc.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceWrap}>
                  <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>
                    CURRENT BALANCE
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: isNegative ? colors.danger : colors.text },
                    ]}
                  >
                    {formatCurrency(acc.current_balance, acc.currency)}
                  </Text>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    Initial: {formatCurrency(acc.initial_balance, acc.currency)}
                  </Text>
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    {acc.transaction_count || 0} movements
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Wallet / Account Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Wallet</Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Wallet Name</Text>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setError(null);
                }}
                placeholder="e.g. Daily Checking, Cash Wallet, Crypto"
                placeholderTextColor={colors.textMuted + '80'}
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                Wallet Type
              </Text>
              <View style={styles.typeRow}>
                {(['bank', 'cash', 'savings', 'credit'] as AccountType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setAccountType(t)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: accountType === t ? colors.accent : colors.surfaceSubtle,
                        borderColor: accountType === t ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: accountType === t ? colors.onAccent : colors.text },
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Currency Selector (Default strictly INR) */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                Account Currency (Default: INR ₹)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row', marginBottom: 10 }}
              >
                {CURRENCY_OPTIONS.map((item) => {
                  const isSelected = currency === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCurrency(item.code);
                      }}
                      style={[
                        styles.currencyPill,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyPillText,
                          {
                            color: isSelected ? colors.onAccent : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.symbol} {item.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Initial Balance */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 4 }]}>
                Initial Balance ({currentCurrencyInfo.symbol})
              </Text>
              <TextInput
                value={initialBalanceStr}
                onChangeText={setInitialBalanceStr}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '80'}
                keyboardType="decimal-pad"
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                ]}
              />

              <TouchableOpacity
                onPress={handleSave}
                style={[styles.modalSaveBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.8}
              >
                <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
                <Text style={[styles.modalSaveBtnText, { color: colors.onAccent }]}>
                  Create Wallet
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  accountGrid: {
    gap: 14,
  },
  accountCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accName: {
    fontSize: 16,
    fontWeight: '700',
  },
  accType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceWrap: {
    marginVertical: 14,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  currencyPillText: {
    fontSize: 12,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
