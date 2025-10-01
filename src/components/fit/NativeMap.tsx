import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';

type Props = { apiKey: string };

function NativeMap({ apiKey }: Props) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<GoogleMap | null>(null);
	const didInit = useRef(false);
	// ID único por instancia para evitar colisiones cuando React remonta
	const idRef = useRef(`native-map-${Math.random().toString(36).slice(2)}`);

	const [error, setError] = useState<string | null>(null);
	const [mapReady, setMapReady] = useState(false);

	useEffect(() => {
		// Evita doble init en StrictMode
		if (didInit.current) return;
		didInit.current = true;

		let destroyed = false;

		function raf(): Promise<void> {
			return new Promise(res => requestAnimationFrame(() => res()));
		}

		function sleep(ms: number) {
			return new Promise(res => setTimeout(res, ms));
		}

		async function createMap() {
			try {
				console.log('[Maps] Iniciando creación del mapa...');
				if (!mapRef.current) {
					setError('No se encontró el elemento contenedor');
					return;
				}
				if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
					setError('No se proporcionó la API key de Google Maps.');
					return;
				}
				let tries = 0;
				let r = mapRef.current.getBoundingClientRect();
				while ((r.width <= 0 || r.height <= 0) && tries < 10) {
					tries++;
					await raf();
					await sleep(30);
					if (!mapRef.current) break;
					r = mapRef.current.getBoundingClientRect();
				}
				console.log('[Maps] rect:', r.width, r.height, 'tries:', tries);
				if (r.width <= 0 || r.height <= 0) {
					console.warn('[Maps] Contenedor sin tamaño visible (width/height <= 0) tras reintentos. Creo igual.');
				}

				console.log('[Maps] create:start');
				console.log('[Maps] Creando mapa con key:', apiKey.substring(0, 8) + '...');
				const map = await GoogleMap.create({
					id: idRef.current,
					element: mapRef.current,
					apiKey,
					config: {
						center: { lat: 19.4326, lng: -99.1332 },
						zoom: 14,
						androidLiteMode: true, // Forzar modo Lite para máxima compatibilidad
					},
				});
				if (destroyed) {
					// Si se desmontó durante el await, destruye limpio y sal
					try { await map.destroy(); } catch {}
					return;
				}
				mapInstance.current = map;
				console.log('[Maps] create:ok');

				try {
					await map.setCamera({ coordinate: { lat: 19.4326, lng: -99.1332 }, zoom: 14 });
					await map.addMarker({ coordinate: { lat: 19.4326, lng: -99.1332 }, title: 'CDMX' });
					await map.setPadding({ top: 8, left: 0, right: 0, bottom: 8 });
				} catch (err) {
					console.warn('[Maps] cámara/marker error:', err);
				}
				setMapReady(true);
				setError(null);
				// Validar si el mapa realmente se ve (por si hay overlays o render fallido)
				setTimeout(() => {
					if (mapRef.current) {
						const r = mapRef.current.getBoundingClientRect();
						if (r.width < 10 || r.height < 10) {
							setError('El mapa no pudo renderizarse correctamente. Verifica permisos, key y compatibilidad.');
						}
					}
				}, 1500);
			} catch (e: any) {
				const msg = (e && e.message) ? e.message : String(e);
				console.error('[Maps] create:error', msg);
				setError('Error al crear el mapa: ' + msg);
			}
		}

		createMap();

		return () => {
			destroyed = true;
			if (mapInstance.current) {
				// destroy seguro
				mapInstance.current.destroy().catch(() => {});
				mapInstance.current = null;
			}
		};
	}, [apiKey]);

	return (
		<div
			ref={mapRef}
			id={idRef.current}
			style={{
				width: '100%',
				height: '100%',
				position: 'relative',
				isolation: 'isolate',
				// Fondo y borde temporal para depuración visual
				background: 'rgba(0,128,255,0.08)',
				border: '2px dashed #00f',
				overflow: 'visible',
				borderRadius: 0,
				zIndex: 0,
				pointerEvents: 'auto',
			}}
		>
			{/* Quita overlays visuales encima del mapa; solo un fallback sutil */}
			{error && (
				<div style={{
					position: 'absolute', inset: 0,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					backgroundColor: 'rgba(255,0,0,0.85)', color: 'white',
					fontSize: 16, padding: 24, textAlign: 'center', zIndex: 2, borderRadius: 8, fontWeight: 'bold',
				}}>
					{error.includes('API key')
						? 'Error: No se proporcionó la clave de Google Maps para esta plataforma. Por favor revisa la configuración.'
						: error}
				</div>
			)}
			{!error && !mapReady && (
				<div style={{
					position: 'absolute', inset: 0,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					color: '#fff', opacity: 0.35, pointerEvents: 'none', fontSize: 16,
					zIndex: 0
				}}>
					Cargando mapa…
				</div>
			)}
		</div>
	);
}

export default React.memo(NativeMap, (prev, next) => prev.apiKey === next.apiKey);
