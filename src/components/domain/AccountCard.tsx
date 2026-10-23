import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { Account } from '../../types';
import { formatCurrency } from '../../store/useStore';
import { Wallet, Landmark, PiggyBank, CreditCard, Briefcase, Check } from 'lucide-react-native';

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  onPress,
  onLongPress,
}) => {
  const { colors } = useAppTheme();

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

  const IconComponent = getAccountIcon(account.account_type);
  const isNegative = account.current_balance < 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.accent : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: account.color || colors.accent }]}>
          <IconComponent size={18} color="#FFFFFF" />
        </View>

        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </View>

      <View style={styles.midSection}>
        <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={[styles.accountType, { color: colors.textMuted }]}>
          {account.account_type.toUpperCase()} • {account.currency}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Text
          style={[
            styles.balance,
            { color: isNegative ? colors.danger : colors.text },
          ]}
          numberOfLines={1}
        >
          {formatCurrency(account.current_balance, account.currency)}
        </Text>
        <Text style={[styles.txCount, { color: colors.textSubtle }]}>
          {account.transaction_count || 0} moves
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 170,
    padding: 16,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 145,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  midSection: {
    marginBottom: 10,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  accountType: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  bottomSection: {},
  balance: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  txCount: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
