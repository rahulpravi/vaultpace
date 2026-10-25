import React, { useState } from 'react';
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
import { useStore } from '../store/useStore';
import { ThemeMode, AccentColor } from '../types';
import { BottomTabProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { SetPinModal } from '../components/security/SetPinModal';
import { PinVerificationModal } from '../components/security/PinVerificationModal';
import { exportTransactionsToPdf } from '../utils/exportPdf';
import {
  Sun,
  Moon,
  Smartphone,
  Download,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  Lock,
  Vibrate,
  Globe,
  FileText,
  KeyRound,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react-native';

export const SettingsScreen: React.FC<BottomTabProps<'SettingsTab'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const {
    settings,
    updateSettings,
    cleanSlateFinancialRecords,
    resetToDefaults,
    accounts,
    categories,
    budgets,
    transactions,
    getTotalNetWorthCents,
    setIsAppLocked,
    resetSecurityPin,
  } = useStore();

  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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

  const handleToggleBiometrics = async (val: boolean) => {
    Haptics.selectionAsync();

    if (!val) {
      updateSettings({ biometrics_enabled: false });
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          'Biometrics Not Supported',
          'Your device hardware does not support biometric authentication.'
        );
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(
          'Biometrics Not Enrolled',
          'No Face ID or Fingerprint was detected on this device. Please enroll biometrics in your Android/iOS settings first.'
        );
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Biometric Protection for VaultPace',
        fallbackLabel: 'Use PIN',
      });

      if (authResult.success) {
        updateSettings({ biometrics_enabled: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Biometrics Enabled',
          'Biometric authentication is now active. Face ID / Fingerprint will be required upon app launch.'
        );
      }
    } catch (e: any) {
      Alert.alert('Authentication Error', e?.message || 'Could not verify biometrics.');
    }
  };

  const handlePinAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (settings.pin_lock_enabled) {
      Alert.alert(
        'PIN Security Lock',
        'Your custom 4-digit PIN is currently active. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change PIN',
            onPress: () => setIsSetPinModalOpen(true),
          },
          {
            text: 'Disable PIN',
            style: 'destructive',
            onPress: () => {
              resetSecurityPin();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('PIN Removed', 'PIN protection has been disabled.');
            },
          },
        ]
      );
    } else {
      setIsSetPinModalOpen(true);
    }
  };

  const handleLockNow = () => {
    if (!settings.biometrics_enabled && !settings.pin_lock_enabled) {
      Alert.alert(
        'No Lock Configured',
        'Please enable Biometric Lock or configure a 4-Digit PIN first.'
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsAppLocked(true);
  };

  const handleExportPdf = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinModalConfig({
      visible: true,
      title: 'Authorize PDF Export',
      subtitle: 'Enter your 4-digit PIN to generate and download your confidential financial PDF statement.',
      actionType: 'primary',
      onSuccess: async () => {
        try {
          setIsExportingPdf(true);
          await exportTransactionsToPdf({
            accounts,
            categories,
            budgets,
            transactions,
            settings,
            totalNetWorth: getTotalNetWorthCents(),
          });
        } catch {
          Alert.alert('Export Error', 'Unable to generate PDF statement.');
        } finally {
          setIsExportingPdf(false);
        }
      },
    });
  };

  const handleExportJSON = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = {
        version: '2.0',
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
    } catch {
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
    } catch {
      Alert.alert('Export Error', 'Unable to share CSV ledger.');
    }
  };

  const handleResetData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Clean Slate (Reset Financial Records)',
      'This will wipe all transactions, wallet balances, and custom category limits to a clean initial state.\n\nYour security PIN, biometrics, and theme preferences will NOT be affected.\n\nEnter your PIN to authorize.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify PIN & Wipe',
          style: 'destructive',
          onPress: () => {
            setPinModalConfig({
              visible: true,
              title: 'Authorize Clean Slate',
              subtitle: 'Enter your 4-digit PIN to wipe all financial records and reset balances to zero.',
              actionType: 'destructive',
              onSuccess: () => {
                cleanSlateFinancialRecords();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Clean Slate Ready',
                  'All financial transactions, wallet balances, and limits have been wiped. App settings and PIN remain active.'
                );
              },
            });
          },
        },
      ]
    );
  };

  const currencyOptions = [
    { code: 'INR', label: 'INR (₹) - Indian Rupee' },
    { code: 'USD', label: 'USD ($) - US Dollar' },
    { code: 'EUR', label: 'EUR (€) - Euro' },
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Security</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Biometrics, randomized PIN pad, data exports & currency
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Help & Support Banner */}
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
                Interactive FAQ, guides & developer contact
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* =========================================================================
            Visual Appearance & Themes
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE & THEME</Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Theme Selector */}
            <View style={styles.cardRow}>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Display Mode</Text>
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
                Accent Hue ({ACCENT_PALETTES[settings.accent_color]?.label})
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
            Regional Defaults (Base Currency)
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
                    Default across accounts, analytics & PDF statements
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
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* =========================================================================
            Authentication & Security
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SECURITY & AUTHENTICATION
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Biometric Lock Toggle */}
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Fingerprint size={20} color={colors.accent} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Biometric Lock</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Unlock with Face ID / Fingerprint on launch
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.biometrics_enabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Custom PIN Lock */}
            <TouchableOpacity onPress={handlePinAction} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <KeyRound size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Custom PIN Lock</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    {settings.pin_lock_enabled
                      ? '4-Digit PIN is active • Tap to change or remove'
                      : 'Set up scrambled numeric PIN keypad lock'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: settings.pin_lock_enabled ? colors.accent : colors.textMuted,
                  }}
                >
                  {settings.pin_lock_enabled ? 'Configured' : 'Setup'}
                </Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Immediate Lock Vault Button */}
            <TouchableOpacity onPress={handleLockNow} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Lock size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Lock Vault Now</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Instantly activate lock screen to test security
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Haptic tactile feedback */}
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Vibrate size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Tactile Haptics</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Vibrate on keypad presses and actions
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
            Data Portability & PDF Export
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            DATA PORTABILITY & EXPORTS
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Export PDF */}
            <TouchableOpacity
              onPress={handleExportPdf}
              disabled={isExportingPdf}
              style={styles.actionRow}
            >
              <View style={styles.actionLeft}>
                <FileText size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    {isExportingPdf ? 'Generating PDF...' : 'Export PDF Statement'}
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Formatted document with balances & transaction history
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Export JSON */}
            <TouchableOpacity onPress={handleExportJSON} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Download size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Export JSON Data Backup
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Raw data snapshot for safe offline archive
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Export CSV */}
            <TouchableOpacity onPress={handleExportCSV} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Download size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Export CSV Spreadsheet
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Table formatted for Excel, Google Sheets, Numbers
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Reset Database */}
            <TouchableOpacity onPress={handleResetData} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <RotateCcw size={18} color={colors.danger} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.danger }]}>
                    Reset Records (Clean Slate)
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Reset database to zero transactions & default INR wallets
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
              Zero tracking • 100% on-device SQLite/AsyncStorage • Biometric & scrambled PIN protected
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Set PIN Modal */}
      <SetPinModal
        visible={isSetPinModalOpen}
        onClose={() => setIsSetPinModalOpen(false)}
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  helpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  helpDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  divider: {
    height: 1,
    marginVertical: 14,
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
    borderRadius: 10,
  },
  themePillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
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
    paddingVertical: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
