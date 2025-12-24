# MOHANI - AI Money Diary

A futuristic React Native app for tracking expenses and generating AI-powered diary entries.

## Features

- **Home Dashboard**: Today's spending, budget progress, AI insights
- **Calendar**: Monthly view with expense tracking and diary entries
- **Shopping Lists**: Interactive shopping list with progress tracking
- **Analytics**: Spending breakdown, mood analysis, category charts
- **Settings**: Profile, budget, notifications, and preferences

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation (Bottom Tabs)
- React Native Reanimated (Animations)
- Expo Linear Gradient
- Expo Blur
- Expo Haptics
- React Native SVG

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd MohaniApp

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with Expo Go app

## Project Structure

```
MohaniApp/
├── App.tsx                 # App entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AnimatedBackground.tsx
│   │   ├── Button.tsx
│   │   ├── GlassCard.tsx
│   │   ├── Header.tsx
│   │   ├── ProgressBar.tsx
│   │   └── index.ts
│   ├── constants/          # Theme and constants
│   │   ├── theme.ts
│   │   └── index.ts
│   ├── navigation/         # Navigation setup
│   │   ├── TabNavigator.tsx
│   │   └── index.ts
│   └── screens/            # App screens
│       ├── HomeScreen.tsx
│       ├── CalendarScreen.tsx
│       ├── ShoppingScreen.tsx
│       ├── AnalyticsScreen.tsx
│       ├── SettingsScreen.tsx
│       └── index.ts
├── assets/                 # Images and fonts
├── package.json
├── tsconfig.json
└── babel.config.js
```

## Design

- Dark theme with glassmorphism
- Purple (#7c3aed) and Gold (#f59e0b) accent colors
- Animated floating particles background
- Smooth transitions with React Native Reanimated
- Haptic feedback on interactions

## License

MIT
