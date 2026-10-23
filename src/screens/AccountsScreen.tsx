import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
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
} from 'lucide-react-native';

export const AccountsScreen: React.FC<BottomTabProps<'AccountsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { accounts, addAccount, deleteAccount } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState('USD');
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

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide an account pool name.');
      return;
    }

    const initialCents = parseAmountToCents(initialBalanceStr);
    addAccount({
      name: name.trim(),
      account_type: accountType,
      currency,
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
      Alert.alert('Cannot Delete', 'You must maintain at least one financial pool.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Financial Pool',
      `Are you sure you want to delete "${accName}"? Movements associated with this pool will be unlinked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Financial Pools</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Checking, cash, savings, and credit pools
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsModalOpen(true);
          }}
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

      {/* Add Account Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Financial Pool</Text>
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

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Pool Name</Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError(null);
              }}
              placeholder="e.g. Main Checking, Crypto Vault"
              placeholderTextColor={colors.textMuted + '80'}
              style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>
              Account Category
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

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>
              Initial Balance
            </Text>
            <TextInput
              value={initialBalanceStr}
              onChangeText={setInitialBalanceStr}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted + '80'}
              keyboardType="decimal-pad"
              style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text }]}
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.modalSaveBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
              <Text style={[styles.modalSaveBtnText, { color: colors.onAccent }]}>
                Create Account Pool
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  accountGrid: {
    gap: 12,
  },
  accountCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  accType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceWrap: {
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
