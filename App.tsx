import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, AppState, View, Image } from 'react-native';
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

  // Synchronize native root window background color immediately
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? '#0B0F19' : '#F8FAFC').catch(() => {});
  }, [isDark]);

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

  const backgroundColor = isDark ? '#0B0F19' : '#F8FAFC';

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
            { backgroundColor },
            splashAnimatedStyle,
          ]}
        >
          <Image
            source={require('./assets/icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
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
  splashLogo: {
    width: 160,
    height: 160,
  },
});
