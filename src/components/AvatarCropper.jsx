import React, { useEffect, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Utilidad: recorta un área de una imagen en un canvas y devuelve un Blob JPEG
async function getCroppedBlob(imageSrc, crop, zoom, outputSize = 800) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const img = image;
  // Calcular el área recortada basada en crop (porcentaje) y zoom
  const aspect = 1; // cuadrado
  const canvas = document.createElement('canvas');
  canvas.width = outputSize; canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');

  // react-easy-crop entrega crop.x/y en % del contenedor virtual.
  // Para simplificar, usamos la API de getCroppedAreaPixels si estuviera disponible,
  // pero aquí haremos un cálculo aproximado equivalente tomando el centro.
  // Para precisión, preferimos la callback onCropComplete que entrega areaPixels.
  return new Promise((resolve, reject) => {
    try {
      // Se sobrescribirá por onComplete si se establece desde el componente
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9);
    } catch (e) { reject(e); }
  });
}

// Nota: Usaremos onCropComplete para obtener areaPixels exacta
function getCroppedBlobFromArea(imageSrc, areaPixels, outputSize = 800) {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = imageSrc;
      });
      const canvas = document.createElement('canvas');
      canvas.width = outputSize; canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas no disponible'));
      // Dibujar el área recortada ajustándola al canvas cuadrado
      ctx.drawImage(
        img,
        areaPixels.x, areaPixels.y, areaPixels.width, areaPixels.height,
        0, 0, outputSize, outputSize
      );
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9);
    } catch (e) { reject(e); }
  });
}

export default function AvatarCropper({ src, onCancel, onConfirm, outputSize = 800 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, areaPx) => {
    setAreaPixels(areaPx);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="relative w-full h-80 bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="p-4 flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
        </div>
        <div className="p-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onCancel}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-orange-500 text-white"
            onClick={async () => {
              try {
                if (!areaPixels) return;
                const blob = await getCroppedBlobFromArea(src, areaPixels, outputSize);
                onConfirm && onConfirm(blob);
              } catch {}
            }}
          >Guardar</button>
        </div>
      </div>
    </div>
  );
}
