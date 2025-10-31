import React, { useEffect, useRef, useState } from 'react';

import { Capacitor } from '@capacitor/core';


// Blindaje: solo carga el plugin en nativo, nunca en web ni en cabecera
let GoogleMap: any = null;
if (Capacitor.getPlatform() !== 'web') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		GoogleMap = require('@capacitor/google-maps').GoogleMap;
	} catch (err) {
		console.warn('Plugin @capacitor/google-maps no disponible (modo web)');
	}
}

type Props = { apiKey: string };


function NativeMap({ apiKey }: Props) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);
	const didInit = useRef(false);
	const idRef = useRef(`native-map-${Math.random().toString(36).slice(2)}`);
	const [error, setError] = useState<string | null>(null);
	const [mapReady, setMapReady] = useState(false);

	// Protección: si estamos en web o no hay plugin, renderiza fallback
	if (Capacitor.getPlatform() === 'web' || !GoogleMap) {
		// Aquí puedes renderizar tu componente de mapa web o un fallback
		return <div style={{width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'}}>Mapa web (fallback)</div>;
	}

	useEffect(() => {
		const platform = Capacitor.isNativePlatform && Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
		if (platform === 'android') {
			setError('');
			setMapReady(false);
			return;
		}

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
				console.log('[Maps] Iniciando creación del mapa nativo (iOS)...');
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
						androidLiteMode: true,
					},
				});
				if (destroyed) {
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
				background: 'rgba(0,128,255,0.08)',
				border: '2px dashed #00f',
				overflow: 'visible',
				borderRadius: 0,
				zIndex: 0,
				pointerEvents: 'auto',
			}}
		>
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
