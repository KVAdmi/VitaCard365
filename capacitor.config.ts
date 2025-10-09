
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitacard365.app',
  appName: 'VitaCard 365',   // nombre EXACTO
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0c1c3e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  },
  android: {
    backgroundColor: '#FF0C1C3E',
    allowMixedContent: true
  },
  ios: {
    backgroundColor: '#FF0C1C3E'
  }
};

export default config;
