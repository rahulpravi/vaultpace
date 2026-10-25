import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { useStore } from '../store/useStore';
import { TransactionRow } from '../components/domain/TransactionRow';
import { AddTransactionModal } from '../components/domain/AddTransactionModal';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import { Search, X, Calendar, Plus, Filter, FileText } from 'lucide-react-native';
import { exportTransactionsToPdf } from '../utils/exportPdf';

export const TransactionsScreen: React.FC<BottomTabProps<'TransactionsTab'>> = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { transactions, categories, accounts, deleteTransaction, settings, budgets, getTotalNetWorthCents } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedAccId && tx.account_id !== selectedAccId && tx.to_account_id !== selectedAccId) {
        return false;
      }
      if (selectedCatId && tx.category_id !== selectedCatId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === tx.category_id);
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q);
        const matchesAmount = (tx.amount / 100).toFixed(2).includes(q);
        if (!matchesNote && !matchesCat && !matchesAmount) return false;
      }
      return true;
    });
  }, [transactions, categories, searchQuery, selectedCatId, selectedAccId]);

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

  const formatDateHeader = (dateStr: string) => {
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
  };

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
            {filtered.length} of {transactions.length} movements
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await exportTransactionsToPdf({
                accounts,
                categories,
                budgets,
                transactions,
                settings,
                totalNetWorth: getTotalNetWorthCents(),
              });
            }}
            style={[
              styles.addBtn,
              { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <FileText size={18} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAddModalOpen(true);
            }}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={18} color={colors.onAccent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Search Bar */}
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
            placeholder="Search notes, categories, amounts..."
            placeholderTextColor={colors.textMuted + '90'}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Account Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedAccId(null);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedAccId === null ? colors.accent : colors.surface,
                borderColor: selectedAccId === null ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedAccId === null ? colors.onAccent : colors.text },
              ]}
            >
              All Wallets
            </Text>
          </TouchableOpacity>

          {accounts.map((a) => {
            const isSelected = selectedAccId === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedAccId(isSelected ? null : a.id);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? colors.onAccent : colors.text },
                  ]}
                >
                  {a.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCatId(null);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCatId === null ? colors.accent : colors.surface,
                borderColor: selectedCatId === null ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedCatId === null ? colors.onAccent : colors.text },
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const isSelected = selectedCatId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCatId(isSelected ? null : c.id);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? colors.onAccent : colors.text },
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grouped Ledger List */}
        {groupedTransactions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Movements Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Try adjusting your search filters or record a new transaction.
            </Text>
          </View>
        ) : (
          groupedTransactions.map(([dateKey, txList]) => (
            <View key={dateKey} style={styles.groupContainer}>
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
                  category={categories.find((c) => c.id === tx.category_id)}
                  account={accounts.find((a) => a.id === tx.account_id)}
                  onDelete={deleteTransaction}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
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
});
