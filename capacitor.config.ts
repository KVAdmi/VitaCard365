
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitacard.app',
  appName: 'VitaCard 365',   // nombre EXACTO
  webDir: 'dist',
  server: { androidScheme: 'https' },
};

export default config;
