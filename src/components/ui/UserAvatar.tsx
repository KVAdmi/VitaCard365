import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const initials = (name?: string) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || " ";

export function UserAvatar({
  src,
  name,
  alt,
  className,
}: {
  src?: string;
  name?: string;
  alt?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = React.useState(false);
  const key = src || name || "avatar";
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    setLoaded(false);
  }, [src]);

  React.useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <Avatar key={key} className={`relative overflow-hidden ${className ?? ""}`}>
      <AvatarImage
        ref={imgRef}
        src={src}
        alt={alt ?? name ?? "avatar"}
        decoding="async"
        loading="eager"
        className={`z-10 h-full w-full object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
      <AvatarFallback
        className={`pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-sm font-medium select-none transition-opacity duration-150 ${loaded ? "opacity-0" : "opacity-100"}`}
        aria-hidden={loaded ? "true" : "false"}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
