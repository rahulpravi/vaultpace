import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { RootStackScreenProps } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Github,
  Twitter,
  Globe,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Send,
} from 'lucide-react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Where is my financial data stored?',
    answer:
      'All accounts, transactions, and categories are saved 100% locally on your physical device using encrypted AsyncStorage and SQLite storage. VaultPace does not transmit or synchronize your financial data to any external cloud servers.',
  },
  {
    id: 'faq-2',
    question: 'How do multiple account pools and transfers work?',
    answer:
      'You can establish distinct pools for Cash, Bank Accounts, Savings Vaults, and Credit Cards with distinct currencies (USD, EUR, INR, GBP, etc.). When you record a Transfer, VaultPace automatically credits the destination pool and debits the origin pool simultaneously.',
  },
  {
    id: 'faq-3',
    question: 'How do budget pace thresholds operate?',
    answer:
      'Budgets monitor expenses within their cycle (e.g., Monthly). When your spending approaches your designated threshold (e.g. 80%), the badge shifts to Warning. When your spending exceeds 100%, an Exceeded alert appears.',
  },
  {
    id: 'faq-4',
    question: 'Can I backup and export my ledger to Excel or Sheets?',
    answer:
      'Yes! Navigate to Settings > Data Portability to download both formatted CSV spreadsheets (compatible with Excel, Google Sheets, Numbers) and complete raw JSON backups.',
  },
  {
    id: 'faq-5',
    question: 'Does VaultPace require an internet connection?',
    answer:
      'Zero internet connection is required. VaultPace functions completely offline with instant responsiveness and zero network latency.',
  },
];

export const HelpContactScreen: React.FC<RootStackScreenProps<'HelpContact'>> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const toggleFaq = (id: string) => {
    Haptics.selectionAsync();
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleEmailDeveloper = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const email = 'support@vaultpace.app';
    const subject = encodeURIComponent(`VaultPace Support Inquiry [${Platform.OS.toUpperCase()}]`);
    const body = encodeURIComponent(
      `Hello VaultPace Team,\n\nI have a question/suggestion regarding VaultPace Mobile:\n\n---\nPlatform: ${Platform.OS} (v${Platform.Version})\nApp: VaultPace v1.0.0`
    );
    const url = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email Support', `You can reach the developer directly at: ${email}`);
      }
    } catch (e) {
      Alert.alert('Email Support', `Please send your inquiries to: ${email}`);
    }
  };

  const handleOpenLink = async (url: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(title, `Link: ${url}`);
      }
    } catch {
      Alert.alert('Unable to Open', `Could not open link: ${url}`);
    }
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Empty Note', 'Please enter your thoughts or feedback.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSent(false), 5000);
  };

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Documentation & Developer Assistance
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* =========================================================================
            Developer Direct Channels
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DEVELOPER CONTACT</Text>

          <View style={styles.contactGrid}>
            <TouchableOpacity
              onPress={handleEmailDeveloper}
              style={[
                styles.contactCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.accentLight }]}>
                <Mail size={22} color={colors.accent} />
              </View>
              <Text style={[styles.contactName, { color: colors.text }]}>Direct Email</Text>
              <Text style={[styles.contactDesc, { color: colors.textMuted }]}>
                support@vaultpace.app
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleOpenLink('https://github.com/rahulpravi/vaultpace', 'GitHub')
              }
              style={[
                styles.contactCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.surfaceSubtle }]}>
                <Github size={22} color={colors.text} />
              </View>
              <Text style={[styles.contactName, { color: colors.text }]}>GitHub</Text>
              <Text style={[styles.contactDesc, { color: colors.textMuted }]}>
                Source & Releases
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://x.com', 'Twitter')}
              style={[
                styles.contactCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.surfaceSubtle }]}>
                <Twitter size={22} color="#1DA1F2" />
              </View>
              <Text style={[styles.contactName, { color: colors.text }]}>Twitter / X</Text>
              <Text style={[styles.contactDesc, { color: colors.textMuted }]}>@VaultPaceApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenLink('https://vaultpace.app', 'Website')}
              style={[
                styles.contactCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.surfaceSubtle }]}>
                <Globe size={22} color={colors.accent} />
              </View>
              <Text style={[styles.contactName, { color: colors.text }]}>Official Web</Text>
              <Text style={[styles.contactDesc, { color: colors.textMuted }]}>
                vaultpace.app
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
            Interactive In-App Feedback Form
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SEND DIRECT FEEDBACK</Text>

          <View
            style={[
              styles.feedbackCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <MessageSquare size={18} color={colors.accent} />
              <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                Have a feature idea or found a bug?
              </Text>
            </View>

            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell the developer what you would love to see improved..."
              placeholderTextColor={colors.textMuted + '80'}
              multiline
              numberOfLines={4}
              style={[
                styles.feedbackInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {feedbackSent && (
              <View
                style={[
                  styles.successBanner,
                  { backgroundColor: colors.successLight, borderColor: colors.success },
                ]}
              >
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={[styles.successBannerText, { color: colors.success }]}>
                  Thank you! Your feedback has been queued.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSendFeedback}
              style={[styles.feedbackSubmit, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Send size={16} color={colors.onAccent} />
              <Text style={[styles.feedbackSubmitText, { color: colors.onAccent }]}>
                Submit Note to Developer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
            Frequently Asked Questions Accordion
            ========================================================================= */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            FREQUENTLY ASKED QUESTIONS
          </Text>

          <View style={styles.faqList}>
            {FAQS.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => toggleFaq(faq.id)}
                    style={styles.faqHeader}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={18} color={colors.accent} />
                    ) : (
                      <ChevronDown size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                      <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Commitment statement */}
        <View
          style={[
            styles.commitmentBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <ShieldCheck size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.commitmentTitle, { color: colors.text }]}>
              Our Clean Architecture Promise
            </Text>
            <Text style={[styles.commitmentDesc, { color: colors.textMuted }]}>
              Built with React Native, TypeScript, Zustand, and NativeWind. No third-party ad
              trackers, analytics brokers, or remote data telemetry.
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contactDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  feedbackCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    gap: 8,
  },
  feedbackSubmitText: {
    fontSize: 13,
    fontWeight: '800',
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    lineHeight: 18,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqAnswer: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  commitmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  commitmentTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  commitmentDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
});
