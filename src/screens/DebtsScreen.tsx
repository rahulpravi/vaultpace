import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
} from 'react-native';
import { showAlert } from '../store/useAlertStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency } from '../store/useStore';
import { Transaction, RootStackParamList } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  X,
  Wallet,
  Calendar,
  CheckCheck,
} from 'lucide-react-native';

type DebtsScreenProps = NativeStackScreenProps<RootStackParamList, 'Debts'>;

type FilterTab = 'all_active' | 'lent' | 'borrowed' | 'settled';

export const DebtsScreen: React.FC<DebtsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { transactions, accounts, settings, settleDebt, deleteTransaction } = useStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all_active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'borrow' | 'lend'>('lend');

  // Settlement dialog state
  const [settlementTargetDebt, setSettlementTargetDebt] = useState<Transaction | null>(null);
  const [selectedSettlementAccountId, setSelectedSettlementAccountId] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter only user accounts
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

  // All debt transactions
  const allDebts = useMemo(
    () =>
      transactions.filter(
        (t) => t.transaction_type === 'borrow' || t.transaction_type === 'lend'
      ),
    [transactions]
  );

  // Aggregated metrics
  const { totalLentCents, totalBorrowedCents, netDebtCents, activeDebtsCount } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let activeCount = 0;

    for (const d of allDebts) {
      if (!d.is_settled) {
        activeCount++;
        if (d.transaction_type === 'lend') {
          lent += d.amount;
        } else if (d.transaction_type === 'borrow') {
          borrowed += d.amount;
        }
      }
    }

    return {
      totalLentCents: lent,
      totalBorrowedCents: borrowed,
      netDebtCents: lent - borrowed,
      activeDebtsCount: activeCount,
    };
  }, [allDebts]);

  // Filtered debts based on active tab
  const displayedDebts = useMemo(() => {
    return allDebts.filter((d) => {
      if (activeTab === 'all_active') return !d.is_settled;
      if (activeTab === 'lent') return !d.is_settled && d.transaction_type === 'lend';
      if (activeTab === 'borrowed') return !d.is_settled && d.transaction_type === 'borrow';
      if (activeTab === 'settled') return Boolean(d.is_settled);
      return true;
    });
  }, [allDebts, activeTab]);

  const handleOpenSettlement = (debt: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSettlementTargetDebt(debt);
    setSelectedSettlementAccountId(userAccounts[0]?.id || debt.account_id);
  };

  const handleConfirmSettlement = () => {
    if (!settlementTargetDebt || !selectedSettlementAccountId) return;

    settleDebt(settlementTargetDebt.id, selectedSettlementAccountId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const contact = settlementTargetDebt.contact_name || 'Contact';
    const isBorrow = settlementTargetDebt.transaction_type === 'borrow';

    showAlert({
      type: 'success',
      title: 'Debt Settled',
      message: isBorrow
        ? `Marked repayment to ${contact} as completed. Wallet balance updated.`
        : `Marked debt collection from ${contact} as completed. Wallet balance updated.`,
    });

    setSettlementTargetDebt(null);
  };

  const handleDeleteDebt = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert({
      type: 'danger',
      title: 'Remove Record',
      message: `Are you sure you want to remove this debt record for "${name}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    });
  };

  const formatDueDateDisplay = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const isOverdue = dueDateStr < todayStr;
    const isDueSoon =
      !isOverdue &&
      new Date(dueDateStr).getTime() - new Date(todayStr).getTime() <= 3 * 86400000;

    return {
      text: dueDateStr,
      isOverdue,
      isDueSoon,
    };
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Debts & IOUs</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {activeDebtsCount} active • Loan & credit tracking
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAddModalType('lend');
            setIsAddModalOpen(true);
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
        {/* Top Summary Cards */}
        <View style={styles.summaryContainer}>
          {/* Lent Card (Asset / Owed to You) */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIconBox, { backgroundColor: '#D1FAE5' }]}>
                <ArrowDownLeft size={16} color="#059669" />
              </View>
              <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>
                OWED TO YOU
              </Text>
            </View>
            <Text style={[styles.summaryAmount, { color: '#059669' }]}>
              {formatCurrency(totalLentCents, settings.default_currency)}
            </Text>
            <Text style={[styles.summaryFootnote, { color: colors.textMuted }]}>
              Money you lent out
            </Text>
          </View>

          {/* Borrowed Card (Liability / You Owe) */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIconBox, { backgroundColor: '#FEF3C7' }]}>
                <ArrowUpRight size={16} color="#D97706" />
              </View>
              <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>
                YOU OWE
              </Text>
            </View>
            <Text style={[styles.summaryAmount, { color: '#D97706' }]}>
              {formatCurrency(totalBorrowedCents, settings.default_currency)}
            </Text>
            <Text style={[styles.summaryFootnote, { color: colors.textMuted }]}>
              Money you borrowed
            </Text>
          </View>
        </View>

        {/* Net Debt Bar */}
        <View
          style={[
            styles.netDebtBanner,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <View style={styles.netDebtLeft}>
            <Coins size={18} color={colors.accent} />
            <Text style={[styles.netDebtTitle, { color: colors.text }]}>Net IOU Position:</Text>
          </View>
          <Text
            style={[
              styles.netDebtValue,
              { color: netDebtCents >= 0 ? '#059669' : colors.danger },
            ]}
          >
            {netDebtCents >= 0 ? '+' : ''}
            {formatCurrency(netDebtCents, settings.default_currency)}
          </Text>
        </View>

        {/* Quick Action Buttons for Borrow / Lend */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAddModalType('lend');
              setIsAddModalOpen(true);
            }}
            style={[styles.quickActionButton, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
          >
            <ArrowUpRight size={15} color="#059669" />
            <Text style={[styles.quickActionText, { color: '#065F46' }]}>+ Record Lent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAddModalType('borrow');
              setIsAddModalOpen(true);
            }}
            style={[styles.quickActionButton, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
          >
            <ArrowDownLeft size={15} color="#D97706" />
            <Text style={[styles.quickActionText, { color: '#92400E' }]}>+ Record Borrowed</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('all_active');
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeTab === 'all_active' ? colors.accent : colors.surface,
                borderColor: activeTab === 'all_active' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeTab === 'all_active' ? colors.onAccent : colors.text },
              ]}
            >
              All Active ({activeDebtsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('lent');
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeTab === 'lent' ? colors.accent : colors.surface,
                borderColor: activeTab === 'lent' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeTab === 'lent' ? colors.onAccent : colors.text },
              ]}
            >
              Owed to You
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('borrowed');
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeTab === 'borrowed' ? colors.accent : colors.surface,
                borderColor: activeTab === 'borrowed' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeTab === 'borrowed' ? colors.onAccent : colors.text },
              ]}
            >
              You Owe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('settled');
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeTab === 'settled' ? colors.accent : colors.surface,
                borderColor: activeTab === 'settled' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeTab === 'settled' ? colors.onAccent : colors.text },
              ]}
            >
              Settled History
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Debt Cards List */}
        {displayedDebts.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Coins size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No records found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {activeTab === 'settled'
                ? 'No debts have been marked as settled yet.'
                : 'No active borrowed or lent transactions matching this filter.'}
            </Text>
          </View>
        ) : (
          displayedDebts.map((debt) => {
            const isBorrow = debt.transaction_type === 'borrow';
            const account = userAccounts.find((a) => a.id === debt.account_id);
            const settlementAccount = debt.settled_account_id
              ? userAccounts.find((a) => a.id === debt.settled_account_id)
              : null;
            const dueInfo = formatDueDateDisplay(debt.due_date);
            const contactName = debt.contact_name || 'Anonymous Contact';
            const initials = contactName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <View
                key={debt.id}
                style={[
                  styles.debtCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Top Row: Contact + Type Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.contactLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: isBorrow ? '#FEF3C7' : '#D1FAE5',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: isBorrow ? '#D97706' : '#059669' },
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.contactName, { color: colors.text }]}>
                        {contactName}
                      </Text>
                      <Text style={[styles.debtDate, { color: colors.textMuted }]}>
                        Recorded on {debt.transaction_date}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: isBorrow ? '#FEF3C7' : '#D1FAE5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isBorrow ? '#D97706' : '#059669' },
                      ]}
                    >
                      {isBorrow ? 'YOU BORROWED' : 'YOU LENT'}
                    </Text>
                  </View>
                </View>

                {/* Amount and Due Date Row */}
                <View style={styles.amountRow}>
                  <View>
                    <Text style={[styles.amountLabel, { color: colors.textMuted }]}>AMOUNT</Text>
                    <Text
                      style={[
                        styles.debtAmount,
                        { color: isBorrow ? '#D97706' : '#059669' },
                      ]}
                    >
                      {formatCurrency(debt.amount, account?.currency || settings.default_currency)}
                    </Text>
                  </View>

                  {/* Due Date Badge */}
                  {debt.due_date ? (
                    <View style={styles.dueDateWrap}>
                      <Text style={[styles.amountLabel, { color: colors.textMuted }]}>DUE DATE</Text>
                      <View style={styles.dueStatusRow}>
                        <Calendar size={13} color={colors.textMuted} />
                        <Text style={[styles.dueDateText, { color: colors.text }]}>
                          {debt.due_date}
                        </Text>
                      </View>
                      {!debt.is_settled && dueInfo?.isOverdue && (
                        <View style={[styles.overdueBadge, { backgroundColor: colors.dangerLight }]}>
                          <AlertTriangle size={10} color={colors.danger} />
                          <Text style={[styles.overdueText, { color: colors.danger }]}>OVERDUE</Text>
                        </View>
                      )}
                      {!debt.is_settled && dueInfo?.isDueSoon && (
                        <View style={[styles.overdueBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Clock size={10} color="#D97706" />
                          <Text style={[styles.overdueText, { color: '#D97706' }]}>DUE SOON</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.dueDateWrap}>
                      <Text style={[styles.amountLabel, { color: colors.textMuted }]}>DUE DATE</Text>
                      <Text style={[styles.noDueDate, { color: colors.textMuted }]}>
                        No due date set
                      </Text>
                    </View>
                  )}
                </View>

                {/* Notes if available */}
                {debt.notes ? (
                  <View style={[styles.notesBox, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.notesText, { color: colors.textMuted }]}>
                      "{debt.notes}"
                    </Text>
                  </View>
                ) : null}

                {/* Card Footer: Wallet + Settlement Actions */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.walletMeta}>
                    <Wallet size={13} color={colors.textMuted} />
                    <Text style={[styles.walletName, { color: colors.textMuted }]}>
                      {account?.name || 'Wallet'}
                    </Text>
                  </View>

                  {debt.is_settled ? (
                    <View style={styles.settledBadge}>
                      <CheckCheck size={14} color="#059669" />
                      <Text style={styles.settledBadgeText}>
                        Settled {debt.settled_at || ''}{' '}
                        {settlementAccount ? `via ${settlementAccount.name}` : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        onPress={() => handleDeleteDebt(debt.id, contactName)}
                        style={[styles.trashBtn, { borderColor: colors.border }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={15} color={colors.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenSettlement(debt)}
                        style={[styles.settleBtn, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                      >
                        <CheckCircle2 size={15} color={colors.onAccent} />
                        <Text style={[styles.settleBtnText, { color: colors.onAccent }]}>
                          Mark as Settled
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Settlement Wallet Picker Modal */}
      <Modal
        visible={Boolean(settlementTargetDebt)}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettlementTargetDebt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Settle Record</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {settlementTargetDebt?.transaction_type === 'borrow'
                    ? `Repaying ${settlementTargetDebt.contact_name}`
                    : `Collecting from ${settlementTargetDebt?.contact_name}`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSettlementTargetDebt(null)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalAmountPrompt, { color: colors.text }]}>
                Amount:{' '}
                <Text
                  style={{
                    color:
                      settlementTargetDebt?.transaction_type === 'borrow' ? '#D97706' : '#059669',
                    fontWeight: '800',
                  }}
                >
                  {formatCurrency(settlementTargetDebt?.amount || 0, settings.default_currency)}
                </Text>
              </Text>

              <Text style={[styles.selectorLabel, { color: colors.textMuted }]}>
                {settlementTargetDebt?.transaction_type === 'borrow'
                  ? 'Select Wallet to Pay Out of:'
                  : 'Select Wallet to Receive Into:'}
              </Text>

              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {userAccounts.map((acc) => {
                  const isSelected = selectedSettlementAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSettlementAccountId(acc.id);
                      }}
                      style={[
                        styles.walletSelectItem,
                        {
                          backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                          borderColor: isSelected ? colors.accent : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.walletItemLeft}>
                        <View
                          style={[
                            styles.walletDot,
                            { backgroundColor: acc.color || colors.accent },
                          ]}
                        />
                        <View>
                          <Text style={[styles.walletItemName, { color: colors.text }]}>
                            {acc.name}
                          </Text>
                          <Text style={[styles.walletItemType, { color: colors.textMuted }]}>
                            {acc.account_type.toUpperCase()} • Balance:{' '}
                            {formatCurrency(acc.current_balance, acc.currency)}
                          </Text>
                        </View>
                      </View>

                      {isSelected && <Check size={18} color={colors.accent} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={handleConfirmSettlement}
                style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.8}
              >
                <Check size={18} color={colors.onAccent} strokeWidth={2.5} />
                <Text style={[styles.confirmBtnText, { color: colors.onAccent }]}>
                  Confirm & Adjust Wallet Balance
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Movement Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={addModalType}
        onClose={() => setIsAddModalOpen(false)}
      />
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  summaryFootnote: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  netDebtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  netDebtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  netDebtTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  netDebtValue: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  debtCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  debtDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  debtAmount: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  dueDateWrap: {
    alignItems: 'flex-end',
  },
  dueStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noDueDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  overdueText: {
    fontSize: 9,
    fontWeight: '800',
  },
  notesBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  walletMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletName: {
    fontSize: 12,
    fontWeight: '600',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingTop: 16,
  },
  modalAmountPrompt: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  walletSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  walletDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  walletItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletItemType: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
