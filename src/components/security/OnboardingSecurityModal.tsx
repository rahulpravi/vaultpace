import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppTheme } from '../../theme/useTheme';
import { useStore } from '../../store/useStore';
import { triggerHaptic } from '../../utils/haptics';
import {
  Lock,
  Fingerprint,
  Delete,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react-native';

interface OnboardingSecurityModalProps {
  visible: boolean;
}

function shuffleDigits(): number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

type OnboardingStep = 'intro' | 'set_pin' | 'confirm_pin' | 'biometric_prompt' | 'complete';

export const OnboardingSecurityModal: React.FC<OnboardingSecurityModalProps> = ({ visible }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const setSecurityPin = useStore((s) => s.setSecurityPin);
  const updateSettings = useStore((s) => s.updateSettings);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scrambledDigits, setScrambledDigits] = useState<number[]>(() => shuffleDigits());
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  // Check hardware biometric availability
  useEffect(() => {
    async function checkBiometrics() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);

        if (hasHardware) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          }
        }
      } catch {
        setBiometricsAvailable(false);
      }
    }
    checkBiometrics();
  }, []);

  const activePin = currentStep === 'set_pin' ? firstPin : confirmPin;

  const handleDigitPress = (digit: number) => {
    if (activePin.length >= 4) return;

    triggerHaptic('light');
    setErrorMsg(null);

    const updated = activePin + digit.toString();

    if (currentStep === 'set_pin') {
      setFirstPin(updated);
      if (updated.length === 4) {
        setTimeout(() => {
          setCurrentStep('confirm_pin');
          setScrambledDigits(shuffleDigits());
          triggerHaptic('selection');
        }, 180);
      }
    } else if (currentStep === 'confirm_pin') {
      setConfirmPin(updated);
      if (updated.length === 4) {
        if (updated === firstPin) {
          // Success!
          triggerHaptic('success');
          setSecurityPin(updated);

          if (biometricsAvailable) {
            setTimeout(() => {
              setCurrentStep('biometric_prompt');
            }, 250);
          } else {
            setTimeout(() => {
              setCurrentStep('complete');
            }, 250);
          }
        } else {
          // Mismatch
          triggerHaptic('error');
          setErrorMsg('PINs do not match. Please re-enter.');
          setTimeout(() => {
            setConfirmPin('');
            setErrorMsg(null);
          }, 900);
        }
      }
    }
  };

  const handleDeletePress = () => {
    if (activePin.length > 0) {
      triggerHaptic('light');
      if (currentStep === 'set_pin') {
        setFirstPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
      setErrorMsg(null);
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    completeOnboarding();
  };

  const handleEnableBiometrics = async () => {
    triggerHaptic('light');
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: `Pair ${biometricType} for VaultPace`,
        fallbackLabel: 'Use PIN',
      });
      if (auth.success) {
        updateSettings({ biometrics_enabled: true });
        triggerHaptic('success');
      }
    } catch {
      // Ignored
    }
    setCurrentStep('complete');
  };

  const handleFinishOnboarding = () => {
    triggerHaptic('success');
    completeOnboarding();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* STEP 1: INTRO SCREEN */}
        {currentStep === 'intro' && (
          <ScrollView
            contentContainerStyle={[
              styles.introContainer,
              { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Branding */}
            <View style={styles.brandBox}>
              <View style={[styles.logoWrap, { borderColor: colors.accent + '40' }]}>
                <Image
                  source={require('../../../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                <Shield size={12} color={colors.accent} strokeWidth={2.5} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>OFFLINE & PRIVATE</Text>
              </View>
              <Text style={[styles.mainTitle, { color: colors.text }]}>Secure Your Vault</Text>
              <Text style={[styles.mainSubtitle, { color: colors.textMuted }]}>
                VaultPace stores 100% of your records locally on this device. Choose how you want to
                safeguard your financial vault.
              </Text>
            </View>

            {/* Feature Highlights */}
            <View style={styles.cardList}>
              <View
                style={[
                  styles.featureCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                  <Lock size={20} color={colors.accent} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    Scrambled 4-Digit PIN
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    Keypad shuffles numbers on each launch to block shoulder-surfing and screen
                    recording.
                  </Text>
                </View>
              </View>

              {biometricsAvailable && (
                <View
                  style={[
                    styles.featureCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                    <Fingerprint size={20} color={colors.accent} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {biometricType} Instant Unlock
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      Pair device biometrics to unlock your ledger seamlessly in a single touch.
                    </Text>
                  </View>
                </View>
              )}

              <View
                style={[
                  styles.featureCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.featureIconBox, { backgroundColor: colors.accentLight }]}>
                  <ShieldCheck size={20} color={colors.accent} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    Zero Tracking & No Cloud
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    No account required, no third-party tracking. Everything stays strictly in your
                    hands.
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.introActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic('light');
                  setScrambledDigits(shuffleDigits());
                  setFirstPin('');
                  setConfirmPin('');
                  setCurrentStep('set_pin');
                }}
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              >
                <Lock size={18} color={colors.onAccent} />
                <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>
                  Set Up 4-Digit PIN
                </Text>
                <ArrowRight size={18} color={colors.onAccent} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSkip}
                style={[styles.skipBtn, { borderColor: colors.border }]}
              >
                <Sparkles size={16} color={colors.textMuted} />
                <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>
                  Skip for Now • Explore App
                </Text>
              </TouchableOpacity>
              <Text style={[styles.footerNote, { color: colors.textMuted }]}>
                You can configure or change your PIN anytime in Settings.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* STEP 2 & 3: PIN CREATION & CONFIRMATION */}
        {(currentStep === 'set_pin' || currentStep === 'confirm_pin') && (
          <View
            style={[
              styles.pinContainer,
              { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Top Navigation Bar */}
            <View style={styles.pinTopBar}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  if (currentStep === 'confirm_pin') {
                    setCurrentStep('set_pin');
                    setConfirmPin('');
                  } else {
                    setCurrentStep('intro');
                    setFirstPin('');
                  }
                }}
                style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.stepIndicator, { color: colors.textMuted }]}>
                {currentStep === 'set_pin' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </Text>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.textSkipBtn}
              >
                <Text style={[styles.textSkipText, { color: colors.accent }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Instruction Box */}
            <View style={styles.pinHeader}>
              <View style={[styles.pinIconCircle, { backgroundColor: colors.accentLight }]}>
                <Lock size={24} color={colors.accent} />
              </View>
              <Text style={[styles.pinTitle, { color: colors.text }]}>
                {currentStep === 'set_pin' ? 'Create 4-Digit PIN' : 'Confirm Your PIN'}
              </Text>
              <Text style={[styles.pinSubtitle, { color: colors.textMuted }]}>
                {currentStep === 'set_pin'
                  ? 'Choose a 4-digit security code to protect your records'
                  : 'Re-enter your 4 digits to confirm accuracy'}
              </Text>

              {/* 4 Pin Indicator Dots */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = activePin.length > index;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isFilled ? colors.accent : 'transparent',
                          borderColor: isFilled ? colors.accent : colors.border,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {errorMsg ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              ) : (
                <Text style={[styles.antiSpyText, { color: colors.textMuted }]}>
                  Scrambled pad prevents shoulder-surfing
                </Text>
              )}
            </View>

            {/* Randomized Keypad */}
            <View style={styles.keypadWrapper}>
              <View style={styles.keypadGrid}>
                {/* Row 1 */}
                <View style={styles.keypadRow}>
                  {scrambledDigits.slice(0, 3).map((digit) => (
                    <TouchableOpacity
                      key={`d-${digit}`}
                      activeOpacity={0.65}
                      onPress={() => handleDigitPress(digit)}
                      style={[
                        styles.keyBtn,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 2 */}
                <View style={styles.keypadRow}>
                  {scrambledDigits.slice(3, 6).map((digit) => (
                    <TouchableOpacity
                      key={`d-${digit}`}
                      activeOpacity={0.65}
                      onPress={() => handleDigitPress(digit)}
                      style={[
                        styles.keyBtn,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 3 */}
                <View style={styles.keypadRow}>
                  {scrambledDigits.slice(6, 9).map((digit) => (
                    <TouchableOpacity
                      key={`d-${digit}`}
                      activeOpacity={0.65}
                      onPress={() => handleDigitPress(digit)}
                      style={[
                        styles.keyBtn,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 4 */}
                <View style={styles.keypadRow}>
                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={() => {
                      triggerHaptic('light');
                      setScrambledDigits(shuffleDigits());
                    }}
                    style={[styles.keyBtn, styles.specialKeyBtn]}
                  >
                    <Text style={[styles.shuffleText, { color: colors.textMuted }]}>SHUFFLE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={() => handleDigitPress(scrambledDigits[9])}
                    style={[
                      styles.keyBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.keyText, { color: colors.text }]}>
                      {scrambledDigits[9]}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={handleDeletePress}
                    style={[
                      styles.keyBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Delete size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: BIOMETRIC PROMPT */}
        {currentStep === 'biometric_prompt' && (
          <View
            style={[
              styles.centerStepContainer,
              { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={[styles.successIconCircle, { backgroundColor: colors.accentLight }]}>
              <Fingerprint size={48} color={colors.accent} />
            </View>

            <Text style={[styles.mainTitle, { color: colors.text, marginTop: 20 }]}>
              Enable {biometricType}?
            </Text>
            <Text
              style={[
                styles.mainSubtitle,
                { color: colors.textMuted, textAlign: 'center', marginHorizontal: 24 },
              ]}
            >
              Your 4-Digit PIN is active. Would you also like to unlock VaultPace instantly with{' '}
              {biometricType}?
            </Text>

            <View style={styles.promptActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleEnableBiometrics}
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              >
                <Fingerprint size={20} color={colors.onAccent} />
                <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>
                  Enable {biometricType}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentStep('complete')}
                style={[styles.skipBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>
                  No Thanks, PIN Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: ONBOARDING COMPLETE CELEBRATION */}
        {currentStep === 'complete' && (
          <View
            style={[
              styles.centerStepContainer,
              { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={[styles.successIconCircle, { backgroundColor: colors.accentLight }]}>
              <ShieldCheck size={52} color={colors.accent} />
            </View>

            <Text style={[styles.mainTitle, { color: colors.text, marginTop: 24 }]}>
              Vault Secured!
            </Text>
            <Text
              style={[
                styles.mainSubtitle,
                { color: colors.textMuted, textAlign: 'center', marginHorizontal: 32 },
              ]}
            >
              Your security locks have been successfully activated. Your local financial records are
              now protected.
            </Text>

            <View style={styles.promptActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleFinishOnboarding}
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              >
                <CheckCircle2 size={20} color={colors.onAccent} />
                <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>
                  Enter VaultPace
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  introContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 76,
    height: 76,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  cardList: {
    width: '100%',
    gap: 12,
    marginVertical: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  introActions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  pinTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSkipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  textSkipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  pinIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  pinSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  antiSpyText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  keypadWrapper: {
    width: '100%',
    paddingBottom: 16,
  },
  keypadGrid: {
    gap: 10,
    maxWidth: 340,
    alignSelf: 'center',
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  keyBtn: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialKeyBtn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  shuffleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerStepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  promptActions: {
    width: '100%',
    gap: 12,
    marginTop: 36,
  },
});

