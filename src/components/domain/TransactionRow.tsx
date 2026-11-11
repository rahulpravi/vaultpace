import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { showAlert } from '../../store/useAlertStore';
import { useAppTheme } from '../../theme/useTheme';
import { Transaction, Category, Account } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../store/useStore';
import { triggerHaptic } from '../../utils/haptics';
import { getCategoryIconComponent } from '../../utils/categoryIcons';
import {
  ArrowLeftRight,
  Trash2,
  HelpCircle,
  Coins,
  Repeat,
  Pencil,
} from 'lucide-react-native';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onDelete?: (id: string) => void;
  onPress?: (transaction: Transaction) => void;
  showActions?: boolean;
  isPrivacyMode?: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = React.memo(({
  transaction,
  category,
  account,
  onDelete,
  onPress,
  showActions = true,
  isPrivacyMode = false,
}) => {
  const { colors } = useAppTheme();

  const isIncome = transaction.transaction_type === 'income';
  const isTransfer = transaction.transaction_type === 'transfer';
  const isBorrow = transaction.transaction_type === 'borrow';
  const isLend = transaction.transaction_type === 'lend';

  const getCategoryIcon = (iconName?: string) => {
    if (isBorrow || isLend) return Coins;
    if (isTransfer) return ArrowLeftRight;
    return getCategoryIconComponent(iconName);
  };

  const IconComponent = getCategoryIcon(category?.icon);
  const iconBgColor = isTransfer
    ? colors.accent
    : isBorrow
    ? '#D97706'
    : isLend
    ? '#059669'
    : category?.color || (isIncome ? colors.success : colors.accent);

  const handleDelete = () => {
    triggerHaptic('medium');
    onDelete?.(transaction.id);
  };

  const titleText = isBorrow
    ? transaction.contact_name
      ? `Borrowed from ${transaction.contact_name}`
      : transaction.notes || 'Borrowed Money'
    : isLend
    ? transaction.contact_name
      ? `Lent to ${transaction.contact_name}`
      : transaction.notes || 'Lent Money'
    : transaction.notes || category?.name || (isTransfer ? 'Account Transfer' : 'Expense');

  const amountColor = isBorrow
    ? '#D97706'
    : isLend
    ? '#059669'
    : isIncome
    ? colors.success
    : isTransfer
    ? colors.text
    : colors.danger;

  const amountPrefix = isIncome || isBorrow ? '+' : isTransfer ? '' : '-';

  const badgeColor = isBorrow
    ? '#D97706'
    : isLend
    ? '#059669'
    : category?.color || colors.accent;

  const badgePrefix = isBorrow
    ? transaction.is_settled
      ? 'Settled Borrow • '
      : 'You Owe • '
    : isLend
    ? transaction.is_settled
      ? 'Settled Loan • '
      : 'Owed to You • '
    : category
    ? `${category.name} • `
    : '';

  const recurringPrefix = transaction.is_recurring ? '↻ Recurring • ' : '';
  const metaString = `${account?.name || 'Wallet'} • ${transaction.transaction_date}`;

  const handleRowPress = () => {
    if (onPress) {
      triggerHaptic('light');
      onPress(transaction);
    }
  };

  return (
    <TouchableOpacity
      disabled={!onPress}
      activeOpacity={onPress ? 0.72 : 1}
      onPress={onPress ? handleRowPress : undefined}
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor + '20' }]}>
          <IconComponent size={18} color={iconBgColor} />
        </View>

        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text
              style={[styles.title, { color: colors.text, flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {titleText}
            </Text>
            {transaction.is_recurring && (
              <View style={[styles.recurringPill, { backgroundColor: colors.accentLight }]}>
                <Repeat size={10} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.recurringPillText, { color: colors.accent }]}>Monthly</Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.subTitle, { color: colors.textMuted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {badgePrefix ? (
              <Text style={{ color: badgeColor, fontWeight: '600' }}>
                {badgePrefix}
              </Text>
            ) : null}
            {metaString}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: amountColor },
          ]}
          numberOfLines={1}
        >
          {isPrivacyMode
            ? `${getCurrencySymbol(account?.currency)} ••••••`
            : `${amountPrefix}${formatCurrency(transaction.amount, account?.currency)}`}
        </Text>

        {showActions && (onPress || onDelete) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {onPress && (
              <TouchableOpacity
                onPress={handleRowPress}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Edit movement"
                accessibilityRole="button"
              >
                <Pencil size={13} color={colors.accent} />
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Delete movement"
                accessibilityRole="button"
              >
                <Trash2 size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
  },
  recurringPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurringPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
