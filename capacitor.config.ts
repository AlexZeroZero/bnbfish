import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'trade.bnbfish.app',
  appName: 'BNBFISH',
  webDir: 'web',
  bundledWebRuntime: false,
  server: {
    // The production build is bundled locally. Wallet providers and the
    // read-only API may still reach the public BNBfish domain from WebView.
    allowNavigation: ['bnbfish.trade', '*.bnbfish.trade'],
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#102d43',
  },
};

export default config;
