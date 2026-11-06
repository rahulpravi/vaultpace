import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Keyboard,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useTheme';

export interface CustomAmountKeypadProps {
  value: string;
  onChange: (nextValue: string) => void;
  onClear?: () => void;
  maxLimit?: number; // Default 99,99,99,999
  allowDecimal?: boolean; // Default true
  maxDecimals?: number; // Default 2
  keyHeight?: number; // Default 52
  style?: StyleProp<ViewStyle>;
}

interface KeypadKeyProps {
  label?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  isSpecial?: boolean;
  height: number;
}

const KeypadKey: React.FC<KeypadKeyProps> = ({
  label,
  icon,
  onPress,
  onLongPress,
  isSpecial = false,
  height,
}) => {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  };

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  return (
    <Animated.View style={[styles.keyWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleTap}
        onLongPress={onLongPress ? handleLongPress : undefined}
        delayLongPress={300}
        accessibilityRole="button"
        accessibilityLabel={label || (icon ? 'Backspace or clear' : 'keypad key')}
        style={({ pressed }) => [
          styles.keyBtn,
          {
            height,
            backgroundColor: pressed
              ? colors.border
              : isSpecial
              ? colors.surfaceSubtle
              : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {icon ? (
          icon
        ) : (
          <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const CustomAmountKeypad: React.FC<CustomAmountKeypadProps> = ({
  value,
  onChange,
  onClear,
  maxLimit = 999999999, // 99,99,99,999
  allowDecimal = true,
  maxDecimals = 2,
  keyHeight = 52,
  style,
}) => {
  const { colors } = useAppTheme();

  const handleDigit = (digit: string) => {
    // 1. If currently empty
    if (!value || value === '') {
      if (digit === '0') {
        onChange('0');
      } else {
        onChange(digit);
      }
      return;
    }

    // 2. If currently "0"
    if (value === '0') {
      if (digit === '0') {
        // Prevent "000" leading zeros
        return;
      }
      // Replace lone 0 with new digit (e.g. '5' instead of '05')
      onChange(digit);
      return;
    }

    // 3. If decimal point is present
    if (value.includes('.')) {
      const parts = value.split('.');
      const decimals = parts[1] || '';
      if (decimals.length >= maxDecimals) {
        // Limit to maxDecimals (default 2 paise)
        return;
      }
      onChange(value + digit);
      return;
    }

    // 4. Regular integer number - enforce maxLimit
    const candidate = value + digit;
    const parsed = parseFloat(candidate);
    if (!isNaN(parsed) && parsed > maxLimit) {
      return;
    }
    onChange(candidate);
  };

  const handleDot = () => {
    if (!allowDecimal) return;
    if (value.includes('.')) return; // Only 1 decimal allowed

    if (!value || value === '' || value === '0') {
      onChange('0.');
    } else {
      onChange(value + '.');
    }
  };

  const handleBackspace = () => {
    if (!value || value.length === 0) return;
    const next = value.slice(0, -1);
    onChange(next);
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Row 1 */}
      <View style={styles.row}>
        <KeypadKey label="1" onPress={() => handleDigit('1')} height={keyHeight} />
        <KeypadKey label="2" onPress={() => handleDigit('2')} height={keyHeight} />
        <KeypadKey label="3" onPress={() => handleDigit('3')} height={keyHeight} />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <KeypadKey label="4" onPress={() => handleDigit('4')} height={keyHeight} />
        <KeypadKey label="5" onPress={() => handleDigit('5')} height={keyHeight} />
        <KeypadKey label="6" onPress={() => handleDigit('6')} height={keyHeight} />
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <KeypadKey label="7" onPress={() => handleDigit('7')} height={keyHeight} />
        <KeypadKey label="8" onPress={() => handleDigit('8')} height={keyHeight} />
        <KeypadKey label="9" onPress={() => handleDigit('9')} height={keyHeight} />
      </View>

      {/* Row 4: . | 0 | ⌫ */}
      <View style={styles.row}>
        {allowDecimal ? (
          <KeypadKey
            label="."
            onPress={handleDot}
            isSpecial={true}
            height={keyHeight}
          />
        ) : (
          <View style={styles.keyWrapper} />
        )}

        <KeypadKey label="0" onPress={() => handleDigit('0')} height={keyHeight} />

        <KeypadKey
          icon={<Delete size={22} color={colors.text} />}
          onPress={handleBackspace}
          onLongPress={handleClear}
          isSpecial={true}
          height={keyHeight}
        />
      </View>
    </View>
  );
};

export interface AmountDisplayProps {
  value: string;
  currencySymbol?: string;
  placeholder?: string;
  isFocused?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  currencyStyle?: StyleProp<TextStyle>;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  value,
  currencySymbol = '₹',
  placeholder = '0.00',
  isFocused = false,
  onPress,
  style,
  valueStyle,
  currencyStyle,
}) => {
  const { colors } = useAppTheme();
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      setCursorBlink((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [isFocused]);

  const handlePress = () => {
    // Strictly dismiss any system keyboard that might be open
    Keyboard.dismiss();
    onPress?.();
  };

  const hasValue = Boolean(value && value.length > 0);

  return (
    <Pressable
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Amount ${hasValue ? value : placeholder} ${currencySymbol}`}
      style={[
        styles.amountDisplayContainer,
        {
          borderColor: isFocused ? colors.accent : 'transparent',
          backgroundColor: isFocused ? colors.surfaceSubtle : 'transparent',
        },
        style,
      ]}
    >
      <View style={styles.amountDisplayRow}>
        <Text
          style={[
            styles.currencySymbol,
            { color: colors.accent },
            currencyStyle,
          ]}
        >
          {currencySymbol}
        </Text>
        <Text
          style={[
            styles.amountText,
            {
              color: hasValue ? colors.text : colors.textMuted + '80',
            },
            valueStyle,
          ]}
        >
          {hasValue ? value : placeholder}
        </Text>
        {isFocused && (
          <View
            style={[
              styles.cursor,
              {
                backgroundColor: colors.accent,
                opacity: cursorBlink ? 1 : 0,
              },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  keyWrapper: {
    flex: 1,
  },
  keyBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  amountDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 74,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    marginRight: 6,
    letterSpacing: -0.5,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  cursor: {
    width: 3,
    height: 38,
    borderRadius: 2,
    marginLeft: 4,
  },
});

