import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../../store/useAlertStore';
import * as Haptics from 'expo-haptics';
import { X, Check, Target, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useTheme';
import { Budget } from '../../types';
import { useStore, parseAmountToCents, formatCurrency } from '../../store/useStore';
import {
  CustomAmountKeypad,
  AmountDisplay,
} from '../common/CustomAmountKeypad';

interface EditMonthlyCapModalProps {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSuccess?: (newLimitCents: number) => void;
}

export const EditMonthlyCapModal: React.FC<EditMonthlyCapModalProps> = ({
  visible,
  budget,
  onClose,
  onSuccess,
}) => {
  const { colors } = useAppTheme();
  const setMonthlySpendingCap = useStore((s) => s.setMonthlySpendingCap);
  const settings = useStore((s) => s.settings);

  const [limitStr, setLimitStr] = useState('');
  const [isKeypadFocused, setIsKeypadFocused] = useState(true);

  useEffect(() => {
    if (visible && budget) {
      // Initialize with current budget limit in rupees
      const currentRupees = budget.amount_limit / 100;
      setLimitStr(currentRupees > 0 ? currentRupees.toString() : '');
      setIsKeypadFocused(true);
    }
  }, [visible, budget]);

  const handleQuickAdd = (amountRupees: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parsed = parseFloat(limitStr) || 0;
    const next = parsed + amountRupees;
    setLimitStr(next.toString());
  };

  const handleSave = () => {
    const cents = parseAmountToCents(limitStr);
    if (cents <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert({
        type: 'warning',
        title: 'Invalid Cap',
        message: 'Please enter a spending limit greater than zero.',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMonthlySpendingCap(cents);
    onSuccess?.(cents);
    onClose();
  };

  const currencySymbol =
    settings?.default_currency === 'USD'
      ? '$'
      : settings?.default_currency === 'EUR'
      ? '€'
      : '₹';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                <Target size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Edit Monthly Spending Cap
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {budget ? budget.name : 'Overall Spending'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Current vs New Limit Information */}
          {budget && (
            <View
              style={[
                styles.currentLimitBanner,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.bannerLabel, { color: colors.textMuted }]}>
                CURRENT MONTHLY CAP:
              </Text>
              <Text style={[styles.bannerValue, { color: colors.text }]}>
                {formatCurrency(budget.amount_limit, settings?.default_currency)}
              </Text>
            </View>
          )}

          {/* Amount Display */}
          <View style={styles.amountDisplayArea}>
            <AmountDisplay
              value={limitStr}
              currencySymbol={currencySymbol}
              placeholder="0.00"
              isFocused={isKeypadFocused}
              onPress={() => setIsKeypadFocused(true)}
            />
          </View>

          {/* Quick Increment Pills */}
          <View style={styles.quickAddRow}>
            {[1000, 5000, 10000, 25000].map((step) => (
              <TouchableOpacity
                key={step}
                onPress={() => handleQuickAdd(step)}
                style={[
                  styles.quickAddPill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Plus size={11} color={colors.accent} />
                <Text style={[styles.quickAddText, { color: colors.text }]}>
                  {step >= 1000 ? `₹${step / 1000}k` : `₹${step}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* In-App Calculator Keypad */}
          <CustomAmountKeypad
            value={limitStr}
            onChange={setLimitStr}
            onClear={() => setLimitStr('')}
            keyHeight={46}
            style={styles.keypad}
          />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
          >
            <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
            <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
              Update Monthly Cap
            </Text>
          </TouchableOpacity>
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
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  amountDisplayArea: {
    marginTop: 10,
    marginBottom: 8,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickAddPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
  keypad: {
    marginBottom: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

