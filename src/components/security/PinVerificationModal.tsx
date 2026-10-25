import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { useStore } from '../../store/useStore';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { X, Lock, ShieldAlert, Fingerprint, Delete } from 'lucide-react-native';

export interface PinVerificationModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actionType?: 'destructive' | 'primary';
  onSuccess: () => void;
  onClose: () => void;
}

function shuffleDigits(): number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  visible,
  title = 'Security Authentication',
  subtitle = 'Enter your 4-digit PIN to authorize this action.',
  actionType = 'primary',
  onSuccess,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { settings } = useStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scrambledDigits, setScrambledDigits] = useState<number[]>(() => shuffleDigits());
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Reset state whenever modal is opened
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg(null);
      setScrambledDigits(shuffleDigits());
    }
  }, [visible]);

  // Check device biometric availability
  useEffect(() => {
    async function checkBio() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);
      } catch {
        setBiometricsAvailable(false);
      }
    }
    if (visible) {
      checkBio();
    }
  }, [visible]);

  // Shake animation trigger
  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 12, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -12, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleBiometricAuth = useCallback(async () => {
    if (!settings.biometrics_enabled || !biometricsAvailable) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: title,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        setTimeout(() => {
          onSuccess();
        }, 150);
      }
    } catch {
      // User can still use custom PIN keypad
    }
  }, [settings.biometrics_enabled, biometricsAvailable, title, onClose, onSuccess]);

  const verifyCandidatePin = (candidatePin: string) => {
    const expectedPin = settings.security_pin || '1234';

    if (candidatePin === expectedPin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      setTimeout(() => {
        onSuccess();
      }, 150);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      setErrorMsg('Incorrect PIN. Please try again.');
      setPin('');
      setScrambledDigits(shuffleDigits());
    }
  };

  const handleDigitPress = (digit: number) => {
    if (pin.length >= 4) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg(null);

    const updated = pin + digit.toString();
    setPin(updated);

    if (updated.length === 4) {
      verifyCandidatePin(updated);
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const isDestructive = actionType === 'destructive';
  const badgeBg = isDestructive ? colors.dangerLight || '#fee2e2' : colors.accentLight;
  const badgeColor = isDestructive ? colors.danger : colors.accent;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: badgeBg }]}>
                {isDestructive ? (
                  <ShieldAlert size={20} color={badgeColor} />
                ) : (
                  <Lock size={20} color={badgeColor} />
                )}
              </View>
              <View style={styles.titleColumn}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[styles.securityBadge, { color: badgeColor }]}>
                  {isDestructive ? 'PROTECTED ACTION' : 'AUTHORIZATION REQUIRED'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Instructions */}
          <View style={styles.instructionBox}>
            <Text style={[styles.instructionText, { color: colors.textMuted }]}>
              {subtitle}
            </Text>

            {/* PIN Indicator Dots */}
            <Animated.View
              style={[
                styles.dotsRow,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isFilled
                          ? errorMsg
                            ? colors.danger
                            : badgeColor
                          : colors.surfaceSubtle,
                        borderColor: isFilled
                          ? errorMsg
                            ? colors.danger
                            : badgeColor
                          : colors.border,
                        transform: [{ scale: isFilled ? 1.15 : 1 }],
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>

            {errorMsg ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
            ) : !settings.security_pin ? (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                (Default PIN: 1234)
              </Text>
            ) : null}
          </View>

          {/* Randomized 3x4 Numeric Keypad */}
          <View style={styles.keypad}>
            <View style={styles.keypadRow}>
              {[scrambledDigits[0], scrambledDigits[1], scrambledDigits[2]].map((d) => (
                <KeypadButton
                  key={d}
                  digit={d}
                  onPress={() => handleDigitPress(d)}
                  textColor={colors.text}
                  bgColor={colors.surfaceSubtle}
                />
              ))}
            </View>

            <View style={styles.keypadRow}>
              {[scrambledDigits[3], scrambledDigits[4], scrambledDigits[5]].map((d) => (
                <KeypadButton
                  key={d}
                  digit={d}
                  onPress={() => handleDigitPress(d)}
                  textColor={colors.text}
                  bgColor={colors.surfaceSubtle}
                />
              ))}
            </View>

            <View style={styles.keypadRow}>
              {[scrambledDigits[6], scrambledDigits[7], scrambledDigits[8]].map((d) => (
                <KeypadButton
                  key={d}
                  digit={d}
                  onPress={() => handleDigitPress(d)}
                  textColor={colors.text}
                  bgColor={colors.surfaceSubtle}
                />
              ))}
            </View>

            <View style={styles.keypadRow}>
              {/* Left slot: Biometrics trigger if enabled, else spacer */}
              {settings.biometrics_enabled && biometricsAvailable ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleBiometricAuth}
                  style={[styles.keyButton, { backgroundColor: badgeBg }]}
                >
                  <Fingerprint size={24} color={badgeColor} />
                </TouchableOpacity>
              ) : (
                <View style={styles.keyButtonEmpty} />
              )}

              {/* 10th Scrambled Digit */}
              <KeypadButton
                digit={scrambledDigits[9]}
                onPress={() => handleDigitPress(scrambledDigits[9])}
                textColor={colors.text}
                bgColor={colors.surfaceSubtle}
              />

              {/* Backspace Delete Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeletePress}
                style={[styles.keyButton, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Delete size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cancel Footer */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelFooterBtn}
          >
            <Text style={[styles.cancelFooterText, { color: colors.textMuted }]}>
              Cancel Action
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface KeypadButtonProps {
  digit: number;
  onPress: () => void;
  textColor: string;
  bgColor: string;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ digit, onPress, textColor, bgColor }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      style={[styles.keyButton, { backgroundColor: bgColor }]}
    >
      <Text style={[styles.keyText, { color: textColor }]}>{digit}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  securityBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  keypad: {
    paddingHorizontal: 16,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 16,
  },
  keyButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyButtonEmpty: {
    flex: 1,
    height: 60,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  cancelFooterBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelFooterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
