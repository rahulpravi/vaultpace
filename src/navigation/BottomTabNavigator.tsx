import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useTheme';
import { BottomTabParamList } from '../types';
import * as Haptics from 'expo-haptics';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Icons
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Settings,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutDashboard size={size - 2} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />

      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color, size, focused }) => (
            <Receipt size={size - 2} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />

      <Tab.Screen
        name="BudgetsTab"
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size, focused }) => (
            <BarChart3 size={size - 2} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />

      <Tab.Screen
        name="AccountsTab"
        component={AccountsScreen}
        options={{
          tabBarLabel: 'Wallets',
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet size={size - 2} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Settings size={size - 2} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selectionAsync(),
        }}
      />
    </Tab.Navigator>
  );
};
