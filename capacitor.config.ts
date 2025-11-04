import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitacard.app',
  appName: 'VitaCard365',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Desactivar overlay de Capacitor al arranque y delegar al LaunchScreen nativo
      launchShowDuration: 0,
      launchAutoHide: true,
      // Mantener mismo color por consistencia si en algún caso aparece
      backgroundColor: '#0c1c3e',
      // Duraciones a 0 para evitar transiciones perceptibles
      launchFadeInDuration: 0,
      launchFadeOutDuration: 0,
      showDuration: 0,
      fadeOutDuration: 0,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      overlays: false,
      style: 'DARK',
      backgroundColor: '#0A1428'
    }
  },
  server: {
    cleartext: true
  }
};

export default config;
