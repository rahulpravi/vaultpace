import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { Search, X, User, Phone, BookUser, AlertCircle } from 'lucide-react-native';

export interface PickedContact {
  name: string;
  phone?: string;
}

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: PickedContact) => void;
}

interface LocalContact {
  id: string;
  name: string;
  phone?: string;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  visible,
  onClose,
  onSelectContact,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [contactsList, setContactsList] = useState<LocalContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setPermissionDenied(false);

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      if (data && data.length > 0) {
        const cleaned: LocalContact[] = [];
        const seenNames = new Set<string>();

        for (const c of data) {
          const name = c.name?.trim();
          if (!name) continue;

          let primaryPhone = '';
          if (c.phoneNumbers && c.phoneNumbers.length > 0) {
            primaryPhone = c.phoneNumbers[0]?.number?.trim() || '';
          }

          const key = `${name.toLowerCase()}_${primaryPhone}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            cleaned.push({
              id: c.id || `${name}_${cleaned.length}`,
              name,
              phone: primaryPhone || undefined,
            });
          }
        }

        setContactsList(cleaned);
      } else {
        setContactsList([]);
      }
    } catch {
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      loadContacts();
    }
  }, [visible, loadContacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactsList;
    const q = searchQuery.toLowerCase().trim();
    return contactsList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, '')))
    );
  }, [contactsList, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || 'C').toUpperCase();
  };

  const handleSelect = (item: LocalContact) => {
    triggerHaptic('selection');
    onSelectContact({
      name: item.name,
      phone: item.phone,
    });
    onClose();
  };

  const renderItem = useCallback(
    ({ item }: { item: LocalContact }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelect(item)}
        style={[
          styles.contactRow,
          { borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>
            {getInitials(item.name)}
          </Text>
        </View>

        <View style={styles.contactMeta}>
          <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.phone ? (
            <View style={styles.phoneRow}>
              <Phone size={12} color={colors.textMuted} />
              <Text style={[styles.contactPhone, { color: colors.textMuted }]}>
                {item.phone}
              </Text>
            </View>
          ) : (
            <Text style={[styles.contactPhone, { color: colors.textSubtle }]}>
              No phone saved
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [colors]
  );

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
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
                <BookUser size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Select Contact</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {contactsList.length > 0 ? `${contactsList.length} phone contacts` : 'From Address Book'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by contact name or phone..."
                placeholderTextColor={colors.textMuted + '80'}
                style={[styles.searchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textMuted }]}>
                Reading phone contacts...
              </Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.centerState}>
              <View style={[styles.alertIconBox, { backgroundColor: colors.dangerLight }]}>
                <AlertCircle size={28} color={colors.danger} />
              </View>
              <Text style={[styles.stateTitle, { color: colors.text }]}>
                Contacts Permission Required
              </Text>
              <Text style={[styles.stateDesc, { color: colors.textMuted }]}>
                VaultPace needs access to your contacts to let you quickly pick loan counterparties. No contact data ever leaves your device.
              </Text>
              <TouchableOpacity
                onPress={loadContacts}
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.onAccent }]}>
                  Grant Permission
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.centerState}>
              <User size={36} color={colors.textMuted} />
              <Text style={[styles.stateTitle, { color: colors.text, marginTop: 12 }]}>
                No Contacts Found
              </Text>
              <Text style={[styles.stateDesc, { color: colors.textMuted }]}>
                {searchQuery
                  ? `No results matching "${searchQuery}".`
                  : 'Your phone address book is empty or has no contacts.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Footer Manual Fallback */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.manualBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
            >
              <Text style={[styles.manualBtnText, { color: colors.text }]}>
                Enter Name Manually
              </Text>
            </TouchableOpacity>
          </View>
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
    height: '86%',
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
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactMeta: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  alertIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  manualBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
