import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { ACCENT_PALETTES } from '../theme/colors';
import { useStore, formatCurrency } from '../store/useStore';
import { ThemeMode, AccentColor } from '../types';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import {
  Sun,
  Moon,
  Smartphone,
  ShieldCheck,
  Download,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Lock,
  Vibrate,
  Globe,
} from 'lucide-react-native';

export const SettingsScreen: React.FC<BottomTabProps<'SettingsTab'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    settings,
    updateSettings,
    resetToDefaults,
    accounts,
    categories,
    budgets,
    transactions,
  } = useStore();

  const handleExportJSON = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = {
        version: '1.0',
        platform: 'mobile',
        exported_at: new Date().toISOString(),
        accounts,
        categories,
        budgets,
        transactions,
        settings,
      };

      await Share.share({
        title: 'VaultPace Backup',
        message: JSON.stringify(data, null, 2),
      });
    } catch (e) {
      Alert.alert('Export Error', 'Unable to share JSON backup.');
    }
  };

  const handleExportCSV = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let csv = 'ID,Date,Time,Type,Amount_Cents,Account,Category,Notes\n';
      for (const t of transactions) {
        const acc = accounts.find((a) => a.id === t.account_id)?.name || '';
        const cat = categories.find((c) => c.id === t.category_id)?.name || '';
        csv += `"${t.id}","${t.transaction_date}","${t.transaction_time || ''}","${
          t.transaction_type
        }",${t.amount},"${acc}","${cat}","${t.notes || ''}"\n`;
      }

      await Share.share({
        title: 'VaultPace Ledger CSV',
        message: csv,
      });
    } catch (e) {
      Alert.alert('Export Error', 'Unable to share CSV ledger.');
    }
  };

  const handleResetData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Reset All Records',
      'This will revert accounts, transactions, and categories to fresh sample defaults. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const currencyOptions = [
    { code: 'USD', label: 'USD ($) - US Dollar' },
    { code: 'EUR', label: 'EUR (€) - Euro' },
    { code: 'INR', label: 'INR (₹) - Indian Rupee' },
    { code: 'GBP', label: 'GBP (£) - British Pound' },
    { code: 'CAD', label: 'CAD (CA$) - Canadian Dollar' },
    { code: 'AUD', label: 'AUD (A$) - Australian Dollar' },
    { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & System</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Theme engine, security toggles, and data vaults
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Help & Support / Developer Contact Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            (navigation as any).navigate('HelpContact');
          }}
          style={[
            styles.helpCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.helpLeft}>
            <View style={[styles.helpIconWrap, { backgroundColor: colors.accentLight }]}>
              <HelpCircle size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.helpTitle, { color: colors.text }]}>
                Help, Support & Contact
              </Text>
              <Text style={[styles.helpDesc, { color: colors.textMuted }]}>
                Interactive FAQ, user guides & direct developer links
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* =========================================================================
            Visual Appearance & Themes
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE & HUES</Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Theme Selector */}
            <View style={styles.cardRow}>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Display Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  {settings.theme_mode.toUpperCase()} MODE
                </Text>
              </View>

              <View style={[styles.themePills, { backgroundColor: colors.surfaceSubtle }]}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ theme_mode: 'light' });
                  }}
                  style={[
                    styles.themePillBtn,
                    settings.theme_mode === 'light' && [
                      styles.themePillActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                >
                  <Sun
                    size={14}
                    color={settings.theme_mode === 'light' ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: settings.theme_mode === 'light' ? colors.text : colors.textMuted },
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ theme_mode: 'dark' });
                  }}
                  style={[
                    styles.themePillBtn,
                    settings.theme_mode === 'dark' && [
                      styles.themePillActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                >
                  <Moon
                    size={14}
                    color={settings.theme_mode === 'dark' ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: settings.theme_mode === 'dark' ? colors.text : colors.textMuted },
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateSettings({ theme_mode: 'system' });
                  }}
                  style={[
                    styles.themePillBtn,
                    settings.theme_mode === 'system' && [
                      styles.themePillActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                >
                  <Smartphone
                    size={14}
                    color={settings.theme_mode === 'system' ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: settings.theme_mode === 'system' ? colors.text : colors.textMuted },
                    ]}
                  >
                    Auto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Accent Swatches */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View>
              <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 8 }]}>
                Color Accent ({ACCENT_PALETTES[settings.accent_color]?.label})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.swatchScroll}
              >
                {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((key) => {
                  const item = ACCENT_PALETTES[key];
                  const isSelected = settings.accent_color === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateSettings({ accent_color: key });
                      }}
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: item.primary,
                          borderColor: isSelected ? colors.text : 'transparent',
                          borderWidth: isSelected ? 3 : 0,
                        },
                      ]}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* =========================================================================
            Regional Defaults
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>REGIONAL DEFAULTS</Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Globe size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Base Currency</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Applied to unified metrics
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.swatchScroll, { marginTop: 10 }]}
            >
              {currencyOptions.map((c) => {
                const isSelected = settings.default_currency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateSettings({ default_currency: c.code });
                    }}
                    style={[
                      styles.currencyPill,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyPillText,
                        { color: isSelected ? colors.onAccent : colors.text },
                      ]}
                    >
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* =========================================================================
            Preferences & Security
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SECURITY & FEEDBACK
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Lock size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Biometric Lock</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Require FaceID / Fingerprint on launch
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.biometrics_enabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  updateSettings({ biometrics_enabled: val });
                }}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Vibrate size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Haptic Tactile Cues</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Vibrate on clicks and saves
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.haptics_enabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  updateSettings({ haptics_enabled: val });
                }}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
              />
            </View>
          </View>
        </View>

        {/* =========================================================================
            Data Portability & Vault
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            DATA PORTABILITY & BACKUP
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={handleExportJSON} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Download size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Export JSON Data Backup
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Complete snapshot for safe offline keeping
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={handleExportCSV} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Download size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Export CSV Spreadsheet Ledger
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Formatted for Excel, Google Sheets, Numbers
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={handleResetData} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <RotateCcw size={18} color={colors.danger} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.danger }]}>
                    Reset Sample Demo Records
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Restore standard demo accounts and entries
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* System Verification Badge */}
        <View
          style={[
            styles.privacyFooter,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.badgeLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.privacyTitle, { color: colors.text }]}>
              VaultPace Mobile v1.0.0
            </Text>
            <Text style={[styles.privacyDesc, { color: colors.textMuted }]}>
              Zero tracking • 100% on-device SQLite/AsyncStorage • Encrypted state
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  helpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  helpDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cardBox: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themePills: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  themePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  themePillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  swatchScroll: {
    flexDirection: 'row',
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 20,
  },
  badgeLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  privacyDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
