# DefiHelper Mobile

A mobile app built with `Expo + React Native + TypeScript` for Android and iOS. It collects Uniswap V3 LP positions for a list of wallets and presents them as a dashboard.

## Included

- input for multiple EVM wallets;
- a mobile dashboard with summary stats and pool cards;
- a data layer for live requests to a Uniswap GraphQL endpoint;
- a mock-data fallback so the UI still opens before API setup.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`.

3. For mock mode:

```env
EXPO_PUBLIC_UNISWAP_DATA_MODE=mock
```

4. For live mode, provide a GraphQL endpoint:

```env
EXPO_PUBLIC_UNISWAP_DATA_MODE=live
EXPO_PUBLIC_UNISWAP_V3_SUBGRAPH_URL=https://...
```

5. Start the app:

```bash
npm run start
```

## Build APK

### Cloud build with Expo EAS

1. Create an Expo account.
2. Log in locally with `npx eas login`.
3. Create an EAS project with `npx eas project:init`.
4. Replace `REPLACE_WITH_EAS_PROJECT_ID` in [app.json](/C:/work/defihelper/app.json).
5. Build an installable APK:

```bash
npx eas build --platform android --profile preview
```

The resulting Expo build page will provide an install link for a real Android device.

### GitHub Actions

The workflow file [android-preview.yml](/C:/work/defihelper/.github/workflows/android-preview.yml) is already included.

Required repository secret:

- `EXPO_TOKEN`: create it in the Expo account settings and add it to the GitHub repository secrets.

After that, each push to `main` or a manual workflow run can trigger the Android preview build.

## Run On Computer

### Option 1: Browser preview

```bash
npm run web
```

This is the fastest way to verify layout and data flow on a desktop computer.

### Option 2: Android emulator

1. Install Android Studio.
2. Install Android SDK and create an emulator device.
3. Start the emulator.
4. Run:

```bash
npm run android
```

### Option 3: Real phone with Expo Go

1. Install Expo Go on the phone.
2. Run:

```bash
npm run start
```

3. Scan the QR code from the terminal or Expo developer tools.

## Architecture

- [App.tsx](/C:/work/defihelper/App.tsx) contains the main screen composition.
- [src/services/uniswapService.ts](/C:/work/defihelper/src/services/uniswapService.ts) loads and transforms Uniswap data.
- [src/hooks/useWalletPools.ts](/C:/work/defihelper/src/hooks/useWalletPools.ts) manages loading and refresh state.
- [src/components/PoolCard.tsx](/C:/work/defihelper/src/components/PoolCard.tsx) and related components render the dashboard UI.

## Next Step

For production, it is better to move Uniswap requests behind your own backend or proxy so you can:

- avoid exposing sensitive API credentials in the mobile client;
- aggregate data from multiple chains in one place;
- calculate real position value and fee APR more accurately.
