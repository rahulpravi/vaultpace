import { Linking, Platform, Share } from 'react-native';

/**
 * Clean phone number for WhatsApp and SMS deep links
 * Strips whitespace, hyphens, and non-numeric characters (except leading +)
 */
export function cleanPhoneNumber(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    return digits.substring(1);
  }
  return digits;
}

/**
 * Message template: Payment Reminder (when person owes money to user)
 */
export function buildPaymentReminderMessage({
  contactName,
  currencySymbol,
  netAmountFormatted,
  dueDate,
}: {
  contactName: string;
  currencySymbol: string;
  netAmountFormatted: string;
  dueDate?: string;
}): string {
  const dueInfo = dueDate ? ` (Due Date: ${dueDate})` : '';
  return `Hi ${contactName}, a quick reminder from my VaultPace ledger: an amount of ${netAmountFormatted}${dueInfo} is currently pending. Please let me know when convenient.`;
}

/**
 * Message template: Debt Settled / Repayment Recorded
 */
export function buildDebtSettledMessage({
  contactName,
  paymentAmountFormatted,
  remainingBalanceFormatted,
}: {
  contactName: string;
  paymentAmountFormatted: string;
  remainingBalanceFormatted: string;
}): string {
  return `Hi ${contactName}, I have recorded a payment of ${paymentAmountFormatted} in VaultPace. Remaining balance: ${remainingBalanceFormatted}. Thank you!`;
}

/**
 * Message template: New Loan / Borrowing Recorded
 */
export function buildNewDebtMessage({
  contactName,
  amountFormatted,
  movementType,
  date,
  netAmountFormatted,
}: {
  contactName: string;
  amountFormatted: string;
  movementType: 'lend' | 'borrow';
  date: string;
  netAmountFormatted: string;
}): string {
  const typeText = movementType === 'lend' ? 'Lent' : 'Borrowed';
  return `Hi ${contactName}, recorded ${amountFormatted} (${typeText}) on ${date} in VaultPace. Current net balance: ${netAmountFormatted}.`;
}

/**
 * Send WhatsApp message with deep linking and automatic fallback
 */
export async function sendWhatsAppMessage(
  phone: string | undefined,
  message: string
): Promise<{ success: boolean; fallbackTriggered?: boolean }> {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);

  const whatsappUrl = cleaned
    ? `whatsapp://send?phone=${cleaned}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
      return { success: true };
    }
  } catch {
    // Continue to fallback
  }

  // Fallback 1: Web WhatsApp deep link
  try {
    const webWaUrl = cleaned
      ? `https://wa.me/${cleaned}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    const canWeb = await Linking.canOpenURL(webWaUrl);
    if (canWeb) {
      await Linking.openURL(webWaUrl);
      return { success: true, fallbackTriggered: true };
    }
  } catch {
    // Continue to fallback 2
  }

  // Fallback 2: SMS or OS Share Sheet
  return sendSmsMessage(phone, message);
}

/**
 * Send SMS message with fallback to OS Share Sheet
 */
export async function sendSmsMessage(
  phone: string | undefined,
  message: string
): Promise<{ success: boolean; fallbackTriggered?: boolean }> {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const smsUrl = cleaned
    ? `sms:${cleaned}${separator}body=${encodedText}`
    : `sms:${separator}body=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(smsUrl);
    if (supported) {
      await Linking.openURL(smsUrl);
      return { success: true };
    }
  } catch {
    // Fallback to share sheet
  }

  try {
    await Share.share({ message });
    return { success: true, fallbackTriggered: true };
  } catch {
    return { success: false };
  }
}
