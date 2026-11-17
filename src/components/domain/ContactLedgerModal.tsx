import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/useTheme';
import { useStore, formatCurrency, parseAmountToCents, getCurrencySymbol } from '../../store/useStore';
import { Transaction, ContactDebtSummary } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { showAlert } from '../../store/useAlertStore';
import {
  X,
  Phone,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Calendar,
  Wallet,
  Clock,
  Plus,
  Minus,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import { PinVerificationModal } from '../security/PinVerificationModal';
import {
  CustomAmountKeypad,
  AmountDisplay,
} from '../common/CustomAmountKeypad';

interface ContactLedgerModalProps {
  visible: boolean;
  contactSummary: ContactDebtSummary | null;
  onClose: () => void;
  onOpenAddModal: (type: 'lend' | 'borrow', contactName: string, contactPhone?: string) => void;
  onOpenMessageModal: (summary: ContactDebtSummary) => void;
}

export const ContactLedgerModal: React.FC<ContactLedgerModalProps> = ({
  visible,
  contactSummary,
  onClose,
  onOpenAddModal,
  onOpenMessageModal,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const accounts = useStore((s) => s.accounts);
  const settings = useStore((s) => s.settings);
  const settleDebt = useStore((s) => s.settleDebt);
  const settlePersonBalance = useStore((s) => s.settlePersonBalance);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [settlingDebt, setSettlingDebt] = useState<Transaction | null>(null);
  const [isSettleBalanceOpen, setIsSettleBalanceOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [settleAmountStr, setSettleAmountStr] = useState<string>('');

  const [pinModalConfig, setPinModalConfig] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
    actionType: 'destructive' | 'primary';
    onSuccess: () => void;
  }>({
    visible: false,
    title: '',
    subtitle: '',
    actionType: 'primary',
    onSuccess: () => {},
  });

  const hasLockConfigured =
    Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

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

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const currencySymbol = getCurrencySymbol(settings.default_currency);

  const sortedTransactions = useMemo(() => {
    if (!contactSummary) return [];
    return [...contactSummary.transactions].sort((a, b) => {
      const dateA = `${a.transaction_date}T${a.transaction_time || '00:00:00'}`;
      const dateB = `${b.transaction_date}T${b.transaction_time || '00:00:00'}`;
      return dateB.localeCompare(dateA);
    });
  }, [contactSummary]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || 'C').toUpperCase();
  };

  // Open single transaction settlement
  const handleOpenSingleSettle = (tx: Transaction) => {
    triggerHaptic('light');
    setSettlingDebt(tx);
    setSelectedAccountId(userAccounts[0]?.id || tx.account_id);
    setSettleAmountStr((tx.amount / 100).toString());
  };

  // Confirm single debt settlement
  const handleConfirmSingleSettle = () => {
    if (!settlingDebt || !selectedAccountId) return;
    const amountCents = parseAmountToCents(settleAmountStr);
    if (amountCents <= 0) return;

    const performSettle = () => {
      settleDebt(settlingDebt.id, selectedAccountId, amountCents);
      triggerHaptic('success');
      setSettlingDebt(null);
      showAlert({
        type: 'success',
        title: 'Settlement Recorded',
        message: `Recorded payment of ${formatCurrency(amountCents, settings.default_currency)} with ${contactSummary?.contactName}. Wallet balance updated.`,
      });
    };

    if (hasLockConfigured) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize Settlement',
        subtitle: `Enter your PIN to confirm settlement with ${contactSummary?.contactName}.`,
        actionType: 'primary',
        onSuccess: performSettle,
      });
    } else {
      performSettle();
    }
  };

  // Open full/partial person balance settlement
  const handleOpenPersonSettle = () => {
    if (!contactSummary || contactSummary.netBalanceCents === 0) return;
    triggerHaptic('light');
    setSelectedAccountId(userAccounts[0]?.id || '');
    setSettleAmountStr((Math.abs(contactSummary.netBalanceCents) / 100).toString());
    setIsSettleBalanceOpen(true);
  };

  // Confirm person balance settlement
  const handleConfirmPersonSettle = () => {
    if (!contactSummary || !selectedAccountId) return;
    const amountCents = parseAmountToCents(settleAmountStr);
    if (amountCents <= 0) return;

    const isOwedToUser = contactSummary.netBalanceCents > 0;
    const actionType: 'collect' | 'pay' = isOwedToUser ? 'collect' : 'pay';

    const performSettle = () => {
      settlePersonBalance(
        contactSummary.contactName,
        contactSummary.contactPhone,
        amountCents,
        actionType,
        selectedAccountId
      );
      triggerHaptic('success');
      setIsSettleBalanceOpen(false);
      showAlert({
        type: 'success',
        title: 'Balance Updated',
        message: `Recorded ${isOwedToUser ? 'collection' : 'repayment'} of ${formatCurrency(amountCents, settings.default_currency)} with ${contactSummary.contactName}.`,
      });
    };

    if (hasLockConfigured) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize Settlement',
        subtitle: `Enter your PIN to record balance adjustment with ${contactSummary.contactName}.`,
        actionType: 'primary',
        onSuccess: performSettle,
      });
    } else {
      performSettle();
    }
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic('medium');
    showAlert({
      type: 'danger',
      title: 'Remove Record?',
      message: 'Are you sure you want to delete this debt/settlement entry?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (hasLockConfigured) {
              setPinModalConfig({
                visible: true,
                title: 'Authorize Deletion',
                subtitle: 'Enter your PIN to remove this record.',
                actionType: 'destructive',
                onSuccess: () => {
                  deleteTransaction(id);
                  triggerHaptic('success');
                },
              });
            } else {
              deleteTransaction(id);
              triggerHaptic('success');
            }
          },
        },
      ],
    });
  };

  if (!contactSummary) return null;

  const netCents = contactSummary.netBalanceCents;
  const isNetOwedToUser = netCents > 0;
  const isNetOwedByUser = netCents < 0;
  const isNetSettled = netCents === 0;

  const netColor = isNetOwedToUser ? '#10B981' : isNetOwedByUser ? '#F59E0B' : colors.textMuted;
  const netBgColor = isNetOwedToUser ? '#D1FAE5' : isNetOwedByUser ? '#FEF3C7' : colors.surfaceSubtle;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              paddingTop: Math.max(insets.top, 14),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: netBgColor }]}>
                <Text style={[styles.avatarText, { color: netColor }]}>
                  {getInitials(contactSummary.contactName)}
                </Text>
              </View>
              <View>
                <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                  {contactSummary.contactName}
                </Text>
                {contactSummary.contactPhone ? (
                  <View style={styles.phoneRow}>
                    <Phone size={12} color={colors.textMuted} />
                    <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                      {contactSummary.contactPhone}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.contactPhone, { color: colors.textSubtle }]}>
                    No phone linked
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => onOpenMessageModal(contactSummary)}
                style={[styles.iconBtn, { backgroundColor: colors.accentLight }]}
                accessibilityLabel="Send reminder via WhatsApp or SMS"
              >
                <MessageSquare size={17} color={colors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.iconBtn, { backgroundColor: colors.surfaceSubtle }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={17} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Consolidated Net Banner */}
          <View style={[styles.netBanner, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.netBannerLabel, { color: colors.textMuted }]}>
                CONSOLIDATED NET BALANCE
              </Text>
              <Text style={[styles.netBannerAmount, { color: netColor }]}>
                {isNetOwedToUser
                  ? `+${formatCurrency(netCents, settings.default_currency)}`
                  : isNetOwedByUser
                  ? `-${formatCurrency(Math.abs(netCents), settings.default_currency)}`
                  : `${formatCurrency(0, settings.default_currency)}`}
              </Text>
              <Text style={[styles.netBannerStatus, { color: netColor }]}>
                {isNetOwedToUser
                  ? 'Owed to You (Receivable)'
                  : isNetOwedByUser
                  ? 'You Owe (Payable)'
                  : 'All Accounts Fully Settled'}
              </Text>
            </View>

            {/* Quick Settle Button if not zero */}
            {!isNetSettled && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenPersonSettle}
                style={[styles.settleBannerBtn, { backgroundColor: colors.accent }]}
              >
                <CheckCheck size={16} color={colors.onAccent} />
                <Text style={[styles.settleBannerBtnText, { color: colors.onAccent }]}>
                  Settle
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Row: + Lend More, + Borrow More */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onOpenAddModal('lend', contactSummary.contactName, contactSummary.contactPhone);
              }}
              style={[styles.lendBtn, { backgroundColor: '#10B981' }]}
            >
              <ArrowUpRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.actionBtnText}>+ Lend More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onOpenAddModal('borrow', contactSummary.contactName, contactSummary.contactPhone);
              }}
              style={[styles.borrowBtn, { backgroundColor: '#F59E0B' }]}
            >
              <ArrowDownLeft size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.actionBtnText}>+ Borrow More</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Section Title */}
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>
              TRANSACTION HISTORY ({sortedTransactions.length})
            </Text>
          </View>

          {/* Chronological Passbook Timeline */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.timelineList}
          >
            {sortedTransactions.map((tx) => {
              const isLend = tx.transaction_type === 'lend';
              const isBorrow = tx.transaction_type === 'borrow';
              const isSettlement = Boolean(tx.is_settlement);
              const isSettled = Boolean(tx.is_settled);

              const wallet = accountMap.get(tx.account_id);
              const walletName = wallet?.name || 'Wallet';

              let badgeText = 'Lent';
              let badgeColor = '#10B981';
              let badgeBg = '#D1FAE5';
              let sign = '+';

              if (isBorrow) {
                badgeText = 'Borrowed';
                badgeColor = '#F59E0B';
                badgeBg = '#FEF3C7';
                sign = '-';
              } else if (isSettlement) {
                badgeText = tx.transaction_type === 'income' ? 'Collected' : 'Repaid';
                badgeColor = '#0284C7';
                badgeBg = '#E0F2FE';
                sign = tx.transaction_type === 'income' ? '+' : '-';
              }

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txCard,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                      opacity: isSettled ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={styles.txCardTop}>
                    <View style={styles.txLeftMeta}>
                      <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.badgePillText, { color: badgeColor }]}>
                          {badgeText}
                        </Text>
                      </View>
                      <View style={styles.dateWrap}>
                        <Calendar size={12} color={colors.textMuted} />
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                          {tx.transaction_date}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.txAmount, { color: isSettled ? colors.textMuted : badgeColor }]}>
                      {`${sign}${formatCurrency(tx.amount, wallet?.currency || settings.default_currency)}`}
                    </Text>
                  </View>

                  <View style={styles.txCardMid}>
                    <View style={styles.walletMeta}>
                      <Wallet size={12} color={colors.textMuted} />
                      <Text style={[styles.walletNameText, { color: colors.textMuted }]}>
                        {walletName}
                      </Text>
                    </View>

                    {isSettled ? (
                      <View style={styles.settledTag}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.settledTagText}>
                          Settled {tx.settled_at ? `on ${tx.settled_at}` : ''}
                        </Text>
                      </View>
                    ) : tx.due_date ? (
                      <View style={styles.dueTag}>
                        <Clock size={12} color="#F59E0B" />
                        <Text style={styles.dueTagText}>Due {tx.due_date}</Text>
                      </View>
                    ) : null}
                  </View>

                  {tx.notes ? (
                    <Text style={[styles.notesText, { color: colors.text }]} numberOfLines={2}>
                      {tx.notes}
                    </Text>
                  ) : null}

                  {/* Individual Settle / Action Footer if active debt */}
                  {!isSettled && !isSettlement && (
                    <View style={[styles.txCardFooter, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenSingleSettle(tx)}
                        style={[styles.singleSettleBtn, { backgroundColor: colors.accentLight }]}
                      >
                        <Check size={13} color={colors.accent} strokeWidth={2.5} />
                        <Text style={[styles.singleSettleBtnText, { color: colors.accent }]}>
                          Settle This Record
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDeleteItem(tx.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Settle Single Record Sheet */}
          <Modal
            visible={Boolean(settlingDebt)}
            animationType="fade"
            transparent
            onRequestClose={() => setSettlingDebt(null)}
          >
            <View style={styles.subModalOverlay}>
              <View style={[styles.subModalCard, { backgroundColor: colors.surface }]}>
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Settle Record
                  </Text>
                  <TouchableOpacity onPress={() => setSettlingDebt(null)}>
                    <X size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.subModalSubtitle, { color: colors.textMuted }]}>
                  {settlingDebt?.transaction_type === 'borrow'
                    ? `Pay back ${contactSummary.contactName}. Select wallet and amount:`
                    : `Collect repayment from ${contactSummary.contactName}. Select wallet and amount:`}
                </Text>

                {/* Amount display */}
                <AmountDisplay
                  value={settleAmountStr}
                  currencySymbol={currencySymbol}
                  placeholder="0.00"
                  isFocused={true}
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    marginVertical: 10,
                  }}
                />

                {/* Wallet picker */}
                <Text style={[styles.walletPickerLabel, { color: colors.textMuted }]}>
                  {settlingDebt?.transaction_type === 'borrow' ? 'PAY FROM WALLET' : 'DEPOSIT TO WALLET'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletPickerRow}>
                  {userAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => {
                          triggerHaptic('selection');
                          setSelectedAccountId(acc.id);
                        }}
                        style={[
                          styles.walletChip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.walletChipText, { color: isSelected ? colors.onAccent : colors.text }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Confirm button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleConfirmSingleSettle}
                  style={[styles.confirmSettleBtn, { backgroundColor: colors.accent }]}
                >
                  <Check size={16} color={colors.onAccent} strokeWidth={2.5} />
                  <Text style={[styles.confirmSettleBtnText, { color: colors.onAccent }]}>
                    Confirm Settlement
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Settle Entire Balance Sheet */}
          <Modal
            visible={isSettleBalanceOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setIsSettleBalanceOpen(false)}
          >
            <View style={styles.subModalOverlay}>
              <View style={[styles.subModalCard, { backgroundColor: colors.surface }]}>
                <View style={styles.subModalHeader}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Settle Balance with {contactSummary.contactName}
                  </Text>
                  <TouchableOpacity onPress={() => setIsSettleBalanceOpen(false)}>
                    <X size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.subModalSubtitle, { color: colors.textMuted }]}>
                  {isNetOwedToUser
                    ? `Collect funds from ${contactSummary.contactName}. You can settle in full or enter partial amount:`
                    : `Repay ${contactSummary.contactName}. You can settle in full or enter partial amount:`}
                </Text>

                {/* Amount display */}
                <AmountDisplay
                  value={settleAmountStr}
                  currencySymbol={currencySymbol}
                  placeholder="0.00"
                  isFocused={true}
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    marginVertical: 10,
                  }}
                />

                {/* Wallet picker */}
                <Text style={[styles.walletPickerLabel, { color: colors.textMuted }]}>
                  {isNetOwedToUser ? 'DEPOSIT TO WALLET' : 'PAY FROM WALLET'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletPickerRow}>
                  {userAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => {
                          triggerHaptic('selection');
                          setSelectedAccountId(acc.id);
                        }}
                        style={[
                          styles.walletChip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.walletChipText, { color: isSelected ? colors.onAccent : colors.text }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Confirm button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleConfirmPersonSettle}
                  style={[styles.confirmSettleBtn, { backgroundColor: colors.accent }]}
                >
                  <Check size={16} color={colors.onAccent} strokeWidth={2.5} />
                  <Text style={[styles.confirmSettleBtnText, { color: colors.onAccent }]}>
                    Confirm &amp; Adjust Wallets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* PIN Verification Modal */}
          <PinVerificationModal
            visible={pinModalConfig.visible}
            title={pinModalConfig.title}
            subtitle={pinModalConfig.subtitle}
            actionType={pinModalConfig.actionType}
            onSuccess={pinModalConfig.onSuccess}
            onClose={() => setPinModalConfig((prev) => ({ ...prev, visible: false }))}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 17,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  netBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  netBannerAmount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  netBannerStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  settleBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  settleBannerBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  lendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 14,
  },
  borrowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineHeader: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timelineList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  txCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  txCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txCardMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  walletMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletNameText: {
    fontSize: 11,
    fontWeight: '600',
  },
  settledTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settledTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  dueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  notesText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 16,
  },
  txCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  singleSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  singleSettleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subModalCard: {
    borderRadius: 24,
    padding: 20,
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  subModalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 16,
  },
  walletPickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 6,
  },
  walletPickerRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  walletChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  walletChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
    marginTop: 4,
  },
  confirmSettleBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
