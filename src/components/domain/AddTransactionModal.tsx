import React, { useState } from 'react';
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
} from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { useStore, parseAmountToCents } from '../../store/useStore';
import { TransactionType } from '../../types';
import * as Haptics from 'expo-haptics';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react-native';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const { accounts, categories, addTransaction } = useStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedToAccountId, setSelectedToAccountId] = useState(
    accounts[1]?.id || accounts[0]?.id || ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.category_type === 'income' : c.category_type === 'expense'
  );

  const resetForm = () => {
    setAmountStr('');
    setNotes('');
    setError(null);
    setType('expense');
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

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    addTransaction({
      account_id: selectedAccountId,
      category_id: type === 'transfer' ? undefined : selectedCategoryId,
      amount: cents,
      transaction_type: type,
      transaction_date: today,
      transaction_time: timeStr,
      notes: notes.trim() || undefined,
      to_account_id: type === 'transfer' ? selectedToAccountId : undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Movement</Text>
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
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Segmented Control */}
            <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSubtle }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setType('expense');
                }}
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

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setType('income');
                }}
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

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setType('transfer');
                }}
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
            </View>

            {/* Big Amount Input */}
            <View style={styles.amountWrap}>
              <Text style={[styles.currencyPrefix, { color: colors.accent }]}>$</Text>
              <TextInput
                value={amountStr}
                onChangeText={(val) => {
                  setAmountStr(val);
                  setError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '80'}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: colors.text }]}
                autoFocus
              />
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Account Selector */}
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {type === 'transfer' ? 'From Account' : 'Account'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
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
                  {accounts.map((acc) => {
                    const isSelected = selectedToAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedToAccountId(acc.id)}
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

            {/* Category Selector (Non-transfer) */}
            {type !== 'transfer' && (
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
                        onPress={() => setSelectedCategoryId(cat.id)}
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
              placeholder="e.g. Lunch with friends, groceries..."
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

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
              <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>Save Movement</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '90%',
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
    paddingTop: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '800',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '800',
    minWidth: 140,
    textAlign: 'center',
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
    height: 44,
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
