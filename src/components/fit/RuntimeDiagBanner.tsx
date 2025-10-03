import React, { useState } from 'react';
import { explainRuntime } from '@/platform/runtime';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { Geolocation } from '@capacitor/geolocation';

const isDev = process.env.NODE_ENV === 'development';

export default function RuntimeDiagBanner() {
  const [lastGeoStatus, setLastGeoStatus] = useState('idle');
  const [lastGeoCoords, setLastGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [lastBleStatus, setLastBleStatus] = useState('idle');
  const [bleFound, setBleFound] = useState(0);
  const [bleError, setBleError] = useState('');
  const [geoError, setGeoError] = useState('');

  if (!isDev) return null;

  const rt = explainRuntime();
  const blePlugin = BluetoothLe && typeof BluetoothLe.requestLEScan === 'function' ? 'available' : 'unavailable';
  const geoPlugin = Geolocation && typeof Geolocation.getCurrentPosition === 'function' ? 'available' : 'unavailable';

  async function testGeo() {
    setLastGeoStatus('requesting');
    setGeoError('');
    setLastGeoCoords(null);
    try {
      const pos = await Geolocation.getCurrentPosition();
      setLastGeoStatus('granted');
      setLastGeoCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch (e: any) {
      setLastGeoStatus('error');
      setGeoError(e && typeof e === 'object' && 'message' in e ? (e as any).message : String(e));
    }
  }

  async function testBle() {
    setLastBleStatus('scanning');
    setBleFound(0);
    setBleError('');
    let found = 0;
    try {
      const listener = await BluetoothLe.addListener('onScanResult', (result) => {
        found++;
        setBleFound(found);
      });
      await BluetoothLe.requestLEScan({ allowDuplicates: true });
      setTimeout(async () => {
        await BluetoothLe.stopLEScan();
        listener.remove();
        setLastBleStatus('stopped');
      }, 5000);
    } catch (e: any) {
      setLastBleStatus('error');
      setBleError(e && typeof e === 'object' && 'message' in e ? (e as any).message : String(e));
    }
  }

  return (
    <div style={{background:'#222',color:'#fff',padding:12,borderRadius:8,marginBottom:12,fontSize:14}}>
      <div><b>RuntimeDiagBanner</b></div>
      <div>platform: <b>{rt.platform}</b> | isNative: <b>{String(rt.isNative)}</b></div>
      <div>blePlugin: <b>{blePlugin}</b> | geoPlugin: <b>{geoPlugin}</b></div>
  <div>lastGeoStatus: <b>{lastGeoStatus}</b> {lastGeoCoords && (<span>lat: {lastGeoCoords.lat}, lon: {lastGeoCoords.lon}</span>)} {geoError && (<span style={{color:'#f66'}}>error: {geoError}</span>)}</div>
      <div>lastBleStatus: <b>{lastBleStatus}</b> {lastBleStatus==='scanning' && (<span>found: {bleFound}</span>)} {bleError && (<span style={{color:'#f66'}}>error: {bleError}</span>)}</div>
      <div style={{marginTop:8,display:'flex',gap:8}}>
        <button onClick={testGeo} style={{padding:'4px 12px',borderRadius:4,background:'#444',color:'#fff'}}>Test Geo</button>
        <button onClick={testBle} style={{padding:'4px 12px',borderRadius:4,background:'#444',color:'#fff'}}>Test BLE 5s</button>
      </div>
    </div>
  );
}
