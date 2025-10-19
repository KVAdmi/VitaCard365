import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function isMediaRecorderSupported(){
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && navigator?.mediaDevices?.getUserMedia;
}

export async function startWebAudioRecording(){
  if (!isMediaRecorderSupported()) throw new Error('MediaRecorder no soportado');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new window.MediaRecorder(stream);
  const chunks = [];
  let startedAt = Date.now();
  mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stop = () => new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      stream.getTracks().forEach(t => t.stop());
      const durationSec = Math.max(1, Math.floor((Date.now() - startedAt)/1000));
      resolve({ blob, durationSec });
    };
    mediaRecorder.stop();
  });
  mediaRecorder.start();
  return { stop };
}

export async function saveBlobNative(blob, filename){
  // Guarda en Documents de la app; luego se puede compartir/exportar
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i=0; i<bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  const path = `vita-sleep/${filename}`;
  await Filesystem.mkdir({ path: 'vita-sleep', directory: Directory.Documents, recursive: true }).catch(()=>{});
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Documents });
  return { path, directory: Directory.Documents };
}

export async function shareSavedFile(fileInfo){
  const { uri } = await Filesystem.getUri({ path: fileInfo.path, directory: fileInfo.directory });
  await Share.share({ url: uri, title: 'Sesión de Sueño', text: 'Grabación de sueño' });
}

export async function startSleepRecording(){
  // Implementación baseline: Web MediaRecorder. En nativo iOS/Android, funciona si el WebView lo soporta.
  // Fallback: arroja error si no hay soporte.
  return await startWebAudioRecording();
}
