
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
  }
};

export default config;
