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
import { Delete, Equal } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useTheme';
import { evaluateMathExpression, hasArithmeticOperator } from '../../utils/calculator';

export interface CustomAmountKeypadProps {
  value: string;
  onChange: (nextValue: string) => void;
  onClear?: () => void;
  onEvaluate?: (result: number) => void;
  showCalculator?: boolean; // Default true
  maxLimit?: number; // Default 99,99,99,999
  allowDecimal?: boolean; // Default true
  maxDecimals?: number; // Default 2
  keyHeight?: number; // Default 48
  style?: StyleProp<ViewStyle>;
}

interface KeypadKeyProps {
  label?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  isSpecial?: boolean;
  isOperator?: boolean;
  isEquals?: boolean;
  height: number;
  customStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const KeypadKey: React.FC<KeypadKeyProps> = React.memo(({
  label,
  icon,
  onPress,
  onLongPress,
  isSpecial = false,
  isOperator = false,
  isEquals = false,
  height,
  customStyle,
  textStyle,
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
    if (isEquals) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
    }
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (pressed) return colors.border;
    if (isEquals) return colors.accent;
    if (isOperator) return colors.surfaceSubtle;
    if (isSpecial) return colors.surfaceSubtle;
    return colors.card;
  };

  const getTextColor = () => {
    if (isEquals) return colors.onAccent;
    if (isOperator) return colors.accent;
    return colors.text;
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
        accessibilityLabel={label || (icon ? 'Key' : 'keypad key')}
        style={({ pressed }) => [
          styles.keyBtn,
          {
            height,
            backgroundColor: getBackgroundColor(pressed),
            borderColor: isEquals ? colors.accent : colors.border,
          },
          customStyle,
        ]}
      >
        {icon ? (
          icon
        ) : (
          <Text
            style={[
              styles.keyText,
              { color: getTextColor(), fontWeight: isOperator || isEquals ? '800' : '700' },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
});

export const CustomAmountKeypad: React.FC<CustomAmountKeypadProps> = ({
  value,
  onChange,
  onClear,
  onEvaluate,
  showCalculator = true,
  maxLimit = 999999999, // 99,99,99,999
  allowDecimal = true,
  maxDecimals = 2,
  keyHeight = 48,
  style,
}) => {
  const { colors } = useAppTheme();

  // Helper to extract the operand currently being typed (after the last operator)
  const getCurrentOperand = (inputStr: string): string => {
    const parts = inputStr.split(/[+\-×÷*/]/);
    return parts[parts.length - 1].trim();
  };

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

    const currentOperand = getCurrentOperand(value);

    // 2. Prevent leading zeros in current operand: e.g. "0" + "0" -> "0"
    if (currentOperand === '0') {
      if (digit === '0') {
        return; // Prevent "00"
      }
      // Replace lone 0 with new digit
      const prefix = value.slice(0, value.length - 1);
      onChange(prefix + digit);
      return;
    }

    // 3. If decimal point is present in current operand
    if (currentOperand.includes('.')) {
      const parts = currentOperand.split('.');
      const decimals = parts[1] || '';
      if (decimals.length >= maxDecimals) {
        // Limit to maxDecimals (default 2 paise)
        return;
      }
      onChange(value + digit);
      return;
    }

    // 4. Regular number - enforce maxLimit on current operand
    const candidateOperand = currentOperand + digit;
    const parsed = parseFloat(candidateOperand);
    if (!isNaN(parsed) && parsed > maxLimit) {
      return;
    }

    onChange(value + digit);
  };

  const handleDot = () => {
    if (!allowDecimal) return;

    if (!value || value === '') {
      onChange('0.');
      return;
    }

    const currentOperand = getCurrentOperand(value);

    // If current operand already has a dot, reject
    if (currentOperand.includes('.')) return;

    if (!currentOperand || currentOperand === '') {
      // If user presses dot right after an operator, e.g. "500 + ." -> "500 + 0."
      onChange(value + '0.');
    } else {
      onChange(value + '.');
    }
  };

  const handleOperator = (op: '+' | '-' | '×' | '÷') => {
    if (!value || value === '') {
      if (op === '-') {
        onChange('-');
      }
      return;
    }

    const trimmed = value.trim();
    const lastChar = trimmed.slice(-1);

    // If the input already ends with an operator, replace it
    if (['+', '-', '×', '÷', '*', '/'].includes(lastChar)) {
      const withoutLast = trimmed.slice(0, -1).trim();
      onChange(`${withoutLast} ${op} `);
    } else {
      onChange(`${trimmed} ${op} `);
    }
  };

  const handleEquals = () => {
    if (!value || !value.trim()) return;

    const evaluated = evaluateMathExpression(value);
    if (evaluated !== null && !isNaN(evaluated)) {
      // Round to maximum decimals and format cleanly
      const rounded = Math.round(evaluated * 100) / 100;
      const formatted = rounded.toString();
      onChange(formatted);
      onEvaluate?.(rounded);
    }
  };

  const handleBackspace = () => {
    if (!value || value.length === 0) return;

    // If the value ends with " op " (e.g. " + "), remove all 3 characters
    if (value.endsWith(' ')) {
      const trimmed = value.trim();
      const withoutOp = trimmed.slice(0, -1).trim();
      onChange(withoutOp);
      return;
    }

    const next = value.slice(0, -1);
    onChange(next);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Optional Mini-Calculator Operator Row: + | - | × | ÷ | = */}
      {showCalculator && (
        <View style={styles.operatorRow}>
          <KeypadKey
            label="+"
            isOperator={true}
            onPress={() => handleOperator('+')}
            height={keyHeight - 4}
          />
          <KeypadKey
            label="-"
            isOperator={true}
            onPress={() => handleOperator('-')}
            height={keyHeight - 4}
          />
          <KeypadKey
            label="×"
            isOperator={true}
            onPress={() => handleOperator('×')}
            height={keyHeight - 4}
          />
          <KeypadKey
            label="÷"
            isOperator={true}
            onPress={() => handleOperator('÷')}
            height={keyHeight - 4}
          />
          <KeypadKey
            label="="
            isEquals={true}
            onPress={handleEquals}
            height={keyHeight - 4}
          />
        </View>
      )}

      {/* Row 1: 1 | 2 | 3 */}
      <View style={styles.row}>
        <KeypadKey label="1" onPress={() => handleDigit('1')} height={keyHeight} />
        <KeypadKey label="2" onPress={() => handleDigit('2')} height={keyHeight} />
        <KeypadKey label="3" onPress={() => handleDigit('3')} height={keyHeight} />
      </View>

      {/* Row 2: 4 | 5 | 6 */}
      <View style={styles.row}>
        <KeypadKey label="4" onPress={() => handleDigit('4')} height={keyHeight} />
        <KeypadKey label="5" onPress={() => handleDigit('5')} height={keyHeight} />
        <KeypadKey label="6" onPress={() => handleDigit('6')} height={keyHeight} />
      </View>

      {/* Row 3: 7 | 8 | 9 */}
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
          icon={<Delete size={20} color={colors.text} />}
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
    // Strictly dismiss system keyboard
    Keyboard.dismiss();
    onPress?.();
  };

  const hasValue = Boolean(value && value.length > 0);
  const isExpression = hasArithmeticOperator(value);
  const liveResult = isExpression ? evaluateMathExpression(value) : null;

  // Format the live evaluation result
  const liveResultFormatted =
    liveResult !== null && !isNaN(liveResult)
      ? (Math.round(liveResult * 100) / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

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
      {/* Subtle Expression Header Line (when typing a calculation) */}
      {isExpression && (
        <View style={styles.expressionHeaderRow}>
          <Text style={[styles.expressionPreview, { color: colors.textMuted }]}>
            EXPRESSION:{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{value}</Text>
          </Text>
        </View>
      )}

      {/* Main Input Line */}
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
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={[
            styles.amountText,
            {
              color: hasValue ? colors.text : colors.textMuted + '80',
              fontSize: isExpression ? 30 : 38,
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
                height: isExpression ? 30 : 36,
              },
            ]}
          />
        )}
      </View>

      {/* Live Result Preview Badge (when calculation expression is valid) */}
      {isExpression && liveResultFormatted !== null && (
        <View
          style={[
            styles.liveResultBadge,
            { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' },
          ]}
        >
          <Equal size={12} color={colors.accent} />
          <Text style={[styles.liveResultText, { color: colors.accent }]}>
            {currencySymbol}
            {liveResultFormatted} (Live)
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
    gap: 7,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
    fontSize: 20,
    letterSpacing: -0.5,
  },
  amountDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 74,
  },
  expressionHeaderRow: {
    marginBottom: 4,
  },
  expressionPreview: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 6,
    letterSpacing: -0.5,
  },
  amountText: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  cursor: {
    width: 3,
    borderRadius: 2,
    marginLeft: 4,
  },
  liveResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  liveResultText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
