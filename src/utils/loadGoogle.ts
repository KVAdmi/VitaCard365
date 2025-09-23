export function loadGoogleMaps(key:string){
  return new Promise((res, rej)=>{
    if ((window as any).google?.maps) return res((window as any).google.maps);
    const s=document.createElement('script');
    s.src=`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
    s.async=true; s.defer=true; s.onload=()=>res((window as any).google.maps); s.onerror=rej;
    document.head.appendChild(s);
  });
}
