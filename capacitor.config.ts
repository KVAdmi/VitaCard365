import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitacard.app',
  appName: 'VitaCard365',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showDuration: 2000,
      fadeOutDuration: 1000,
      androidScaleType: 'CENTER_CROP'
    }
  },
  server: {
    cleartext: true
  }
};

export default config;
