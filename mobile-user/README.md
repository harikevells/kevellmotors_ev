# EVserv User Mobile App

React Native CLI (not Expo) mobile app for EV service users.

## Prerequisites

- Node.js 18+
- React Native CLI: `npm install -g react-native`
- Android: Android Studio + SDK + emulator, or a physical device
- iOS (macOS only): Xcode 14+, CocoaPods (`sudo gem install cocoapods`)

## Setup

```bash
cd mobile-user
npm install
```

### iOS (macOS only)
```bash
cd ios && pod install && cd ..
```

## Running

### Android
```bash
npm run android
# or with a physical device (enable USB debugging):
npm run android -- --deviceId <your-device-id>
```

### iOS
```bash
npm run ios
```

### Metro bundler (separate terminal)
```bash
npm start
```

## Configuration

Edit `src/api/apiClient.ts` to set the correct backend URL:

```ts
// Android emulator → host machine
const BASE_URL = 'http://10.0.2.2:5000/api';

// iOS simulator → host machine
// const BASE_URL = 'http://localhost:5000/api';

// Real device on same WiFi
// const BASE_URL = 'http://192.168.x.x:5000/api';
```

## Project Structure

```
mobile-user/
├── App.tsx                    # Root component (providers + NavContainer)
├── index.js                   # AppRegistry entry point
├── src/
│   ├── api/
│   │   ├── apiClient.ts       # Axios instance with auth token interceptor
│   │   └── index.ts           # All API modules (auth, vehicles, services…)
│   ├── context/
│   │   └── AuthContext.tsx    # Global auth state (login/logout/refreshUser)
│   ├── components/
│   │   ├── Card.tsx           # Dark card container
│   │   ├── DrawerContent.tsx  # Sidebar with 12 menu items
│   │   ├── Header.tsx         # Screen header with hamburger toggle
│   │   ├── ListItem.tsx       # Flexible list row
│   │   ├── Spinner.tsx        # Loading indicator
│   │   └── StatusBadge.tsx    # Colored status pill
│   ├── navigation/
│   │   ├── AppNavigator.tsx   # Root: Auth vs Main
│   │   ├── AuthNavigator.tsx  # Login → Register stack
│   │   └── DrawerNavigator.tsx# 12-screen drawer
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── AIAgentScreen.tsx
│   │   ├── VehiclesScreen.tsx
│   │   ├── ServicesScreen.tsx
│   │   ├── SubscriptionsScreen.tsx
│   │   ├── SparePartsScreen.tsx
│   │   ├── PaymentsScreen.tsx
│   │   ├── FeedbackScreen.tsx
│   │   ├── RemindersScreen.tsx
│   │   ├── ReferralsScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces for all domain models
│   └── utils/
│       └── colors.ts          # Centralized dark theme color tokens
```

## Key Dependencies

| Package | Purpose |
|---|---|
| `@react-navigation/native` | Navigation core |
| `@react-navigation/stack` | Auth stack (Login → Register) |
| `@react-navigation/drawer` | Main drawer with 12 screens |
| `axios` | HTTP client with token interceptor |
| `@react-native-async-storage/async-storage` | Token persistence (replaces localStorage) |
| `react-native-gesture-handler` | Required by drawer navigator |
| `react-native-reanimated` | Required by drawer navigator |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-document-picker` | Document upload (Documents screen) |

## Troubleshooting

- **Metro cache**: `npm start -- --reset-cache`
- **Android build**: `cd android && ./gradlew clean && cd ..`
- **iOS build**: `cd ios && pod deintegrate && pod install && cd ..`
- **401 errors**: Backend URL not set correctly in `apiClient.ts`
