import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export function useSmartGeolocation() {
  const [status, setStatus] = useState("idle"); // idle|asking|granted|denied|error
  const [pos, setPos] = useState(null);
  const platform = Capacitor.getPlatform();

  async function ask() {
    try {
      setStatus("asking");
      if (platform === "android" || platform === "ios") {
        await Geolocation.requestPermissions();
        const r = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
        setPos({ lat: r.coords.latitude, lng: r.coords.longitude, acc: r.coords.accuracy });
        setStatus("granted");
      } else {
        navigator.geolocation.getCurrentPosition(
          (r) => {
            setPos({ lat: r.coords.latitude, lng: r.coords.longitude, acc: r.coords.accuracy });
            setStatus("granted");
          },
          () => setStatus("denied"),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    } catch (e) {
      setStatus("denied");
    }
  }

  useEffect(() => { ask(); }, []);
  return { status, pos, retry: ask, platform };
}
