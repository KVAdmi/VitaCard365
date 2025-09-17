declare global {
  interface Window {
    plugins?: {
      flashlight?: {
        switchOn(success?: () => void, error?: (err?: any) => void): void;
        switchOff(success?: () => void, error?: (err?: any) => void): void;
        available?(cb: (ok: boolean) => void): void;
      };
    };
  }
}
export {};