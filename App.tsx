import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, AppState, View, Text, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { RootNavigator } from './src/navigation/RootNavigator';
import { PinLockScreen } from './src/components/security/PinLockScreen';
import { OnboardingSecurityModal } from './src/components/security/OnboardingSecurityModal';
import { CustomAlertModal } from './src/components/common/CustomAlertModal';
import { useAppTheme } from './src/theme/useTheme';
import { useStore } from './src/store/useStore';

// Prevent native splash screen from auto-hiding before theme and layouts are initialized
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Prevent unhandled rejections during hot reload or web preview */
});

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const settings = useStore((s) => s.settings);
  const isAppLocked = useStore((s) => s.isAppLocked);
  const setIsAppLocked = useStore((s) => s.setIsAppLocked);
  const hydrateSecurityPin = useStore((s) => s.hydrateSecurityPin);
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);

  const [splashFinished, setSplashFinished] = useState(false);
  const splashOpacity = useSharedValue(1);

  // Synchronize native root window background color immediately (pure black for dark splash)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#F8FAFC').catch(() => {});
  }, [isDark]);

  useEffect(() => {
    hydrateSecurityPin();

    // If security lock is configured and onboarding is complete, require authentication on initial startup
    if (hasCompletedOnboarding && (settings.biometrics_enabled || settings.pin_lock_enabled)) {
      setIsAppLocked(true);
    }

    // Lock application when returning from background based on auto_lock_interval
    let backgroundTime: number | null = null;
    let lastState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const hasLockConfigured =
        hasCompletedOnboarding && (settings.biometrics_enabled || settings.pin_lock_enabled);
      const autoLockPref = settings.auto_lock_interval || 'immediate';

      if (nextAppState === 'inactive' || nextAppState === 'background') {
        if (lastState === 'active') {
          backgroundTime = Date.now();
        }
      } else if (nextAppState === 'active' && lastState.match(/inactive|background/)) {
        if (hasLockConfigured && autoLockPref !== 'off') {
          const elapsed = backgroundTime ? Date.now() - backgroundTime : 0;
          let lockThresholdMs = 0;
          if (autoLockPref === '1m') lockThresholdMs = 60 * 1000;
          else if (autoLockPref === '5m') lockThresholdMs = 5 * 60 * 1000;
          else lockThresholdMs = 0; // 'immediate'

          if (elapsed >= lockThresholdMs) {
            setIsAppLocked(true);
          }
        }
        backgroundTime = null;
      }
      lastState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [
    hydrateSecurityPin,
    settings.biometrics_enabled,
    settings.pin_lock_enabled,
    settings.auto_lock_interval,
    setIsAppLocked,
    hasCompletedOnboarding,
  ]);

  const onLayoutRootView = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Ignored if splash already hidden
    }
    // Smooth zero-lag fade out transition (150ms)
    splashOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(setSplashFinished)(true);
      }
    });
  }, [splashOpacity]);

  const splashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const backgroundColor = colors.background;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: backgroundColor,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor }]} onLayout={onLayoutRootView}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={backgroundColor} />
        {isAppLocked && hasCompletedOnboarding ? <PinLockScreen /> : <RootNavigator />}
        {!hasCompletedOnboarding && <OnboardingSecurityModal visible={!hasCompletedOnboarding} />}
        <CustomAlertModal />
      </NavigationContainer>

      {!splashFinished && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.splashOverlay,
            { backgroundColor: isDark ? '#000000' : '#F8FAFC' },
            splashAnimatedStyle,
          ]}
        >
          {isDark ? (
            <View style={styles.darkLogoWrap}>
              <Image
                source={require('./assets/icon.png')}
                style={styles.splashLogo}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.lightLogoCard}>
              <Image
                source={require('./assets/icon.png')}
                style={styles.splashLogo}
                resizeMode="contain"
              />
            </View>
          )}

          <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            VaultPace
          </Text>
          <Text style={styles.brandSubtitle}>
            Private Financial Tracker
          </Text>
        </Animated.View>
      )}
    </View>
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
  splashOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  darkLogoWrap: {
    width: 110,
    height: 110,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  lightLogoCard: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  splashLogo: {
    width: 110,
    height: 110,
    borderRadius: 26,
    overflow: 'hidden',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 20,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
