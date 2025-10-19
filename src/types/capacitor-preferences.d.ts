declare module '@capacitor/preferences' {
  export const Preferences: {
    get(opts: { key: string }): Promise<{ value: string | null }>;
    set(opts: { key: string; value: string }): Promise<void>;
    remove(opts: { key: string }): Promise<void>;
  };
}