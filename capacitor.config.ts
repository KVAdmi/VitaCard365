
import type { CapacitorConfig } from '@capacitor/cli';

// Permite modo dev con servidor Vite solo si se establece explícitamente la variable
const isDev = process.env.VITE_CAP_DEV_SERVER === '1';

const config: CapacitorConfig = {
  appId: 'com.vitacard365.app',
  appName: 'VitaCard365',
  webDir: 'dist',
  server: isDev
    ? { url: 'http://localhost:5173', cleartext: true }
    : { androidScheme: 'https' },
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
