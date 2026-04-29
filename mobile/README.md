# EVserv Mobile — Franchise Partner App

React Native CLI + TypeScript mobile app for the EVserv franchise portal.

## Folder Structure

```
mobile/
├── App.tsx                          # Root: SafeAreaProvider → AuthProvider → NavigationContainer
├── package.json
├── tsconfig.json
└── src/
    ├── api/
    │   ├── apiClient.ts             # Axios instance with JWT interceptors
    │   └── franchiseApi.ts          # All franchise API calls (mirrors web franchisePortalAPI)
    ├── context/
    │   └── AuthContext.tsx          # AsyncStorage-backed auth state + login/logout
    ├── navigation/
    │   └── FranchiseNavigator.tsx   # Bottom Tab (Dashboard/Bookings/Queue/More) + nested Stack
    ├── screens/
    │   ├── LoginScreen.tsx
    │   └── franchise/
    │       ├── FranchiseDashboardScreen.tsx
    │       ├── FranchiseBookingsScreen.tsx
    │       ├── FranchiseCustomersScreen.tsx
    │       ├── FranchiseQueueScreen.tsx
    │       ├── FranchiseHistoryScreen.tsx
    │       ├── FranchisePaymentsScreen.tsx
    │       ├── FranchiseFeedbackScreen.tsx
    │       └── FranchiseProfileScreen.tsx
    ├── components/
    │   ├── BookingCard.tsx           # Reusable booking card with status + advance button
    │   ├── CustomerCard.tsx          # Customer info card
    │   └── QueueItem.tsx             # Queue item row with position badge
    ├── types/
    │   └── index.ts                  # All TypeScript interfaces
    └── utils/
        ├── colors.ts                 # Dark-theme color tokens + status color map
        └── helpers.ts                # formatINR, formatDate, shortId, initials
```

## Setup

### Prerequisites
- Node ≥ 18
- React Native CLI (`npm install -g @react-native/cli`)
- Xcode (iOS) or Android Studio (Android)
- CocoaPods (iOS): `sudo gem install cocoapods`

### Install

```bash
cd mobile
npm install

# iOS only
cd ios && pod install && cd ..
```

### Configure API Base URL

Edit `src/api/apiClient.ts`:
```ts
export const BASE_URL = __DEV__
  ? 'http://10.0.2.2:5001/api'   // Android emulator → use this
  // ? 'http://localhost:5001/api' // iOS simulator → use this
  : 'https://your-production-domain.com/api';
```

For **iOS simulator**, change to `http://localhost:5001/api`.

### Run

```bash
# Start Metro bundler
npm start

# Android
npm run android

# iOS
npm run ios
```

## Navigation Structure

```
RootStack
 ├── LoginScreen          (when not authenticated)
 └── FranchiseApp
       └── BottomTabs
             ├── Dashboard    → FranchiseDashboardScreen
             ├── Bookings     → FranchiseBookingsScreen (with status filter tabs)
             ├── Queue        → FranchiseQueueScreen (capacity bar + live queue)
             └── More         → MoreStack
                                 ├── Customers
                                 ├── History
                                 ├── Payments
                                 ├── Feedback
                                 └── Profile
```

## Key Features

| Screen | Features |
|--------|----------|
| Dashboard | Stats grid, capacity progress bar, 7-day bar chart, recent bookings |
| Bookings | Status filter tabs, BookingCard with advance-status action |
| Queue | Capacity bar, FlatList with QueueItem + advance buttons |
| Customers | Search by name/phone, CustomerCard with vehicle chips |
| History | Period filter (today/week/month), completed service rows |
| Payments | Revenue summary cards, payment rows |
| Feedback | Avg rating, star display, Reviews/Feedbacks tabs |
| Profile | Editable form, day toggles, logout with confirmation |

## Adding to "More" tab

To expose Customers/History/Payments/Feedback/Profile via deep links or a custom
"More" landing screen, extend `MoreNavigator` in `FranchiseNavigator.tsx` and add a
`MoreHomeScreen` as the default screen that presents a menu.
