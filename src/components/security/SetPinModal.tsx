import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAppTheme } from '../../theme/useTheme';
import { useStore } from '../../store/useStore';
import * as Haptics from 'expo-haptics';
import { X, Lock, CheckCircle2, Delete } from 'lucide-react-native';

interface SetPinModalProps {
  visible: boolean;
  onClose: () => void;
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

export const SetPinModal: React.FC<SetPinModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors } = useAppTheme();
  const { setSecurityPin } = useStore();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scrambledDigits, setScrambledDigits] = useState<number[]>(() => shuffleDigits());

  const currentPin = step === 'create' ? firstPin : confirmPin;

  const resetAll = () => {
    setStep('create');
    setFirstPin('');
    setConfirmPin('');
    setErrorMsg(null);
    setScrambledDigits(shuffleDigits());
  };

  const handleDigitPress = (digit: number) => {
    if (currentPin.length >= 4) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg(null);

    const updated = currentPin + digit.toString();

    if (step === 'create') {
      setFirstPin(updated);
      if (updated.length === 4) {
        // Move to confirm step
        setTimeout(() => {
          setStep('confirm');
          setScrambledDigits(shuffleDigits());
          Haptics.selectionAsync();
        }, 200);
      }
    } else {
      setConfirmPin(updated);
      if (updated.length === 4) {
        if (updated === firstPin) {
          // Success!
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSecurityPin(updated);
          Alert.alert(
            'Security PIN Configured',
            'Your 4-digit PIN is now active. You will be prompted to enter it whenever you access VaultPace.'
          );
          resetAll();
          onSuccess?.();
          onClose();
        } else {
          // Mismatch
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setErrorMsg('PINs do not match. Please start over.');
          setTimeout(() => {
            resetAll();
          }, 800);
        }
      }
    }
  };

  const handleDeletePress = () => {
    if (currentPin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (step === 'create') {
        setFirstPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
      setErrorMsg(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.lockIconBox, { backgroundColor: colors.accentLight }]}>
                <Lock size={18} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {step === 'create' ? 'Create 4-Digit PIN' : 'Confirm Your PIN'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                resetAll();
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Step text */}
          <View style={styles.instructionBox}>
            <Text style={[styles.instructionText, { color: colors.textMuted }]}>
              {step === 'create'
                ? 'Enter a 4-digit PIN to secure your local financial vault.'
                : 'Re-enter your 4-digit PIN to confirm.'}
            </Text>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = currentPin.length > index;
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
              <Text style={[styles.scrambleText, { color: colors.textMuted }]}>
                Scrambled keypad prevents shoulder spying
              </Text>
            )}
          </View>

          {/* Keypad */}
          <View style={styles.keypadBox}>
            {/* Row 1 */}
            <View style={styles.keypadRow}>
              {scrambledDigits.slice(0, 3).map((digit) => (
                <TouchableOpacity
                  key={`p-${digit}`}
                  onPress={() => handleDigitPress(digit)}
                  style={[styles.keyBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2 */}
            <View style={styles.keypadRow}>
              {scrambledDigits.slice(3, 6).map((digit) => (
                <TouchableOpacity
                  key={`p-${digit}`}
                  onPress={() => handleDigitPress(digit)}
                  style={[styles.keyBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 3 */}
            <View style={styles.keypadRow}>
              {scrambledDigits.slice(6, 9).map((digit) => (
                <TouchableOpacity
                  key={`p-${digit}`}
                  onPress={() => handleDigitPress(digit)}
                  style={[styles.keyBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 4 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                onPress={() => setScrambledDigits(shuffleDigits())}
                style={[styles.keyBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>SHUFFLE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDigitPress(scrambledDigits[9])}
                style={[styles.keyBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Text style={[styles.keyText, { color: colors.text }]}>{scrambledDigits[9]}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeletePress}
                style={[styles.keyBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Delete size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
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
    marginVertical: 18,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  scrambleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  keypadBox: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
  },
});
