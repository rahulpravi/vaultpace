import React, { useEffect } from 'react';
import { StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PinLockScreen } from './src/components/security/PinLockScreen';
import { useAppTheme } from './src/theme/useTheme';
import { useStore } from './src/store/useStore';

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const { settings, isAppLocked, setIsAppLocked } = useStore();

  useEffect(() => {
    // If security lock is configured, require authentication on initial startup
    if (settings.biometrics_enabled || settings.pin_lock_enabled) {
      setIsAppLocked(true);
    }

    // Lock application when returning from background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (settings.biometrics_enabled || settings.pin_lock_enabled) {
          setIsAppLocked(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [settings.biometrics_enabled, settings.pin_lock_enabled, setIsAppLocked]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {isAppLocked ? <PinLockScreen /> : <RootNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
