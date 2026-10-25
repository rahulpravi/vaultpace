import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
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
  const { accounts, addAccount, deleteAccount, settings } = useStore();

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

  const handleDelete = (id: string, accName: string) => {
    if (accounts.length <= 1) {
      Alert.alert('Cannot Delete', 'You must maintain at least one active wallet.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Wallet',
      `Are you sure you want to delete "${accName}"? Movements associated with this wallet will be unlinked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Wallet',
          style: 'destructive',
          onPress: () => {
            deleteAccount(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        <View style={styles.accountGrid}>
          {accounts.map((acc) => {
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
        <View style={styles.modalOverlay}>
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

            <ScrollView showsVerticalScrollIndicator={false}>
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

              {/* Currency Dropdown Selector */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
                Account Currency
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsCurrencyPickerOpen(!isCurrencyPickerOpen);
                }}
                style={[
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: isCurrencyPickerOpen ? colors.accent : colors.border,
                  },
                ]}
              >
                <View style={styles.dropdownLeft}>
                  <Globe size={16} color={colors.accent} />
                  <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                    {currentCurrencyInfo.label}
                  </Text>
                </View>
                <ChevronDown
                  size={16}
                  color={colors.textMuted}
                  style={{
                    transform: [{ rotate: isCurrencyPickerOpen ? '180deg' : '0deg' }],
                  }}
                />
              </TouchableOpacity>

              {/* Currency Dropdown Options List */}
              {isCurrencyPickerOpen && (
                <View
                  style={[
                    styles.dropdownList,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  {CURRENCY_OPTIONS.map((item) => {
                    const isSelected = currency === item.code;
                    return (
                      <TouchableOpacity
                        key={item.code}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCurrency(item.code);
                          setIsCurrencyPickerOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            borderBottomColor: colors.border,
                            backgroundColor: isSelected ? colors.surface : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            {
                              color: isSelected ? colors.accent : colors.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && <Check size={16} color={colors.accent} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Initial Balance */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 14 }]}>
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
        </View>
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownList: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
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
