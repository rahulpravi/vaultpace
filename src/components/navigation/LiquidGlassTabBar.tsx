import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme/useTheme';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react-native';

export const LiquidGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  // Floating bottom offset accounting for safe area
  const bottomOffset =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, 14)
      : Math.max(insets.bottom, 12) + 4;

  const getTabConfig = (routeName: string) => {
    switch (routeName) {
      case 'HomeTab':
        return {
          label: 'Home',
          Icon: LayoutDashboard,
        };
      case 'TransactionsTab':
        return {
          label: 'Ledger',
          Icon: Receipt,
        };
      case 'BudgetsTab':
        return {
          label: 'Report',
          Icon: BarChart3,
        };
      case 'AccountsTab':
        return {
          label: 'Wallets',
          Icon: Wallet,
        };
      case 'SettingsTab':
        return {
          label: 'Settings',
          Icon: SettingsIcon,
        };
      default:
        return {
          label: routeName,
          Icon: LayoutDashboard,
        };
    }
  };

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.glassPill,
          Platform.OS === 'web' && ({
            // Web CSS exact multi-layer inset box-shadow support
            boxShadow:
              '0.75em 0.75em 3em hsla(0,0%,0%,0.15) inset, 0 0.05em 0 hsla(0,0%,0%,0.05) inset, 0 -0.15em 0 hsla(0,0%,0%,0.1) inset, 0.75em 0.75em 1em hsla(0,0%,0%,0.1)',
          } as any),
        ]}
      >
        {/* Hardware-accelerated frosted blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 70}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />

        {/* User requested: background-color: hsl(0,0%,95%) */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: 'hsla(0, 0%, 95%, 0.92)',
            },
          ]}
        />

        {/* Inset shadow 1: 0.75em 0.75em 3em hsla(0,0%,0%,0.15) inset (Top-left diagonal vignette) */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.55, y: 0.55 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Inset shadow 2 & 3: Top & Bottom rim bevels */}
        <View style={styles.insetRimOverlay} pointerEvents="none" />

        {/* Soft bottom-right inner reflection highlight */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.45)']}
          start={{ x: 0.45, y: 0.45 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Tab Item Buttons */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { label, Icon } = getTabConfig(route.name);

            // On hsl(0,0%,95%) light pill, dark slate text provides optimal high contrast
            const activeColor = colors.accent;
            const inactiveColor = '#1E293B';
            const currentColor = isFocused ? activeColor : inactiveColor;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                testID={`tab-${route.name}`}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={styles.tabButton}
              >
                <View style={styles.iconContainer}>
                  <Icon
                    size={21}
                    color={currentColor}
                    strokeWidth={isFocused ? 2.6 : 2}
                  />
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    {
                      color: currentColor,
                      fontWeight: isFocused ? '800' : '600',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  glassPill: {
    width: '100%',
    height: 68,
    // border-radius: 2em (~32px)
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'hsl(0, 0%, 95%)',
    // Outer shadow: 0.75em 0.75em 1em hsla(0,0%,0%,0.1)
    shadowColor: '#000',
    shadowOffset: { width: 12, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  insetRimOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    // 0 0.05em 0 hsla(0,0%,0%,0.05) inset (top rim)
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    // 0 -0.15em 0 hsla(0,0%,0%,0.1) inset (bottom rim)
    borderBottomWidth: 2.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
