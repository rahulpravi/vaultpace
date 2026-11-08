import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Account } from '../../types';
import { formatCurrency } from '../../store/useStore';
import {
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard as CreditCardIcon,
  Briefcase,
  AlertTriangle,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 380);
export const CARD_HEIGHT = 188;
export const PEEK_HEIGHT = 52;

interface WalletCreditCardProps {
  account: Account;
  isActive?: boolean;
  isFront?: boolean;
  isExpanded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Clean Contactless / Wireless NFC Icon (·))) matching reference image
 */
export const ContactlessNfcIcon: React.FC<{
  size?: number;
  color?: string;
}> = React.memo(({ size = 20, color = 'rgba(255, 255, 255, 0.85)' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center signal dot */}
      <Circle cx="5.5" cy="12" r="1.3" fill={color} />
      {/* Arc 1 */}
      <Path
        d="M9.5 8.5C10.8 9.5 11.5 10.7 11.5 12C11.5 13.3 10.8 14.5 9.5 15.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Arc 2 */}
      <Path
        d="M13.5 6C15.6 7.6 16.8 9.7 16.8 12C16.8 14.3 15.6 16.4 13.5 18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Arc 3 */}
      <Path
        d="M17.5 3.5C20.5 5.8 22 8.7 22 12C22 15.3 20.5 18.2 17.5 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
});

/**
 * Subtle curved background lines pattern (matching reference image curves)
 */
export const CardCurvesPattern: React.FC = React.memo(() => {
  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      width="100%"
      height="100%"
      viewBox="0 0 360 188"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      {/* Sweeping concentric arcs */}
      <Circle
        cx="320"
        cy="-30"
        r="140"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="1.2"
        fill="none"
      />
      <Circle
        cx="320"
        cy="-30"
        r="190"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="1.2"
        fill="none"
      />
      <Circle
        cx="320"
        cy="-30"
        r="240"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth="1.2"
        fill="none"
      />
      <Circle
        cx="320"
        cy="-30"
        r="290"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Flowing horizontal wave contours */}
      <Path
        d="M -30 130 C 80 110, 180 160, 390 120"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M -30 160 C 90 140, 200 190, 390 150"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth="1.2"
        fill="none"
      />
    </Svg>
  );
});

