import { Capacitor } from '@capacitor/core';

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isNative(): boolean {
  if (typeof Capacitor.isNativePlatform === 'function') {
    return Capacitor.isNativePlatform();
  }
  return ['android', 'ios'].includes(Capacitor.getPlatform());
}

export function explainRuntime() {
  return {
    platform: Capacitor.getPlatform(),
    isNative: isNative(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}
