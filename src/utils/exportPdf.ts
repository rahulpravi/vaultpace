import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { Account, Budget, Category, Transaction, UserSettings } from '../types';
import { formatCurrency } from '../store/useStore';

interface ExportPdfData {
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  settings: UserSettings;
  totalNetWorth: number;
}

export async function exportTransactionsToPdf(data: ExportPdfData): Promise<string | null> {
  const { accounts, categories, transactions, settings, totalNetWorth } = data;

  const totalIncome = transactions
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currencyCode = settings.default_currency || 'INR';

  const accountsHtml = accounts
    .map((acc) => {
      return `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">${escapeHtml(
            acc.name
          )}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-transform: capitalize; color: #475569;">${escapeHtml(
            acc.account_type
          )}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #475569;">${escapeHtml(
            acc.currency
          )}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: ${
            acc.current_balance < 0 ? '#DC2626' : '#0F172A'
          };">${formatCurrency(acc.current_balance, acc.currency)}</td>
        </tr>
      `;
    })
    .join('');

  const transactionsHtml =
    transactions.length === 0
      ? `
      <tr>
        <td colspan="6" style="padding: 24px; text-align: center; color: #64748B; font-style: italic;">
          Zero transactions recorded. The ledger is clean and ready.
        </td>
      </tr>
    `
      : transactions
          .map((tx) => {
            const acc = accounts.find((a) => a.id === tx.account_id);
            const toAcc = tx.to_account_id ? accounts.find((a) => a.id === tx.to_account_id) : null;
            const cat = categories.find((c) => c.id === tx.category_id);

            const isIncome = tx.transaction_type === 'income';
            const isExpense = tx.transaction_type === 'expense';
            const isTransfer = tx.transaction_type === 'transfer';

            const typeColor = isIncome ? '#059669' : isExpense ? '#DC2626' : '#2563EB';
            const typeBg = isIncome ? '#ECFDF5' : isExpense ? '#FEF2F2' : '#EFF6FF';
            const prefix = isIncome ? '+' : isExpense ? '-' : '⇄';

            const accountLabel = isTransfer
              ? `${acc?.name || 'Wallet'} → ${toAcc?.name || 'Wallet'}`
              : acc?.name || 'Primary Wallet';

            return `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #334155; white-space: nowrap;">
            ${escapeHtml(tx.transaction_date)}
            ${tx.transaction_time ? `<br/><span style="font-size: 11px; color: #94A3B8;">${escapeHtml(tx.transaction_time)}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${typeBg}; color: ${typeColor};">
              ${escapeHtml(tx.transaction_type)}
            </span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #1E293B;">
            ${escapeHtml(cat?.name || (isTransfer ? 'Transfer' : 'General'))}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #475569;">
            ${escapeHtml(accountLabel)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 12px; color: #64748B;">
            ${escapeHtml(tx.notes || '—')}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 700; font-size: 13px; color: ${typeColor};">
            ${prefix}${formatCurrency(tx.amount, acc?.currency || currencyCode)}
          </td>
        </tr>
      `;
          })
          .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>VaultPace Financial Statement</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 18mm 16mm 18mm 16mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 0;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0F172A;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .brand-name {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0F172A;
          margin: 0;
        }
        .brand-subtitle {
          font-size: 12px;
          font-weight: 600;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 2px;
        }
        .report-meta {
          text-align: right;
          font-size: 11px;
          color: #64748B;
          line-height: 1.4;
        }
        .report-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 4px;
        }
        .summary-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .metric-card {
          flex: 1;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background-color: #F8FAFC;
        }
        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748B;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .metric-val {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
        }
        .section-header {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.2px;
          color: #0F172A;
          text-transform: uppercase;
          margin-top: 24px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }
        th {
          background-color: #F1F5F9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          padding: 10px 12px;
          border-bottom: 2px solid #CBD5E1;
        }
        .footer {
          margin-top: 32px;
          padding-top: 14px;
          border-top: 1px solid #E2E8F0;
          font-size: 10px;
          color: #94A3B8;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="brand-name">VaultPace</h1>
          <div class="brand-subtitle">Private On-Device Financial Ledger</div>
        </div>
        <div class="report-meta">
          <div class="report-title">Financial Audit Statement</div>
          <div>Generated: ${formattedDate} at ${formattedTime}</div>
          <div>Base Currency: <strong>${escapeHtml(currencyCode)}</strong></div>
        </div>
      </div>

      <!-- Financial Executive Summary -->
      <div class="summary-grid">
        <div class="metric-card" style="border-left: 4px solid #059669;">
          <div class="metric-label">Total Net Worth</div>
          <div class="metric-val" style="color: #059669;">${formatCurrency(totalNetWorth, currencyCode)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Recorded Inflow</div>
          <div class="metric-val" style="color: #047857;">+${formatCurrency(totalIncome, currencyCode)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Recorded Outflow</div>
          <div class="metric-val" style="color: #DC2626;">-${formatCurrency(totalExpense, currencyCode)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Transactions</div>
          <div class="metric-val">${transactions.length}</div>
        </div>
      </div>

      <!-- Wallets & Accounts -->
      <div class="section-header">Wallets & Accounts</div>
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Type</th>
            <th>Currency</th>
            <th style="text-align: right;">Current Balance</th>
          </tr>
        </thead>
        <tbody>
          ${accountsHtml}
        </tbody>
      </table>

      <!-- Complete Transactions History -->
      <div class="section-header">Transactions Ledger (${transactions.length})</div>
      <table>
        <thead>
          <tr>
            <th style="width: 14%;">Date</th>
            <th style="width: 12%;">Type</th>
            <th style="width: 18%;">Category</th>
            <th style="width: 22%;">Account / Flow</th>
            <th style="width: 20%;">Notes</th>
            <th style="text-align: right; width: 14%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactionsHtml}
        </tbody>
      </table>

      <!-- Privacy & Verification Footer -->
      <div class="footer">
        <div>VaultPace v1.0.0 • 100% Offline Client-Side SQLite Storage • Zero Cloud Telemetry</div>
        <div>Page 1 of 1 • Official User Audit Report</div>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'VaultPace Financial Statement PDF',
        UTI: 'com.adobe.pdf',
      });
      return uri;
    } else {
      Alert.alert(
        'PDF Generated',
        `PDF statement generated successfully: ${uri}`
      );
      return uri;
    }
  } catch (error: any) {
    Alert.alert('Export Failed', error?.message || 'Could not generate PDF statement.');
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