export const WalletCreditCard: React.FC<WalletCreditCardProps> = React.memo(({
  account,
  isActive = false,
  isFront = false,
  isExpanded = false,
  style,
}) => {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'savings':
        return PiggyBank;
      case 'credit':
        return CreditCardIcon;
      case 'investment':
        return Briefcase;
      default:
        return Wallet;
    }
  };

  const IconComponent = getAccountIcon(account.account_type);

  // Curated Luxury Gradients tailored for Apple Wallet aesthetics
  const getCardTheme = () => {
    switch (account.account_type) {
      case 'cash':
        return {
          gradient: ['#05825b', '#046748', '#023827'] as const,
          accentColor: '#34d399',
          typeLabel: 'cash wallet',
        };
      case 'bank':
        return {
          gradient: ['#1d4ed8', '#1e3a8a', '#0f172a'] as const,
          accentColor: '#38bdf8',
          typeLabel: 'checking account',
        };
      case 'savings':
        return {
          gradient: ['#b45309', '#853a06', '#451a03'] as const,
          accentColor: '#fbbf24',
          typeLabel: 'savings vault',
        };
      case 'credit':
        return {
          gradient: ['#334155', '#1e293b', '#0b1120'] as const,
          accentColor: '#94a3b8',
          typeLabel: 'credit line',
        };
      case 'investment':
        return {
          gradient: ['#6d28d9', '#4c1d95', '#1e1b4b'] as const,
          accentColor: '#c084fc',
          typeLabel: 'portfolio',
        };
      default:
        return {
          gradient: [account.color || '#05825b', '#046748', '#023827'] as const,
          accentColor: '#34d399',
          typeLabel: account.account_type || 'wallet',
        };
    }
  };

  const theme = getCardTheme();
  const isNegative = account.current_balance < 0;

  // Masked number derived from ID (last 4 characters/digits)
  const last4 =
    account.id.replace(/[^0-9a-zA-Z]/g, '').slice(-4).toUpperCase() || '1694';
  const maskedNumber = `•••• •••• •••• ${last4}`;

  const showFullContent = isFront || isExpanded;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        },
        isActive && isFront && styles.activeCardGlow,
        style,
      ]}
    >
      {/* Base Luxury Gradient */}
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Subtle curved background lines matching reference image */}
        <CardCurvesPattern />

        {/* Specular glass highlight overlay */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.16)',
            'rgba(255, 255, 255, 0.02)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {showFullContent ? (
          /* =========================================================================
             ACTIVE / EXPANDED FULL CARD VIEW (Exact match to reference image)
             ========================================================================= */
          <View style={styles.fullCardContent}>
            {/* Top Header Row */}
            <View style={styles.topHeader}>
              <View style={styles.topLeft}>
                {/* Rounded squarish icon badge */}
                <View style={styles.iconAvatar}>
                  <IconComponent size={18} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {account.name}
                  </Text>
                  <Text style={styles.availableBalanceLabel}>
                    AVAILABLE BALANCE
                  </Text>
                </View>
              </View>

              {/* Wireless / NFC Contactless Wave Icon */}
              <View style={styles.topRight}>
                <ContactlessNfcIcon
                  size={20}
                  color="rgba(255, 255, 255, 0.85)"
                />
              </View>
            </View>

            {/* Middle Section: Large Prominent Balance */}
            <View style={styles.middleSection}>
              <View style={styles.balanceRow}>
                <Text
                  style={[
                    styles.balanceAmount,
                    isNegative && styles.negativeBalanceText,
                  ]}
                  numberOfLines={1}
                >
                  {formatCurrency(account.current_balance, account.currency)}
                </Text>
                {isNegative && (
                  <View style={styles.negativeBadge}>
                    <AlertTriangle size={12} color="#fca5a5" strokeWidth={2.4} />
                    <Text style={styles.negativeBadgeText}>Deficit</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom Row */}
            <View style={styles.bottomRow}>
              <Text style={styles.subLabelText} numberOfLines={1}>
                {account.name.toLowerCase()}
              </Text>
              <View style={styles.bottomRightInfo}>
                {account.transaction_count !== undefined &&
                account.transaction_count > 0 ? (
                  <Text style={styles.movesText}>
                    {account.transaction_count}{' '}
                    {account.transaction_count === 1 ? 'move' : 'moves'}
                  </Text>
                ) : (
                  <Text style={styles.maskedNumberText}>{maskedNumber}</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* =========================================================================
             INACTIVE / STACKED MINIMAL PEEKING VIEW (Matches blue cards in reference)
             ========================================================================= */
          <View style={styles.peekingContainer}>
            <View style={styles.peekingEdgeStrip}>
              <Text style={styles.peekingWalletName} numberOfLines={1}>
                {account.name}
              </Text>
              <View style={styles.peekingBalanceRow}>
                {isNegative && (
                  <AlertTriangle
                    size={13}
                    color="#fca5a5"
                    strokeWidth={2.4}
                    style={{ marginRight: 5 }}
                  />
                )}
                <Text
                  style={[
                    styles.peekingBalanceAmount,
                    isNegative && styles.negativeBalanceText,
                  ]}
                  numberOfLines={1}
                >
                  {formatCurrency(account.current_balance, account.currency)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    opacity: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  activeCardGlow: {
    borderColor: 'rgba(255, 255, 255, 0.38)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.48,
    shadowRadius: 22,
    elevation: 14,
  },
  cardGradient: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    backgroundColor: '#0F172A',
    opacity: 1,
  },
  fullCardContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerTextGroup: {
    flex: 1,
  },
  cardName: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  availableBalanceLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  topRight: {
    paddingLeft: 8,
  },
  middleSection: {
    marginVertical: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  negativeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    gap: 4,
  },
  negativeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fca5a5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  negativeBalanceText: {
    color: '#fca5a5', // Soft coral/salmon red matching the reference image exactly
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.1,
  },
  bottomRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskedNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  movesText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  peekingContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  peekingEdgeStrip: {
    height: PEEK_HEIGHT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  peekingWalletName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  peekingBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peekingBalanceAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
});
