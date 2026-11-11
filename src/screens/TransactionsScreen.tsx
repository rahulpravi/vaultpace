import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Platform,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore } from '../store/useStore';
import { showAlert } from '../store/useAlertStore';
import { TransactionRow } from '../components/domain/TransactionRow';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { PinVerificationModal } from '../components/security/PinVerificationModal';
import { BottomTabProps } from '../navigation/types';
import { Transaction } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  Search,
  X,
  Calendar,
  Plus,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Wallet,
  Tag,
} from 'lucide-react-native';
import { exportTransactionsToPdf } from '../utils/exportPdf';

export const TransactionsScreen: React.FC<BottomTabProps<'TransactionsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const settings = useStore((s) => s.settings);
  const budgets = useStore((s) => s.budgets);
  const getTotalNetWorthCents = useStore((s) => s.getTotalNetWorthCents);

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

  // Deduplicate categories by trimmed name so "Other" (or any duplicate) only appears once
  const deduplicatedCategories = useMemo(() => {
    const seenNames = new Set<string>();
    const result: typeof categories = [];
    for (const cat of categories) {
      const normName = cat.name.trim().toLowerCase();
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        result.push(cat);
      }
    }
    return result;
  }, [categories]);

  // Search & Active Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null);
  const [selectedCatName, setSelectedCatName] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Modal temporary filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState<string | null>(null);
  const [tempType, setTempType] = useState<string | null>(null);
  const [tempAccId, setTempAccId] = useState<string | null>(null);
  const [tempCatName, setTempCatName] = useState<string | null>(null);

  // Fast O(1) Lookup Maps
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Other Modals & Stable Callbacks
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const hasSecurityLock =
    Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

  const handleEditTransaction = useCallback(
    (item: Transaction) => {
      triggerHaptic('light');
      showAlert({
        type: 'info',
        title: 'Edit Transaction',
        message: 'Do you want to edit this transaction record?',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Edit',
            onPress: () => {
              if (hasSecurityLock) {
                setPinModalConfig({
                  visible: true,
                  title: 'Authorize Edit',
                  subtitle: 'Enter your 4-digit PIN to edit this transaction.',
                  actionType: 'primary',
                  onSuccess: () => {
                    setEditingTransaction(item);
                  },
                });
              } else {
                setEditingTransaction(item);
              }
            },
          },
        ],
      });
    },
    [hasSecurityLock]
  );

  const handleDeleteTransaction = useCallback(
    (id: string) => {
      triggerHaptic('medium');
      showAlert({
        type: 'danger',
        title: 'Delete Record?',
        message: 'This action cannot be undone. Are you sure you want to proceed?',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (hasSecurityLock) {
                setPinModalConfig({
                  visible: true,
                  title: 'Authorize Deletion',
                  subtitle: 'Enter your 4-digit PIN to delete this transaction.',
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
    },
    [deleteTransaction, hasSecurityLock]
  );

  // Available distinct months extracted from all transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const currentMonth = new Date().toISOString().slice(0, 7);
    set.add(currentMonth);
    transactions.forEach((tx) => {
      if (tx.transaction_date && tx.transaction_date.length >= 7) {
        set.add(tx.transaction_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const formatMonth = useCallback((mStr: string) => {
    const [y, m] = mStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  const getTypeLabel = useCallback((t: string | null) => {
    switch (t) {
      case 'expense':
        return 'Expenses';
      case 'income':
        return 'Income';
      case 'transfer':
        return 'Transfers';
      case 'debt':
        return 'Debts / Loans';
      default:
        return 'All Types';
    }
  }, []);

  // Count active modal filters (excluding raw search query)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMonth) count++;
    if (selectedType) count++;
    if (selectedAccId) count++;
    if (selectedCatName) count++;
    return count;
  }, [selectedMonth, selectedType, selectedAccId, selectedCatName]);

  // Count active modal temp filters
  const tempActiveCount = useMemo(() => {
    let count = 0;
    if (tempMonth) count++;
    if (tempType) count++;
    if (tempAccId) count++;
    if (tempCatName) count++;
    return count;
  }, [tempMonth, tempType, tempAccId, tempCatName]);

  const clearAllFilters = useCallback(() => {
    triggerHaptic('light');
    setSearchQuery('');
    setSelectedMonth(null);
    setSelectedType(null);
    setSelectedAccId(null);
    setSelectedCatName(null);
  }, []);

  const openFilterModal = useCallback(() => {
    triggerHaptic('light');
    setTempMonth(selectedMonth);
    setTempType(selectedType);
    setTempAccId(selectedAccId);
    setTempCatName(selectedCatName);
    setIsFilterModalOpen(true);
  }, [selectedMonth, selectedType, selectedAccId, selectedCatName]);

  const applyFilters = useCallback(() => {
    triggerHaptic('medium');
    setSelectedMonth(tempMonth);
    setSelectedType(tempType);
    setSelectedAccId(tempAccId);
    setSelectedCatName(tempCatName);
    setIsFilterModalOpen(false);
  }, [tempMonth, tempType, tempAccId, tempCatName]);

  const resetTempFilters = useCallback(() => {
    triggerHaptic('light');
    setTempMonth(null);
    setTempType(null);
    setTempAccId(null);
    setTempCatName(null);
  }, []);

  const handleExportPdfPress = useCallback(async () => {
    triggerHaptic('light');
    if (!hasSecurityLock) {
      await exportTransactionsToPdf({
        accounts,
        categories,
        budgets,
        transactions,
        settings,
        totalNetWorth: getTotalNetWorthCents(),
      });
      return;
    }
    setPinModalConfig({
      visible: true,
      title: 'Export Audit Ledger',
      subtitle: 'Enter your PIN to export your private financial report.',
      actionType: 'primary',
      onSuccess: async () => {
        await exportTransactionsToPdf({
          accounts,
          categories,
          budgets,
          transactions,
          settings,
          totalNetWorth: getTotalNetWorthCents(),
        });
      },
    });
  }, [
    hasSecurityLock,
    accounts,
    categories,
    budgets,
    transactions,
    settings,
    getTotalNetWorthCents,
  ]);

  // Filtered transactions for main screen
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Month filter
      if (selectedMonth && !tx.transaction_date.startsWith(selectedMonth)) {
        return false;
      }

      // 2. Type filter
      if (selectedType) {
        if (selectedType === 'debt') {
          if (tx.transaction_type !== 'borrow' && tx.transaction_type !== 'lend') return false;
        } else if (tx.transaction_type !== selectedType) {
          return false;
        }
      }

      // 3. Wallet / Account filter
      if (selectedAccId && tx.account_id !== selectedAccId && tx.to_account_id !== selectedAccId) {
        return false;
      }

      // 4. Category filter by name
      if (selectedCatName) {
        const cat = categoryMap.get(tx.category_id || '');
        if (!cat || cat.name.toLowerCase() !== selectedCatName.toLowerCase()) {
          return false;
        }
      }

      // 5. Search query (notes, contact name, category, wallet name, amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoryMap.get(tx.category_id || '');
        const acc = accountMap.get(tx.account_id);
        const toAcc = tx.to_account_id ? accountMap.get(tx.to_account_id) : null;
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesContact = tx.contact_name?.toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAcc =
          acc?.name.toLowerCase().includes(q) || toAcc?.name.toLowerCase().includes(q);
        const matchesAmount = (tx.amount / 100).toFixed(2).includes(q);
        if (!matchesNote && !matchesContact && !matchesCat && !matchesAcc && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }, [
    transactions,
    categoryMap,
    accountMap,
    searchQuery,
    selectedCatName,
    selectedAccId,
    selectedMonth,
    selectedType,
  ]);

  // Dynamic preview match count for the Filter Modal
  const tempMatchCount = useMemo(() => {
    return transactions.filter((tx) => {
      if (tempMonth && !tx.transaction_date.startsWith(tempMonth)) return false;
      if (tempType) {
        if (tempType === 'debt') {
          if (tx.transaction_type !== 'borrow' && tx.transaction_type !== 'lend') return false;
        } else if (tx.transaction_type !== tempType) {
          return false;
        }
      }
      if (tempAccId && tx.account_id !== tempAccId && tx.to_account_id !== tempAccId) return false;
      if (tempCatName) {
        const cat = categoryMap.get(tx.category_id || '');
        if (!cat || cat.name.toLowerCase() !== tempCatName.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categoryMap.get(tx.category_id || '');
        const acc = accountMap.get(tx.account_id);
        const toAcc = tx.to_account_id ? accountMap.get(tx.to_account_id) : null;
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesContact = tx.contact_name?.toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAcc =
          acc?.name.toLowerCase().includes(q) || toAcc?.name.toLowerCase().includes(q);
        const matchesAmount = (tx.amount / 100).toFixed(2).includes(q);
        if (!matchesNote && !matchesContact && !matchesCat && !matchesAcc && !matchesAmount) {
          return false;
        }
      }
      return true;
    }).length;
  }, [
    transactions,
    tempMonth,
    tempType,
    tempAccId,
    tempCatName,
    searchQuery,
    categoryMap,
    accountMap,
  ]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    for (const tx of filtered) {
      const d = tx.transaction_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const formatDateHeader = useCallback((dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    const parsed = new Date(dateStr + 'T00:00:00');
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const keyExtractor = useCallback((item: [string, Transaction[]]) => item[0], []);

  const renderGroupItem = useCallback(
    ({ item: [dateKey, txList] }: { item: [string, Transaction[]] }) => (
      <View style={styles.groupContainer}>
        <View style={styles.dateHeaderRow}>
          <Calendar size={13} color={colors.textMuted} />
          <Text style={[styles.dateHeaderText, { color: colors.textMuted }]}>
            {formatDateHeader(dateKey)}
          </Text>
          <Text style={[styles.dateCountText, { color: colors.textSubtle }]}>
            ({txList.length})
          </Text>
        </View>

        {txList.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            category={categoryMap.get(tx.category_id || '')}
            account={accountMap.get(tx.account_id)}
            onDelete={handleDeleteTransaction}
            onPress={handleEditTransaction}
          />
        ))}
      </View>
    ),
    [
      colors.textMuted,
      colors.textSubtle,
      formatDateHeader,
      categoryMap,
      accountMap,
      handleDeleteTransaction,
      handleEditTransaction,
    ]
  );

  const renderEmptyState = useMemo(
    () => (
      <View
        style={[
          styles.emptyState,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Records Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Try adjusting your search filters or record a new transaction.
        </Text>
      </View>
    ),
    [colors.surface, colors.border, colors.text, colors.textMuted]
  );

  const renderListHeader = useMemo(
    () => (
      <View style={styles.listHeaderWrap}>
        {/* Compact Search & Filter Bar */}
        <View style={styles.searchAndFilterRow}>
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search notes, contact, category, wallet, amount..."
              placeholderTextColor={colors.textMuted + '90'}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={openFilterModal}
            activeOpacity={0.7}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.accentLight : colors.surface,
                borderColor: activeFilterCount > 0 ? colors.accent : colors.border,
              },
            ]}
          >
            <SlidersHorizontal
              size={18}
              color={activeFilterCount > 0 ? colors.accent : colors.text}
              strokeWidth={2.2}
            />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.filterBadgeText, { color: colors.onAccent }]}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Compact Active Filter Pills Row */}
        {activeFilterCount > 0 && (
          <View style={styles.activePillsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activePillsContent}
            >
              {/* Month Pill */}
              {selectedMonth && (
                <View
                  style={[
                    styles.activePill,
                    {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent + '35',
                    },
                  ]}
                >
                  <Calendar size={12} color={colors.accent} />
                  <Text style={[styles.activePillText, { color: colors.accent }]}>
                    {formatMonth(selectedMonth)}
                  </Text>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedMonth(null);
                    }}
                  >
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Type Pill */}
              {selectedType && (
                <View
                  style={[
                    styles.activePill,
                    {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent + '35',
                    },
                  ]}
                >
                  <Layers size={12} color={colors.accent} />
                  <Text style={[styles.activePillText, { color: colors.accent }]}>
                    {getTypeLabel(selectedType)}
                  </Text>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedType(null);
                    }}
                  >
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Wallet Pill */}
              {selectedAccId && (
                <View
                  style={[
                    styles.activePill,
                    {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent + '35',
                    },
                  ]}
                >
                  <Wallet size={12} color={colors.accent} />
                  <Text style={[styles.activePillText, { color: colors.accent }]}>
                    {userAccounts.find((a) => a.id === selectedAccId)?.name || 'Wallet'}
                  </Text>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedAccId(null);
                    }}
                  >
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Category Pill */}
              {selectedCatName && (
                <View
                  style={[
                    styles.activePill,
                    {
                      backgroundColor: colors.accentLight,
                      borderColor: colors.accent + '35',
                    },
                  ]}
                >
                  <Tag size={12} color={colors.accent} />
                  <Text style={[styles.activePillText, { color: colors.accent }]}>
                    {selectedCatName}
                  </Text>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedCatName(null);
                    }}
                  >
                    <X size={12} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Reset All Pill */}
              <TouchableOpacity
                onPress={clearAllFilters}
                style={[
                  styles.resetPill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <RotateCcw size={11} color={colors.textMuted} />
                <Text style={[styles.resetPillText, { color: colors.textMuted }]}>Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    ),
    [
      colors,
      searchQuery,
      activeFilterCount,
      selectedMonth,
      selectedType,
      selectedAccId,
      selectedCatName,
      userAccounts,
      formatMonth,
      getTypeLabel,
      openFilterModal,
      clearAllFilters,
    ]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Title */}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Audit Ledger</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {filtered.length} of {transactions.length} records
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleExportPdfPress}
            style={[
              styles.addBtn,
              { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <FileText size={18} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setIsAddModalOpen(true);
            }}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={18} color={colors.onAccent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groupedTransactions}
        keyExtractor={keyExtractor}
        renderItem={renderGroupItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS !== 'web'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      />

      {/* Collapsible Filter Bottom Sheet / Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setIsFilterModalOpen(false)}
          />
          <View
            style={[
              styles.filterSheetContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                    Filter Records
                  </Text>
                  {tempActiveCount > 0 && (
                    <View style={[styles.modalCountBadge, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.modalCountBadgeText, { color: colors.accent }]}>
                        {tempActiveCount} active
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.modalHeaderSubtitle, { color: colors.textMuted }]}>
                  Narrow down audit ledger by multiple criteria
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Filter Sections ScrollView */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Section 1: Month / Period */}
              {availableMonths.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Calendar size={13} color={colors.accent} />
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                      MONTH / PERIOD
                    </Text>
                  </View>
                  <View style={styles.chipsWrap}>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('selection');
                        setTempMonth(null);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            tempMonth === null ? colors.accent : colors.surfaceSubtle,
                          borderColor: tempMonth === null ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: tempMonth === null ? colors.onAccent : colors.text },
                        ]}
                      >
                        All Months
                      </Text>
                    </TouchableOpacity>
                    {availableMonths.map((m) => {
                      const isSelected = tempMonth === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            triggerHaptic('selection');
                            setTempMonth(isSelected ? null : m);
                          }}
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
                            {formatMonth(m)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Section 2: Transaction Type */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Layers size={13} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    TRANSACTION TYPE
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  {[
                    { id: null, label: 'All Types' },
                    { id: 'expense', label: 'Expenses' },
                    { id: 'income', label: 'Income' },
                    { id: 'transfer', label: 'Transfers' },
                    { id: 'debt', label: 'Debts / Loans' },
                  ].map((item) => {
                    const isSelected = tempType === item.id;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => {
                          triggerHaptic('selection');
                          setTempType(item.id);
                        }}
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
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 3: Wallet / Account */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Wallet size={13} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    WALLET / ACCOUNT
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      setTempAccId(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          tempAccId === null ? colors.accent : colors.surfaceSubtle,
                        borderColor: tempAccId === null ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: tempAccId === null ? colors.onAccent : colors.text },
                      ]}
                    >
                      All Wallets
                    </Text>
                  </TouchableOpacity>
                  {userAccounts.map((a) => {
                    const isSelected = tempAccId === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => {
                          triggerHaptic('selection');
                          setTempAccId(isSelected ? null : a.id);
                        }}
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
                          {a.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 4: Category (Deduplicated) */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Tag size={13} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    CATEGORY
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      setTempCatName(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          tempCatName === null ? colors.accent : colors.surfaceSubtle,
                        borderColor: tempCatName === null ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: tempCatName === null ? colors.onAccent : colors.text },
                      ]}
                    >
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {deduplicatedCategories.map((c) => {
                    const isSelected = tempCatName?.toLowerCase() === c.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c.name}
                        onPress={() => {
                          triggerHaptic('selection');
                          setTempCatName(isSelected ? null : c.name);
                        }}
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
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={resetTempFilters}
                style={[
                  styles.resetBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <RotateCcw size={15} color={colors.text} />
                <Text style={[styles.resetBtnText, { color: colors.text }]}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyFilters}
                style={[styles.applyBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.applyBtnText, { color: colors.onAccent }]}>
                  {tempMatchCount === 0
                    ? 'No Records (Apply)'
                    : `Show ${tempMatchCount} ${tempMatchCount === 1 ? 'Record' : 'Records'}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        visible={Boolean(editingTransaction)}
        initialTransaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />

      {/* Reusable Security PIN Verification Modal */}
      <PinVerificationModal
        visible={pinModalConfig.visible}
        title={pinModalConfig.title}
        subtitle={pinModalConfig.subtitle}
        actionType={pinModalConfig.actionType}
        onSuccess={pinModalConfig.onSuccess}
        onClose={() => setPinModalConfig((prev) => ({ ...prev, visible: false }))}
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
  listHeaderWrap: {
    marginBottom: 4,
  },
  searchAndFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activePillsContainer: {
    marginBottom: 12,
  },
  activePillsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 20,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
  },
  resetPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupContainer: {
    marginBottom: 16,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  filterSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '82%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  modalScrollContent: {
    paddingVertical: 14,
    gap: 18,
  },
  filterSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
