import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import {
  sendWhatsAppMessage,
  sendSmsMessage,
  cleanPhoneNumber,
  buildPaymentReminderMessage,
  buildDebtSettledMessage,
  buildNewDebtMessage,
} from '../../utils/debtMessaging';
import {
  MessageSquare,
  Send,
  X,
  Share2,
  Phone,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react-native';

export type DebtMessageType = 'reminder' | 'settled' | 'new_entry';

export interface DebtMessageConfig {
  visible: boolean;
  contactName: string;
  contactPhone?: string;
  messageType: DebtMessageType;
  currencySymbol: string;
  netAmountFormatted?: string;
  paymentAmountFormatted?: string;
  remainingBalanceFormatted?: string;
  dueDate?: string;
  movementType?: 'lend' | 'borrow';
  date?: string;
  customMessage?: string;
}

interface DebtMessageModalProps {
  config: DebtMessageConfig;
  onClose: () => void;
}

export const DebtMessageModal: React.FC<DebtMessageModalProps> = ({ config, onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DebtMessageType>(config.messageType);
  const [isCopied, setIsCopied] = useState(false);

  const generateDefaultMessage = (templateType: DebtMessageType) => {
    if (config.customMessage && templateType === config.messageType) {
      return config.customMessage;
    }

    if (templateType === 'settled') {
      return buildDebtSettledMessage({
        contactName: config.contactName,
        paymentAmountFormatted: config.paymentAmountFormatted || '$0.00',
        remainingBalanceFormatted: config.remainingBalanceFormatted || '$0.00',
      });
    }

    if (templateType === 'new_entry') {
      return buildNewDebtMessage({
        contactName: config.contactName,
        amountFormatted: config.paymentAmountFormatted || config.netAmountFormatted || '$0.00',
        movementType: config.movementType || 'lend',
        date: config.date || new Date().toISOString().split('T')[0],
        netAmountFormatted: config.netAmountFormatted || '$0.00',
      });
    }

    // Default: 'reminder'
    return buildPaymentReminderMessage({
      contactName: config.contactName,
      currencySymbol: config.currencySymbol,
      netAmountFormatted: config.netAmountFormatted || '$0.00',
      dueDate: config.dueDate,
    });
  };

  useEffect(() => {
    if (config.visible) {
      setSelectedTemplate(config.messageType);
      setMessageText(generateDefaultMessage(config.messageType));
      setIsCopied(false);
    }
  }, [config.visible, config.messageType]);

  const handleSwitchTemplate = (type: DebtMessageType) => {
    triggerHaptic('selection');
    setSelectedTemplate(type);
    setMessageText(generateDefaultMessage(type));
  };

  const handleSendWhatsApp = async () => {
    triggerHaptic('medium');
    await sendWhatsAppMessage(config.contactPhone, messageText);
    onClose();
  };

  const handleSendSms = async () => {
    triggerHaptic('medium');
    await sendSmsMessage(config.contactPhone, messageText);
    onClose();
  };

  const handleShareSheet = async () => {
    triggerHaptic('light');
    await sendSmsMessage(undefined, messageText);
    onClose();
  };

  const cleanedPhone = cleanPhoneNumber(config.contactPhone);

  return (
    <Modal
      visible={config.visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 18) }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#D1FAE5' }]}>
                <MessageSquare size={18} color="#059669" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Send Message</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {config.contactName} {cleanedPhone ? `• ${config.contactPhone}` : '(No phone linked)'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* Template Selector Chips */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SELECT TEMPLATE
            </Text>
            <View style={styles.templateChipsRow}>
              <TouchableOpacity
                onPress={() => handleSwitchTemplate('reminder')}
                style={[
                  styles.templateChip,
                  {
                    backgroundColor:
                      selectedTemplate === 'reminder' ? colors.accent : colors.surfaceSubtle,
                    borderColor: selectedTemplate === 'reminder' ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    {
                      color: selectedTemplate === 'reminder' ? colors.onAccent : colors.text,
                    },
                  ]}
                >
                  Payment Reminder
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSwitchTemplate('settled')}
                style={[
                  styles.templateChip,
                  {
                    backgroundColor:
                      selectedTemplate === 'settled' ? colors.accent : colors.surfaceSubtle,
                    borderColor: selectedTemplate === 'settled' ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    {
                      color: selectedTemplate === 'settled' ? colors.onAccent : colors.text,
                    },
                  ]}
                >
                  Payment Recorded
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSwitchTemplate('new_entry')}
                style={[
                  styles.templateChip,
                  {
                    backgroundColor:
                      selectedTemplate === 'new_entry' ? colors.accent : colors.surfaceSubtle,
                    borderColor: selectedTemplate === 'new_entry' ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateChipText,
                    {
                      color: selectedTemplate === 'new_entry' ? colors.onAccent : colors.text,
                    },
                  ]}
                >
                  New Entry Summary
                </Text>
              </TouchableOpacity>
            </View>

            {/* Editable Message Box */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 14 }]}>
              EDIT MESSAGE BEFORE SENDING
            </Text>
            <View
              style={[
                styles.messageBox,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                multiline
                numberOfLines={4}
                style={[styles.messageInput, { color: colors.text }]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textMuted + '80'}
              />
            </View>

            {/* Send Action Buttons */}
            <View style={styles.actionGrid}>
              {/* WhatsApp Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendWhatsApp}
                style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Send via WhatsApp</Text>
              </TouchableOpacity>

              {/* SMS Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendSms}
                style={[styles.secondaryActionBtn, { backgroundColor: '#0284C7' }]}
              >
                <MessageSquare size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Send via SMS</Text>
              </TouchableOpacity>
            </View>

            {/* Share Sheet Fallback & Skip */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={handleShareSheet}
                style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
              >
                <Share2 size={14} color={colors.text} />
                <Text style={[styles.shareBtnText, { color: colors.text }]}>Share Sheet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.skipBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>Done / Skip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
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
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  templateChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messageBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  messageInput: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  actionGrid: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  skipBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
