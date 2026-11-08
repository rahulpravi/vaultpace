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
  const { colors, isDark } = useAppTheme();

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

  // User requested Theme Colors
  const activeColor = '#10B981';
  const inactiveColor = isDark ? '#9CA3AF' : '#64748B';

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
          isDark ? styles.darkPill : styles.lightPill,
          Platform.OS === 'web' && ({
            boxShadow: isDark
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          } as any),
        ]}
      >
        {/* Hardware-accelerated frosted blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? (isDark ? 55 : 65) : 70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Dynamic Theme Background Fill */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: isDark
                ? 'rgba(17, 24, 39, 0.94)' // Dark Mode #111827
                : 'rgba(255, 255, 255, 0.94)', // Light Mode #FFFFFF
            },
          ]}
        />

        {/* Subtle Vignette Gradient */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.04)', 'transparent', 'rgba(0, 0, 0, 0.25)']
              : ['rgba(0, 0, 0, 0.04)', 'transparent', 'rgba(255, 255, 255, 0.45)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Subtle Top & Bottom Rim Bevels */}
        <View
          style={[
            styles.insetRimOverlay,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Tab Item Buttons */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { label, Icon } = getTabConfig(route.name);
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
                    strokeWidth={isFocused ? 2.5 : 2}
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
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  darkPill: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  lightPill: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  insetRimOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1.5,
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
