# VaultPace Mobile (React Native + Expo)

Production-ready mobile fund and transaction tracker rewritten from Next.js web application for iOS and Android.

## Tech Stack
- **Framework:** Expo SDK 51 / React Native (Cross-platform iOS & Android)
- **Navigation:** React Navigation v6 (Native Stack + Custom Bottom Tab Bar)
- **State Management:** Zustand with `@react-native-async-storage/async-storage` persistence
- **Styling:** NativeWind (Tailwind CSS for React Native) + Dynamic Theme Engine (Light / Dark / Auto + 10 Accent Palettes)
- **Icons & Cues:** `lucide-react-native` + `expo-haptics`
- **Language:** TypeScript (Strict mode)

## Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```

- Press `a` to open in Android Emulator / Device.
- Press `i` to open in iOS Simulator (macOS).
- Scan QR code with the **Expo Go** app on your physical phone (iOS / Android).

## Project Structure
```
mobile/
├── App.tsx                     # Global providers (GestureHandler, SafeArea, NavigationContainer)
├── app.json                    # Expo configuration for iOS & Android
├── babel.config.js             # Babel config with NativeWind plugin
├── tailwind.config.js          # Tailwind theme tokens & color extensions
├── metro.config.js             # Metro bundler config
├── tsconfig.json               # TypeScript path aliases
└── src/
    ├── types/                  # Domain & Navigation TypeScript types
    ├── theme/                  # Colors, Accent Palettes & useAppTheme hook
    ├── store/                  # Zustand store with persistent storage & balance math
    ├── navigation/             # BottomTabNavigator & RootNavigator
    ├── screens/
    │   ├── HomeScreen.tsx           # Net worth, pools carousel, budget pace, recent ledger
    │   ├── TransactionsScreen.tsx   # Search, account/category filter chips, date groups
    │   ├── BudgetsScreen.tsx        # Spending thresholds, pace bars, category caps
    │   ├── AccountsScreen.tsx       # Financial pool cards & pool creation
    │   ├── SettingsScreen.tsx       # Themes, 10 accents, currencies, JSON/CSV exports
    │   └── HelpContactScreen.tsx    # Interactive FAQ, guides & developer contact
    └── components/
        ├── common/Header.tsx        # Reusable header with safe insets
        └── domain/
            ├── AccountCard.tsx          # Multi-currency account balance card
            ├── TransactionRow.tsx       # Movement row with icons, amounts & delete
            ├── BudgetProgressCard.tsx   # Pace bar with threshold alert badges
            └── AddTransactionModal.tsx  # Modal for Expense, Income & Transfers
```
