
// src/native/torch.ts
declare global {
  interface Window {
    plugins?: { flashlight?: any }
  }
}

export async function torchOn(track?: MediaStreamTrack) {
  // 1) Nativo con Cordova plugin (confiable)
  const fl = window.plugins?.flashlight;
  if (fl) {
    await new Promise<void>((resolve, reject) =>
      fl.switchOn(resolve, reject)
    );
    return true;
  }
  // 2) Fallback web: intenta constraints (por si el WebView lo soporta)
  try {
    // @ts-ignore
    await track?.applyConstraints?.({ advanced: [{ torch: true }] });
    return true;
  } catch { return false; }
}

export async function torchOff(track?: MediaStreamTrack) {
  const fl = window.plugins?.flashlight;
  if (fl) {
    await new Promise<void>((resolve, reject) =>
      fl.switchOff(resolve, reject)
    );
    return;
  }
  try {
    // @ts-ignore
    await track?.applyConstraints?.({ advanced: [{ torch: false }] });
  } catch {}
}
