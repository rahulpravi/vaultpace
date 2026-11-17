import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore, formatCurrency, getCurrencySymbol } from '../store/useStore';
import { Transaction, ContactDebtSummary, RootStackParamList } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { ContactLedgerModal } from '../components/domain/ContactLedgerModal';
import { DebtMessageModal, DebtMessageConfig } from '../components/domain/DebtMessageModal';
import { cleanPhoneNumber } from '../utils/debtMessaging';
import { triggerHaptic } from '../utils/haptics';
import {
  ArrowLeft,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Search,
  MessageSquare,
  ChevronRight,
  Phone,
  CheckCheck,
  BookUser,
} from 'lucide-react-native';

type DebtsScreenProps = NativeStackScreenProps<RootStackParamList, 'Debts'>;

type FilterTab = 'all' | 'lent' | 'borrowed' | 'settled';

export const DebtsScreen: React.FC<DebtsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const transactions = useStore((s) => s.transactions);
  const settings = useStore((s) => s.settings);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerContact, setSelectedLedgerContact] = useState<ContactDebtSummary | null>(null);
  const [messageModalConfig, setMessageModalConfig] = useState<DebtMessageConfig | null>(null);

  // Add transaction modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'borrow' | 'lend'>('lend');
  const [addModalContactName, setAddModalContactName] = useState<string>('');
  const [addModalContactPhone, setAddModalContactPhone] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currencySymbol = getCurrencySymbol(settings.default_currency);

  // Consolidate debts and settlements into per-contact summaries
  const contactDebtSummaries: ContactDebtSummary[] = useMemo(() => {
    const map = new Map<string, ContactDebtSummary>();

    for (const t of transactions) {
      if (
        t.transaction_type !== 'borrow' &&
        t.transaction_type !== 'lend' &&
        !(t.is_settlement && (t.contact_name || t.contact_phone))
      ) {
        continue;
      }

      const name = (t.contact_name || 'Anonymous Contact').trim();
      const phone = t.contact_phone?.trim() || '';
      const normName = name.toLowerCase();
      // Grouping key: normalize by clean phone if present, or by lowercase trimmed name
      const key = phone ? `phone:${cleanPhoneNumber(phone)}` : `name:${normName}`;

      if (!map.has(key)) {
        map.set(key, {
          contactKey: key,
          contactName: name,
          contactPhone: phone || undefined,
          totalLentCents: 0,
          totalBorrowedCents: 0,
          netBalanceCents: 0,
          activeDebtsCount: 0,
          settledDebtsCount: 0,
          transactions: [],
          hasOverdue: false,
          hasDueSoon: false,
          nearestDueDate: undefined,
        });
      }

      const summary = map.get(key)!;
      if (!summary.contactPhone && phone) {
        summary.contactPhone = phone;
      }
      if (name !== 'Anonymous Contact' && summary.contactName === 'Anonymous Contact') {
        summary.contactName = name;
      }

      summary.transactions.push(t);

      if (t.transaction_type === 'lend') {
        if (!t.is_settled) {
          summary.totalLentCents += t.amount;
          summary.activeDebtsCount++;
          if (t.due_date) {
            if (t.due_date < todayStr) {
              summary.hasOverdue = true;
            } else if (
              new Date(t.due_date).getTime() - new Date(todayStr).getTime() <=
              3 * 86400000
            ) {
              summary.hasDueSoon = true;
            }
            if (!summary.nearestDueDate || t.due_date < summary.nearestDueDate) {
              summary.nearestDueDate = t.due_date;
            }
          }
        } else {
          summary.settledDebtsCount++;
        }
      } else if (t.transaction_type === 'borrow') {
        if (!t.is_settled) {
          summary.totalBorrowedCents += t.amount;
          summary.activeDebtsCount++;
          if (t.due_date) {
            if (t.due_date < todayStr) {
              summary.hasOverdue = true;
            } else if (
              new Date(t.due_date).getTime() - new Date(todayStr).getTime() <=
              3 * 86400000
            ) {
              summary.hasDueSoon = true;
            }
            if (!summary.nearestDueDate || t.due_date < summary.nearestDueDate) {
              summary.nearestDueDate = t.due_date;
            }
          }
        } else {
          summary.settledDebtsCount++;
        }
      }
    }

    const list: ContactDebtSummary[] = [];
    map.forEach((summary) => {
      summary.netBalanceCents = summary.totalLentCents - summary.totalBorrowedCents;
      list.push(summary);
    });

    // Priority ordering: overdue first, then active debts, then largest magnitude
    list.sort((a, b) => {
      if (a.hasOverdue && !b.hasOverdue) return -1;
      if (!a.hasOverdue && b.hasOverdue) return 1;
      if (a.activeDebtsCount > 0 && b.activeDebtsCount === 0) return -1;
      if (a.activeDebtsCount === 0 && b.activeDebtsCount > 0) return 1;
      return Math.abs(b.netBalanceCents) - Math.abs(a.netBalanceCents);
    });

    return list;
  }, [transactions, todayStr]);

  // Keep currently open contact ledger updated if transactions mutate
  const currentOpenSummary = useMemo(() => {
    if (!selectedLedgerContact) return null;
    return (
      contactDebtSummaries.find((c) => c.contactKey === selectedLedgerContact.contactKey) ||
      selectedLedgerContact
    );
  }, [contactDebtSummaries, selectedLedgerContact]);

  // Top Aggregated Metrics
  const { totalLentCents, totalBorrowedCents, netDebtCents, activeDebtsCount } = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let activeCount = 0;

    for (const s of contactDebtSummaries) {
      lent += s.totalLentCents;
      borrowed += s.totalBorrowedCents;
      activeCount += s.activeDebtsCount;
    }

    return {
      totalLentCents: lent,
      totalBorrowedCents: borrowed,
      netDebtCents: lent - borrowed,
      activeDebtsCount: activeCount,
    };
  }, [contactDebtSummaries]);

  // Filtered contacts based on active tab & search query
  const filteredContacts = useMemo(() => {
    let result = contactDebtSummaries;

    if (activeTab === 'lent') {
      result = result.filter((c) => c.netBalanceCents > 0);
    } else if (activeTab === 'borrowed') {
      result = result.filter((c) => c.netBalanceCents < 0);
    } else if (activeTab === 'settled') {
      result = result.filter((c) => c.netBalanceCents === 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          (c.contactPhone && c.contactPhone.toLowerCase().includes(q))
      );
    }

    return result;
  }, [contactDebtSummaries, activeTab, searchQuery]);

  // Open Message / Reminder modal for a contact
  const handleOpenReminder = useCallback(
    (summary: ContactDebtSummary, e?: any) => {
      e?.stopPropagation?.();
      triggerHaptic('light');

      const isOwed = summary.netBalanceCents > 0;
      const formattedNet = formatCurrency(Math.abs(summary.netBalanceCents), settings.default_currency);

      setMessageModalConfig({
        visible: true,
        contactName: summary.contactName,
        contactPhone: summary.contactPhone,
        messageType: isOwed ? 'reminder' : summary.netBalanceCents === 0 ? 'settled' : 'reminder',
        currencySymbol,
        netAmountFormatted: formattedNet,
        dueDate: summary.nearestDueDate,
      });
    },
    [currencySymbol, settings.default_currency]
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || 'C').toUpperCase();
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
            {contactDebtSummaries.length} contacts • {activeDebtsCount} active records
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setAddModalType('lend');
            setAddModalContactName('');
            setAddModalContactPhone('');
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
            {`${netDebtCents >= 0 ? '+' : ''}${formatCurrency(
              netDebtCents,
              settings.default_currency
            )}`}
          </Text>
        </View>

        {/* Quick Action Buttons for Borrow / Lend */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setAddModalType('lend');
              setAddModalContactName('');
              setAddModalContactPhone('');
              setIsAddModalOpen(true);
            }}
            style={[
              styles.quickActionButton,
              { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
            ]}
          >
            <ArrowUpRight size={15} color="#059669" />
            <Text style={[styles.quickActionText, { color: '#065F46' }]}>+ Record Lent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setAddModalType('borrow');
              setAddModalContactName('');
              setAddModalContactPhone('');
              setIsAddModalOpen(true);
            }}
            style={[
              styles.quickActionButton,
              { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
            ]}
          >
            <ArrowDownLeft size={15} color="#D97706" />
            <Text style={[styles.quickActionText, { color: '#92400E' }]}>+ Record Borrowed</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by contact name or phone..."
            placeholderTextColor={colors.textMuted + '80'}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('all');
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeTab === 'all' ? colors.accent : colors.surface,
                borderColor: activeTab === 'all' ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeTab === 'all' ? colors.onAccent : colors.text },
              ]}
            >
              All People ({contactDebtSummaries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
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
              triggerHaptic('selection');
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
              triggerHaptic('selection');
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

        {/* Grouped Person Cards List */}
        {filteredContacts.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <BookUser size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No contacts found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery.trim()
                ? `No contacts matching "${searchQuery}".`
                : activeTab === 'settled'
                ? 'No settled contacts yet.'
                : 'No borrowed or lent records matching this filter.'}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact) => {
            const initials = getInitials(contact.contactName);
            const net = contact.netBalanceCents;
            const isOwed = net > 0;
            const isOwing = net < 0;
            const isSettled = net === 0;

            const netColor = isOwed ? '#059669' : isOwing ? '#D97706' : colors.textMuted;
            const avatarBg = isOwed ? '#D1FAE5' : isOwing ? '#FEF3C7' : colors.surfaceSubtle;
            const avatarText = isOwed ? '#059669' : isOwing ? '#D97706' : colors.textMuted;

            const formattedNet = `${isOwed ? '+' : isOwing ? '-' : ''}${formatCurrency(
              Math.abs(net),
              settings.default_currency
            )}`;

            return (
              <TouchableOpacity
                key={contact.contactKey}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedLedgerContact(contact);
                }}
                style={[
                  styles.contactCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Top Row: Avatar + Name + Net Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.contactInfoCol}>
                    <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
                      <Text style={[styles.avatarText, { color: avatarText }]}>{initials}</Text>
                    </View>

                    <View style={styles.nameWrap}>
                      <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                        {contact.contactName}
                      </Text>
                      <View style={styles.contactMetaRow}>
                        {contact.contactPhone ? (
                          <View style={styles.phoneBadge}>
                            <Phone size={10} color={colors.textMuted} />
                            <Text style={[styles.phoneBadgeText, { color: colors.textMuted }]}>
                              {contact.contactPhone}
                            </Text>
                          </View>
                        ) : null}
                        <Text style={[styles.txCountBadge, { color: colors.textMuted }]}>
                          {contact.transactions.length}{' '}
                          {contact.transactions.length === 1 ? 'entry' : 'entries'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </View>

                {/* Net Balance Banner */}
                <View
                  style={[
                    styles.netBalanceRow,
                    {
                      backgroundColor: isOwed
                        ? '#ECFDF5'
                        : isOwing
                        ? '#FFFBEB'
                        : colors.surfaceSubtle,
                      borderColor: isOwed ? '#A7F3D0' : isOwing ? '#FDE68A' : colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.netBalanceLabel, { color: netColor }]}>
                      {isOwed ? 'OWED TO YOU' : isOwing ? 'YOU OWE' : 'BALANCE'}
                    </Text>
                    <Text style={[styles.netBalanceAmount, { color: netColor }]}>
                      {isSettled ? `Settled (${formattedNet})` : `${formattedNet}`}
                    </Text>
                  </View>

                  {/* Overdue / Due Soon Alert Tag */}
                  {contact.hasOverdue && (
                    <View style={[styles.overdueBadge, { backgroundColor: '#FEE2E2' }]}>
                      <AlertTriangle size={11} color="#DC2626" />
                      <Text style={[styles.overdueBadgeText, { color: "#DC2626" }]}>OVERDUE</Text>
                    </View>
                  )}
                  {!contact.hasOverdue && contact.nearestDueDate && (
                    <View style={[styles.dueSoonBadge, { backgroundColor: colors.surfaceSubtle }]}>
                      <Clock size={11} color={colors.textMuted} />
                      <Text style={[styles.dueSoonBadgeText, { color: colors.textMuted }]}>
                        Due {contact.nearestDueDate}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Actions: Quick Message/Reminder button & Passbook trigger */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={(e) => handleOpenReminder(contact, e)}
                    style={[
                      styles.reminderBtn,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <MessageSquare size={13} color="#059669" />
                    <Text style={[styles.reminderBtnText, { color: colors.text }]}>
                      {isOwed ? 'Send Reminder' : isSettled ? 'Send Receipt' : 'Send Message'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedLedgerContact(contact);
                    }}
                    style={styles.openLedgerBtn}
                  >
                    <Text style={[styles.openLedgerBtnText, { color: colors.accent }]}>
                      View Ledger →
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Per-Person Passbook Ledger Modal (Khata View) */}
      <ContactLedgerModal
        visible={Boolean(selectedLedgerContact)}
        contactSummary={currentOpenSummary}
        onClose={() => setSelectedLedgerContact(null)}
        onOpenAddModal={(type, name, phone) => {
          setSelectedLedgerContact(null);
          setAddModalType(type);
          setAddModalContactName(name);
          setAddModalContactPhone(phone || '');
          setIsAddModalOpen(true);
        }}
        onOpenMessageModal={(summary) => {
          handleOpenReminder(summary);
        }}
      />

      {/* WhatsApp / SMS Reminder & Notification Modal */}
      {messageModalConfig && (
        <DebtMessageModal
          config={messageModalConfig}
          onClose={() => setMessageModalConfig(null)}
        />
      )}

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={addModalType}
        initialContactName={addModalContactName}
        initialContactPhone={addModalContactPhone}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalContactName('');
          setAddModalContactPhone('');
        }}
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
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryFootnote: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  netDebtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
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
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  contactCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  nameWrap: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  txCountBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  netBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  netBalanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  netBalanceAmount: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dueSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  reminderBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  openLedgerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  openLedgerBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
