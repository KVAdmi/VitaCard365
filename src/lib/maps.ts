import { Loader } from "@googlemaps/js-api-loader";

let mapsReady: Promise<void> | null = null;

export function loadGoogleMaps() {
  if (mapsReady) return mapsReady;
  const key = import.meta.env.VITE_MAPS_WEB_KEY as string;
  const loader = new Loader({ apiKey: key, version: "weekly", libraries: [] });
  mapsReady = loader.load();
  return mapsReady;
}
