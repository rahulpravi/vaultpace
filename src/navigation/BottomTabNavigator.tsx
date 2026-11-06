import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';
import { LiquidGlassTabBar } from '../components/navigation/LiquidGlassTabBar';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TransactionsTab" component={TransactionsScreen} />
      <Tab.Screen name="BudgetsTab" component={BudgetsScreen} />
      <Tab.Screen name="AccountsTab" component={AccountsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

