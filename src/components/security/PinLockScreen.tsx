import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/useStore';
import { useAppTheme } from '../../theme/useTheme';
import { ShieldAlert, Fingerprint, Delete, Lock, KeyRound } from 'lucide-react-native';

interface PinLockScreenProps {
  onSuccess?: () => void;
}

function shuffleDigits(): number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onSuccess }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { settings, setIsAppLocked, resetSecurityPin } = useStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scrambledDigits, setScrambledDigits] = useState<number[]>(() => shuffleDigits());
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Check hardware biometric availability
  useEffect(() => {
    async function checkBiometrics() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);
      } catch {
        setBiometricsAvailable(false);
      }
    }
    checkBiometrics();
  }, []);

  // Trigger Biometric authentication
  const triggerBiometricAuth = useCallback(async () => {
    if (!settings.biometrics_enabled) return;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock VaultPace',
        fallbackLabel: 'Use PIN Keypad',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsAppLocked(false);
        onSuccess?.();
      }
    } catch {
      // User can use custom PIN keypad
    }
  }, [settings.biometrics_enabled, setIsAppLocked, onSuccess]);

  // Prompt biometrics on mount if enabled
  useEffect(() => {
    if (settings.biometrics_enabled) {
      triggerBiometricAuth();
    }
  }, [settings.biometrics_enabled, triggerBiometricAuth]);

  // Trigger shake animation on error
  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleDigitPress = (digit: number) => {
    if (pin.length >= 4) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg(null);

    const newPin = pin + digit.toString();
    setPin(newPin);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const verifyPin = (candidatePin: string) => {
    // If no pin is set yet, default fallback is '1234' or any 4 digits
    const expectedPin = settings.security_pin || '1234';

    if (candidatePin === expectedPin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAppLocked(false);
      onSuccess?.();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      setErrorMsg('Incorrect PIN. Please try again.');
      setPin('');
      // Rescramble keypad digits on invalid entry for maximum security
      setScrambledDigits(shuffleDigits());
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleResetPin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If biometrics is supported and enrolled, prompt for biometric identity check first
    if (biometricsAvailable) {
      try {
        const bioResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify identity to reset Vault PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (bioResult.success) {
          resetSecurityPin();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'PIN Cleared',
            'Your security PIN has been cleared and your vault unlocked. You can configure a new PIN anytime in Settings.'
          );
          return;
        }
      } catch {
        // Fallback to confirmation alert
      }
    }

    // Safety confirmation dialog
    Alert.alert(
      'Reset Vault Security PIN',
      'If you have forgotten your PIN, resetting will clear your current PIN and unlock your local vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset PIN & Unlock',
          style: 'destructive',
          onPress: () => {
            resetSecurityPin();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'PIN Reset Complete',
              'Your PIN has been removed and your vault unlocked.'
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Branding Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 20, 40) }]}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.brandTitle, { color: colors.text }]}>VaultPace</Text>
        <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
          Private Financial Tracker
        </Text>

        <View style={[styles.lockBadge, { backgroundColor: colors.surfaceSubtle }]}>
          <Lock size={14} color={colors.accent} />
          <Text style={[styles.lockBadgeText, { color: colors.accent }]}>
            {settings.biometrics_enabled && settings.pin_lock_enabled
              ? 'BIOMETRIC & PIN PROTECTED'
              : settings.biometrics_enabled
              ? 'BIOMETRIC PROTECTED'
              : 'VAULT SECURITY LOCKED'}
          </Text>
        </View>
      </View>

      {/* PIN Dots Area */}
      <Animated.View
        style={[
          styles.pinDisplayContainer,
          { transform: [{ translateX: shakeAnimation }] },
        ]}
      >
        <Text style={[styles.pinInstruction, { color: colors.text }]}>
          Enter 4-Digit Security PIN
        </Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
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
          <Text style={[styles.scrambleNote, { color: colors.textMuted }]}>
            Keypad digits are scrambled for anti-shoulder surfing
          </Text>
        )}
      </Animated.View>

      {/* Randomized In-App Custom Keypad */}
      <View style={[styles.keypadContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          {scrambledDigits.slice(0, 3).map((digit) => (
            <KeypadButton
              key={`k-${digit}`}
              label={digit.toString()}
              onPress={() => handleDigitPress(digit)}
              colors={colors}
            />
          ))}
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          {scrambledDigits.slice(3, 6).map((digit) => (
            <KeypadButton
              key={`k-${digit}`}
              label={digit.toString()}
              onPress={() => handleDigitPress(digit)}
              colors={colors}
            />
          ))}
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          {scrambledDigits.slice(6, 9).map((digit) => (
            <KeypadButton
              key={`k-${digit}`}
              label={digit.toString()}
              onPress={() => handleDigitPress(digit)}
              colors={colors}
            />
          ))}
        </View>

        {/* Row 4: Biometric/Action, 10th Scrambled Digit, Backspace */}
        <View style={styles.keypadRow}>
          {/* Left Action: Biometrics re-trigger or Reshuffle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={settings.biometrics_enabled ? triggerBiometricAuth : () => setScrambledDigits(shuffleDigits())}
            style={[styles.keyBtn, styles.specialBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            {settings.biometrics_enabled ? (
              <Fingerprint size={26} color={colors.accent} />
            ) : (
              <KeyRound size={22} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          {/* 10th Digit */}
          <KeypadButton
            label={scrambledDigits[9].toString()}
            onPress={() => handleDigitPress(scrambledDigits[9])}
            colors={colors}
          />

          {/* Delete / Backspace */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeletePress}
            style={[styles.keyBtn, styles.specialBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Delete size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Reset PIN Action */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResetPin}
          style={styles.resetPinBtn}
        >
          <Text style={[styles.resetPinText, { color: colors.accent }]}>
            Forgot or Reset PIN?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface KeypadButtonProps {
  label: string;
  onPress: () => void;
  colors: any;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ label, onPress, colors }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.keyBtn,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pinDisplayContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 10,
  },
  pinInstruction: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  scrambleNote: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  keypadContainer: {
    paddingHorizontal: 36,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  specialBtn: {
    borderWidth: 0,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '700',
  },
  resetPinBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  resetPinText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
