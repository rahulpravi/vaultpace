import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';
import { Account } from '../../types';
import {
  WalletCreditCard,
  CARD_HEIGHT,
  CARD_WIDTH,
  PEEK_HEIGHT,
} from './WalletCreditCard';
import { useAppTheme } from '../../theme/useTheme';
import {
  Layers,
  Plus,
  CreditCard as CreditCardIcon,
  ArrowRight,
} from 'lucide-react-native';

const EXPANDED_GAP = CARD_HEIGHT + 14;

interface AppleWalletCardStackProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
  onManageAccounts?: () => void;
  onAddAccount?: () => void;
}

interface AnimatedCardProps {
  account: Account;
  slotIndex: number;
  totalCards: number;
  isFront: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onPress: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = React.memo(({
  account,
  slotIndex,
  totalCards,
  isFront,
  isSelected,
  isExpanded,
  onPress,
}) => {
  const animatedSlot = useSharedValue(slotIndex);
  const animatedExpanded = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    animatedSlot.value = withSpring(slotIndex, {
      damping: 18,
      stiffness: 140,
      mass: 0.85,
    });
  }, [slotIndex]);

  useEffect(() => {
    animatedExpanded.value = withSpring(isExpanded ? 1 : 0, {
      damping: 18,
      stiffness: 140,
      mass: 0.85,
    });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => {
    // In stacked mode, cards offset vertically by PEEK_HEIGHT (52px)
    // In expanded mode, cards fan out with full separation
    const stackedY = animatedSlot.value * PEEK_HEIGHT;
    const expandedY = animatedSlot.value * EXPANDED_GAP;
    const translateY = interpolate(
      animatedExpanded.value,
      [0, 1],
      [stackedY, expandedY]
    );

    // Subtle scale perspective for cards deeper in the stack
    const stackedScale = Math.max(0.92, 1 - animatedSlot.value * 0.02);
    const scale = interpolate(animatedExpanded.value, [0, 1], [stackedScale, 1]);

    // Front card always has the highest zIndex and highest Android elevation
    const zIndex = Math.round(100 - animatedSlot.value * 10);
    const elevation = Math.max(1, Math.round(20 - animatedSlot.value * 3));
    // Full opacity (1) to eliminate any background text bleed or ghosting
    const opacity = 1;

    return {
      transform: [{ translateY }, { scale }],
      zIndex,
      elevation,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.animatedCardWrapper,
        animatedStyle,
        {
          zIndex: isFront ? 100 : Math.round(50 - slotIndex * 5),
          elevation: isFront ? 20 : Math.max(1, Math.round(10 - slotIndex)),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.cardTouchable}
      >
        <WalletCreditCard
          account={account}
          isActive={isSelected}
          isFront={isFront}
          isExpanded={isExpanded}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

export const AppleWalletCardStack: React.FC<AppleWalletCardStackProps> = React.memo(({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onManageAccounts,
  onAddAccount,
}) => {
  const { colors } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(
    selectedAccountId || accounts[0]?.id || null
  );

  // Sync active card if selectedAccountId changes externally
  useEffect(() => {
    if (selectedAccountId) {
      setActiveCardId(selectedAccountId);
    } else if (!activeCardId && accounts.length > 0) {
      setActiveCardId(accounts[0].id);
    }
  }, [selectedAccountId, accounts]);

  // If active card was deleted, fallback to first account
  useEffect(() => {
    if (activeCardId && !accounts.some((a) => a.id === activeCardId)) {
      setActiveCardId(accounts[0]?.id || null);
    }
  }, [accounts, activeCardId]);

  if (accounts.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: colors.accentLight },
          ]}
        >
          <CreditCardIcon size={22} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Wallets Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Create cash, bank, or savings wallets to start tracking your net worth.
        </Text>
        {onAddAccount && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAddAccount}
            style={[styles.addWalletBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={16} color={colors.onAccent} strokeWidth={2.5} />
            <Text style={[styles.addWalletText, { color: colors.onAccent }]}>
              Add Wallet
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Active account is always slot 0 (front of the stack).
  // Remaining accounts occupy slots 1, 2, 3... preserving order.
  const getSlotIndex = (accountId: string): number => {
    if (accountId === activeCardId) return 0;
    const remaining = accounts.filter((a) => a.id !== activeCardId);
    const indexInRemaining = remaining.findIndex((a) => a.id === accountId);
    return indexInRemaining + 1;
  };

  const handleCardPress = (accountId: string) => {
    triggerHaptic('medium');

    if (accountId === activeCardId) {
      // Tapping the front card toggles expand/collapse
      setIsExpanded((prev) => !prev);
      if (selectedAccountId === accountId && isExpanded) {
        onSelectAccount(null);
      } else {
        onSelectAccount(accountId);
      }
    } else {
      // Tapping a background card brings it smoothly to the front and expands
      setActiveCardId(accountId);
      onSelectAccount(accountId);
      setIsExpanded(true);
    }
  };

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded((prev) => !prev);
  };

  // Stack container dynamic height
  const stackHeight = isExpanded
    ? accounts.length * EXPANDED_GAP + 10
    : CARD_HEIGHT + (accounts.length - 1) * PEEK_HEIGHT + 14;

  return (
    <View style={styles.rootContainer}>
      {/* =========================================================================
          SECTION HEADER: Horizontal Single-Row Flex (Guaranteed No Stacking)
          ========================================================================= */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Wallets & Accounts
          </Text>

          <View
            style={[
              styles.badgePill,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>
              {accounts.length} {accounts.length === 1 ? 'Card' : 'Cards'}
            </Text>
          </View>

          {/* Standalone Icon Button (No text, clean standalone pill) */}
          {accounts.length > 1 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleExpand}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isExpanded
                    ? colors.accentLight
                    : colors.surface,
                  borderColor: isExpanded ? colors.accent : colors.border,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Layers
                size={13}
                color={isExpanded ? colors.accent : colors.textMuted}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Manage Button on the right */}
        {onManageAccounts && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onManageAccounts}
            style={styles.manageButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.manageText, { color: colors.accent }]}>
              Manage
            </Text>
            <ArrowRight
              size={13}
              color={colors.accent}
              strokeWidth={2.4}
              style={{ marginLeft: 3 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =========================================================================
          STACKED OVERLAPPING CARDS CONTAINER
          ========================================================================= */}
      <View
        style={[
          styles.stackContainer,
          {
            height: stackHeight,
          },
        ]}
      >
        {accounts.map((acc) => {
          const slot = getSlotIndex(acc.id);
          const isFront = slot === 0;
          const isSelected = selectedAccountId === acc.id;

          return (
            <AnimatedCard
              key={acc.id}
              account={acc}
              slotIndex={slot}
              totalCards={accounts.length}
              isFront={isFront}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onPress={() => handleCardPress(acc.id)}
            />
          );
        })}
      </View>

      {/* Stack Interactive Hint Footer */}
      {accounts.length > 1 && (
        <View style={styles.footerRow}>
          <Text style={[styles.footerHint, { color: colors.textMuted }]}>
            {isExpanded
              ? 'Tap card to select & stack'
              : 'Tap any peeking card to bring to front'}
          </Text>

          {selectedAccountId && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onSelectAccount(null);
              }}
            >
              <Text style={[styles.showAllText, { color: colors.accent }]}>
                Show All Wallets
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 999,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  manageText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stackContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  animatedCardWrapper: {
    position: 'absolute',
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    opacity: 1,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 10,
    width: '100%',
  },
  footerHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  showAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  addWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addWalletText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
