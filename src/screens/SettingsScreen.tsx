import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Share,
  StatusBar,
} from 'react-native';
import { showAlert } from '../store/useAlertStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { ACCENT_PALETTES } from '../theme/colors';
import { useStore } from '../store/useStore';
import { ThemeMode, AccentColor, AutoLockInterval } from '../types';
import { BottomTabProps } from '../navigation/types';
import { triggerHaptic } from '../utils/haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { SetPinModal } from '../components/security/SetPinModal';
import { PinVerificationModal } from '../components/security/PinVerificationModal';
import { exportTransactionsToPdf } from '../utils/exportPdf';
import { exportBackup, pickAndRestoreBackup } from '../utils/backupRestore';
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
  Fingerprint,
  Coins,
  CloudUpload,
  CloudDownload,
  Tag,
  Plus,
  Clock,
} from 'lucide-react-native';
import { AddCategoryModal } from '../components/domain/AddCategoryModal';

const AUTO_LOCK_OPTIONS: { key: AutoLockInterval; label: string }[] = [
  { key: 'immediate', label: 'Immediate' },
  { key: '1m', label: '1 Min' },
  { key: '5m', label: '5 Min' },
  { key: 'off', label: 'Off' },
];

export const SettingsScreen: React.FC<BottomTabProps<'SettingsTab'>> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const cleanSlateFinancialRecords = useStore((s) => s.cleanSlateFinancialRecords);
  const restoreBackupData = useStore((s) => s.restoreBackupData);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const transactions = useStore((s) => s.transactions);
  const categoryLimits = useStore((s) => s.categoryLimits);
  const getTotalNetWorthCents = useStore((s) => s.getTotalNetWorthCents);
  const setIsAppLocked = useStore((s) => s.setIsAppLocked);
  const resetSecurityPin = useStore((s) => s.resetSecurityPin);

  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
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
    triggerHaptic('selection');

    if (!val) {
      updateSettings({ biometrics_enabled: false });
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        showAlert({
          type: 'warning',
          title: 'Biometrics Not Supported',
          message: 'Your device hardware does not support biometric authentication.',
        });
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        showAlert({
          type: 'warning',
          title: 'Biometrics Not Enrolled',
          message:
            'No Face ID or Fingerprint was detected on this device. Please enroll biometrics in your Android/iOS settings first.',
        });
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Biometric Protection for VaultPace',
        fallbackLabel: 'Use PIN',
      });

      if (authResult.success) {
        updateSettings({ biometrics_enabled: true });
        triggerHaptic('success');
        showAlert({
          type: 'success',
          title: 'Biometrics Enabled',
          message:
            'Biometric authentication is now active. Face ID / Fingerprint will be required upon app launch.',
        });
      }
    } catch (e: any) {
      showAlert({
        type: 'error',
        title: 'Authentication Error',
        message: e?.message || 'Could not verify biometrics.',
      });
    }
  };

  const handlePinAction = () => {
    triggerHaptic('light');
    if (settings.pin_lock_enabled) {
      showAlert({
        type: 'security',
        title: 'PIN Security Lock',
        message: 'Your custom 4-digit PIN is currently active. What would you like to do?',
        buttons: [
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
              triggerHaptic('success');
              showAlert({
                type: 'success',
                title: 'PIN Removed',
                message: 'PIN protection has been disabled.',
              });
            },
          },
        ],
      });
    } else {
      setIsSetPinModalOpen(true);
    }
  };

  const handleLockNow = () => {
    if (!settings.biometrics_enabled && !settings.pin_lock_enabled) {
      showAlert({
        type: 'security',
        title: 'No Lock Configured',
        message: 'Please enable Biometric Lock or configure a 4-Digit PIN first.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Setup PIN',
            onPress: () => setIsSetPinModalOpen(true),
          },
        ],
      });
      return;
    }
    triggerHaptic('warning');
    setIsAppLocked(true);
  };

  const handleExportBackup = async () => {
    triggerHaptic('light');

    const hasSecurityLock =
      Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

    const performExport = async () => {
      try {
        setIsExportingBackup(true);
        await exportBackup({
          accounts,
          transactions,
          categories,
          budgets,
          categoryLimits,
          settings,
        });
        updateSettings({ last_backup_date: new Date().toISOString() });
        triggerHaptic('success');
      } catch (err: any) {
        showAlert({
          type: 'error',
          title: 'Backup Failed',
          message: err?.message || 'Could not export backup file.',
        });
      } finally {
        setIsExportingBackup(false);
      }
    };

    if (hasSecurityLock && settings.security_pin) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize Backup Export',
        subtitle:
          'Enter your 4-digit PIN to export your complete financial vault (Wallets, Transactions, Debts, Limits).',
        actionType: 'primary',
        onSuccess: performExport,
      });
    } else {
      await performExport();
    }
  };

  const handleRestoreBackup = async () => {
    triggerHaptic('light');

    const hasSecurityLock =
      Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

    const performRestore = async () => {
      try {
        setIsRestoringBackup(true);
        const result = await pickAndRestoreBackup();
        if (result.canceled) {
          return;
        }
        if (!result.success || !result.data) {
          showAlert({
            type: 'error',
            title: 'Restore Failed',
            message: result.error || 'Invalid or corrupted backup file.',
          });
          return;
        }

        const { data, meta } = result;
        const backupDate = meta?.exported_at
          ? new Date(meta.exported_at).toLocaleDateString()
          : 'Unknown date';

        showAlert({
          type: 'danger',
          title: 'Confirm Restore',
          message:
            `Backup Date: ${backupDate}\n` +
            `Wallets: ${meta?.accountsCount || 0}\n` +
            `Transactions: ${meta?.transactionsCount || 0} (${meta?.debtsCount || 0} loan records)\n\n` +
            `Do you want to restore these records into your VaultPace vault?`,
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore Now',
              style: 'destructive',
              onPress: () => {
                restoreBackupData(data);
                triggerHaptic('success');
                showAlert({
                  type: 'success',
                  title: 'Vault Restored',
                  message:
                    'All wallets, transactions, debts/IOUs, and category limits have been restored successfully!',
                });
              },
            },
          ],
        });
      } catch (err: any) {
        showAlert({
          type: 'error',
          title: 'Restore Error',
          message: err?.message || 'Failed to restore backup file.',
        });
      } finally {
        setIsRestoringBackup(false);
      }
    };

    if (hasSecurityLock && settings.security_pin) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize Vault Restore',
        subtitle:
          'Enter your 4-digit PIN to restore data from backup. Restoring will safely replace current records with the backup file.',
        actionType: 'destructive',
        onSuccess: performRestore,
      });
    } else {
      await performRestore();
    }
  };

  const handleExportPdf = async () => {
    triggerHaptic('light');

    const hasSecurityLock =
      Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

    const performExportPdf = async () => {
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
        triggerHaptic('success');
      } catch {
        showAlert({
          type: 'error',
          title: 'Export Error',
          message: 'Unable to generate PDF statement.',
        });
      } finally {
        setIsExportingPdf(false);
      }
    };

    if (hasSecurityLock && settings.security_pin) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize PDF Export',
        subtitle:
          'Enter your 4-digit PIN to generate and download your confidential financial PDF statement.',
        actionType: 'primary',
        onSuccess: performExportPdf,
      });
    } else {
      await performExportPdf();
    }
  };

  const handleExportCSV = async () => {
    try {
      triggerHaptic('medium');
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
      showAlert({
        type: 'error',
        title: 'Export Error',
        message: 'Unable to share CSV ledger.',
      });
    }
  };

  const handleResetData = () => {
    triggerHaptic('warning');

    const hasSecurityLock =
      Boolean(settings.security_pin) || settings.pin_lock_enabled || settings.biometrics_enabled;

    const executeCleanSlate = () => {
      cleanSlateFinancialRecords();
      triggerHaptic('success');
      showAlert({
        type: 'success',
        title: 'Clean Slate Ready',
        message:
          'All financial transactions, wallet balances, and custom limits have been wiped. Your preferences and settings are preserved.',
      });
    };

    const confirmCleanSlate = () => {
      showAlert({
        type: 'danger',
        title: 'Reset All Financial Records?',
        message:
          'Are you sure you want to erase all transactions and reset wallet balances to zero? This action cannot be undone.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Wipe Records',
            style: 'destructive',
            onPress: executeCleanSlate,
          },
        ],
      });
    };

    if (hasSecurityLock && settings.security_pin) {
      setPinModalConfig({
        visible: true,
        title: 'Authorize Clean Slate',
        subtitle:
          'Enter your 4-digit PIN to wipe all transactions, wallet balances, and limits. Your security PIN, biometrics, and preferences will NOT be affected.',
        actionType: 'destructive',
        onSuccess: confirmCleanSlate,
      });
    } else {
      confirmCleanSlate();
    }
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Help & Support Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic('light');
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
                    triggerHaptic('selection');
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
                    triggerHaptic('selection');
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
                    triggerHaptic('selection');
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
                        triggerHaptic('selection');
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
                      triggerHaptic('selection');
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
            Categories Management
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            CATEGORIES & GROUPS
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Tag size={20} color={colors.accent} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Custom Categories</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    {categories.length} total categories ({categories.filter((c) => !c.is_default).length} custom)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('light');
                  setIsAddCategoryModalOpen(true);
                }}
                style={[
                  styles.categoryActionBtn,
                  { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' },
                ]}
              >
                <Plus size={13} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.categoryActionBtnText, { color: colors.accent }]}>
                  + Add Category
                </Text>
              </TouchableOpacity>
            </View>
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

            {/* Auto-Lock Vault */}
            <View>
              <View style={styles.cardRow}>
                <View style={styles.iconWithLabel}>
                  <Clock size={18} color={colors.accent} />
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Auto-Lock Vault</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                      Lock app when minimized or sent to background
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.themePills,
                  { backgroundColor: colors.surfaceSubtle, marginTop: 12 },
                ]}
              >
                {AUTO_LOCK_OPTIONS.map((opt) => {
                  const isSelected = (settings.auto_lock_interval || 'immediate') === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        triggerHaptic('selection');
                        updateSettings({ auto_lock_interval: opt.key });
                      }}
                      style={[
                        styles.themePillBtn,
                        { flex: 1, justifyContent: 'center' },
                        isSelected && [
                          styles.themePillActive,
                          { backgroundColor: colors.surface },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.themePillText,
                          { color: isSelected ? colors.text : colors.textMuted },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Haptic tactile feedback */}
            <View style={styles.cardRow}>
              <View style={styles.iconWithLabel}>
                <Vibrate size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Haptic Feedback</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    Tactile vibration on keypad presses and navigation
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.haptics_enabled}
                onValueChange={(val) => {
                  triggerHaptic('selection');
                  updateSettings({ haptics_enabled: val });
                }}
                trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
              />
            </View>
          </View>
        </View>

        {/* =========================================================================
            Offline-First Zero-Config Backup & Restore
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            BACKUP & RESTORE (OFFLINE-FIRST)
          </Text>

          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Export Backup */}
            <TouchableOpacity
              onPress={handleExportBackup}
              disabled={isExportingBackup}
              style={styles.actionRow}
            >
              <View style={styles.actionLeft}>
                <CloudUpload size={20} color={colors.accent} />
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    {isExportingBackup ? 'Preparing Backup...' : 'Export Backup'}
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Save offline JSON vault snapshot to Google Drive or local storage
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {settings.last_backup_date ? (
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
                    {new Date(settings.last_backup_date).toLocaleDateString()}
                  </Text>
                ) : null}
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Restore Backup */}
            <TouchableOpacity
              onPress={handleRestoreBackup}
              disabled={isRestoringBackup}
              style={styles.actionRow}
            >
              <View style={styles.actionLeft}>
                <CloudDownload size={20} color={colors.accent} />
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    {isRestoringBackup ? 'Reading File...' : 'Restore Backup'}
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Select & restore backup file directly from Google Drive or device
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
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
            {/* Debts & IOUs Tracker */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                navigation.navigate('Debts' as any);
              }}
              style={styles.actionRow}
            >
              <View style={styles.actionLeft}>
                <Coins size={20} color={colors.accent} />
                <View>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    Debts & IOUs (Loan Tracker)
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                    Track borrowed & lent money with contacts and settlements
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
              VaultPace Mobile v1.2.0
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

      {/* Add Custom Category Modal */}
      <AddCategoryModal
        visible={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
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
  categoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
