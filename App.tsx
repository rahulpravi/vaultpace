import React, { useEffect } from 'react';
import { StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PinLockScreen } from './src/components/security/PinLockScreen';
import { OnboardingSecurityModal } from './src/components/security/OnboardingSecurityModal';
import { CustomAlertModal } from './src/components/common/CustomAlertModal';
import { useAppTheme } from './src/theme/useTheme';
import { useStore } from './src/store/useStore';

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const settings = useStore((s) => s.settings);
  const isAppLocked = useStore((s) => s.isAppLocked);
  const setIsAppLocked = useStore((s) => s.setIsAppLocked);
  const hydrateSecurityPin = useStore((s) => s.hydrateSecurityPin);
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    hydrateSecurityPin();

    // If security lock is configured and onboarding is complete, require authentication on initial startup
    if (hasCompletedOnboarding && (settings.biometrics_enabled || settings.pin_lock_enabled)) {
      setIsAppLocked(true);
    }

    // Lock application when returning from background
    let lastState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (lastState.match(/inactive|background/) && nextAppState === 'active') {
        if (hasCompletedOnboarding && (settings.biometrics_enabled || settings.pin_lock_enabled)) {
          setIsAppLocked(true);
        }
      }
      lastState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hydrateSecurityPin, settings.biometrics_enabled, settings.pin_lock_enabled, setIsAppLocked, hasCompletedOnboarding]);

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
      {isAppLocked && hasCompletedOnboarding ? <PinLockScreen /> : <RootNavigator />}
      {!hasCompletedOnboarding && <OnboardingSecurityModal visible={!hasCompletedOnboarding} />}
      <CustomAlertModal />
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
