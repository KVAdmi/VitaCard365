
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitacard365.app',
  appName: 'VitaCard365',
  webDir: 'dist',
  // No server.url. Solo esquema si fuese necesario:
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
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
