import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { Transaction, Category, Account } from '../../types';
import { formatCurrency } from '../../store/useStore';
import * as Haptics from 'expo-haptics';
import {
  ShoppingBag,
  Utensils,
  Tag,
  Car,
  Film,
  HeartPulse,
  DollarSign,
  Briefcase,
  ArrowLeftRight,
  Trash2,
  HelpCircle,
} from 'lucide-react-native';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  category,
  account,
  onDelete,
}) => {
  const { colors } = useAppTheme();

  const isIncome = transaction.transaction_type === 'income';
  const isTransfer = transaction.transaction_type === 'transfer';

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'shopping-bag':
        return ShoppingBag;
      case 'utensils':
        return Utensils;
      case 'tag':
        return Tag;
      case 'car':
        return Car;
      case 'film':
        return Film;
      case 'heart-pulse':
        return HeartPulse;
      case 'dollar-sign':
        return DollarSign;
      case 'briefcase':
        return Briefcase;
      default:
        return isTransfer ? ArrowLeftRight : HelpCircle;
    }
  };

  const IconComponent = getCategoryIcon(category?.icon);
  const iconBgColor = isTransfer
    ? colors.accent
    : category?.color || (isIncome ? colors.success : colors.accent);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Movement', 'Are you sure you want to remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(transaction.id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBgColor + '20' }]}>
          <IconComponent size={18} color={iconBgColor} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {transaction.notes || category?.name || (isTransfer ? 'Account Transfer' : 'Expense')}
          </Text>

          <View style={styles.subRow}>
            {category && (
              <Text style={[styles.metaText, { color: colors.accent }]}>{category.name} • </Text>
            )}
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {account?.name || 'Account'} • {transaction.transaction_date}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            {
              color: isIncome ? colors.success : isTransfer ? colors.text : colors.danger,
            },
          ]}
        >
          {isIncome ? '+' : isTransfer ? '' : '-'}
          {formatCurrency(transaction.amount, account?.currency)}
        </Text>

        {onDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

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
    marginRight: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
  },
});
