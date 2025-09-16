const config = {
  appId: 'com.vitacard.app',
  appName: 'VitaCard365',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Buscando dispositivos médicos...',
        cancel: 'Cancelar',
        availableDevices: 'Dispositivos disponibles',
        noDeviceFound: 'No se encontraron dispositivos'
      }
    }
  }
};
export default config;
