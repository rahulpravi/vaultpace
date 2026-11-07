import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { Account, Category, Budget, Transaction, UserSettings } from '../types';

export interface VaultPaceBackupPayload {
  version: string;
  app: 'VaultPace';
  exported_at: string;
  device_platform: string;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  categoryLimits: Record<string, number>;
  settings?: Partial<UserSettings>;
}

export interface BackupData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  categoryLimits: Record<string, number>;
  settings: UserSettings;
}

export interface RestoreResult {
  canceled?: boolean;
  success: boolean;
  data?: {
    accounts: Account[];
    transactions: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
    categoryLimits?: Record<string, number>;
    settings?: Partial<UserSettings>;
  };
  meta?: {
    version: string;
    exported_at?: string;
    accountsCount: number;
    transactionsCount: number;
    debtsCount: number;
  };
  error?: string;
}

/**
 * 1. Export Backup: Serializes app state into JSON, writes to FileSystem.cacheDirectory,
 * and opens the native share sheet with Sharing.shareAsync so the user can save to Google Drive or local storage.
 */
export async function exportBackup(data: BackupData): Promise<{ filePath: string; fileName: string }> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = `vaultpace_backup_${dateStr}.json`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  const payload: VaultPaceBackupPayload = {
    version: '1.0',
    app: 'VaultPace',
    exported_at: now.toISOString(),
    device_platform: Platform.OS,
    accounts: data.accounts.filter(
      (a) =>
        a &&
        a.name?.toLowerCase() !== 'consolidated' &&
        a.name?.toLowerCase() !== 'all' &&
        a.id !== 'consolidated' &&
        a.id !== 'all'
    ),
    transactions: data.transactions,
    categories: data.categories,
    budgets: data.budgets,
    categoryLimits: data.categoryLimits || {},
    settings: {
      theme_mode: data.settings.theme_mode,
      accent_color: data.settings.accent_color,
      default_currency: data.settings.default_currency,
      first_day_of_week: data.settings.first_day_of_week,
      notifications_enabled: data.settings.notifications_enabled,
      haptics_enabled: data.settings.haptics_enabled,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);

  // Write file to device cache directory
  await FileSystem.writeAsStringAsync(fileUri, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Open native share sheet (allowing save directly to Google Drive, iCloud, local Files, etc.)
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save VaultPace Backup (Google Drive / Files)',
    UTI: 'public.json',
  });

  return { filePath: fileUri, fileName };
}

/**
 * 2. Restore Backup: Launches system document picker to pick a JSON backup from Google Drive or local storage,
 * and validates the JSON schema strictly before returning data to be loaded into Zustand.
 */
export async function pickAndRestoreBackup(): Promise<RestoreResult> {
  // Open document picker supporting Google Drive, iCloud, and local file storage
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { success: false, canceled: true };
  }

  const asset = result.assets[0];
  if (!asset.uri) {
    return { success: false, error: 'Could not access the selected backup file URI.' };
  }

  // Read file contents
  let fileContent: string;
  try {
    fileContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to read file: ${err?.message || 'Unknown read error'}`,
    };
  }

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(fileContent);
  } catch {
    return {
      success: false,
      error: 'The selected file is not a valid JSON document.',
    };
  }

  // Support both wrapped payload ({ data: { accounts, ... } }) and flat payload ({ accounts, ... })
  const payloadData = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  // Strict Validation: Must contain accounts array
  if (!payloadData.accounts || !Array.isArray(payloadData.accounts)) {
    return {
      success: false,
      error: 'Invalid backup structure: missing "accounts" list.',
    };
  }

  // Strict Validation: Must contain transactions array
  if (!payloadData.transactions || !Array.isArray(payloadData.transactions)) {
    return {
      success: false,
      error: 'Invalid backup structure: missing "transactions" list.',
    };
  }

  // Validate that accounts have essential fields
  for (let i = 0; i < payloadData.accounts.length; i++) {
    const acc = payloadData.accounts[i];
    if (!acc || typeof acc !== 'object' || typeof acc.id !== 'string' || typeof acc.name !== 'string') {
      return {
        success: false,
        error: `Account at index ${i} is missing an "id" or "name".`,
      };
    }
  }

  // Validate that transactions have essential fields
  for (let i = 0; i < payloadData.transactions.length; i++) {
    const tx = payloadData.transactions[i];
    if (
      !tx ||
      typeof tx !== 'object' ||
      typeof tx.id !== 'string' ||
      typeof tx.amount !== 'number' ||
      typeof tx.transaction_type !== 'string'
    ) {
      return {
        success: false,
        error: `Transaction at index ${i} is missing required fields (id, amount, transaction_type).`,
      };
    }
  }

  const accounts: Account[] = payloadData.accounts;
  const transactions: Transaction[] = payloadData.transactions;
  const debtsCount = transactions.filter(
    (t) => t.transaction_type === 'borrow' || t.transaction_type === 'lend'
  ).length;

  return {
    success: true,
    data: {
      accounts,
      transactions,
      categories: Array.isArray(payloadData.categories) ? payloadData.categories : undefined,
      budgets: Array.isArray(payloadData.budgets) ? payloadData.budgets : undefined,
      categoryLimits:
        payloadData.categoryLimits && typeof payloadData.categoryLimits === 'object'
          ? payloadData.categoryLimits
          : undefined,
      settings: payloadData.settings,
    },
    meta: {
      version: parsed.version || '1.0',
      exported_at: parsed.exported_at || parsed.timestamp,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      debtsCount,
    },
  };
}

