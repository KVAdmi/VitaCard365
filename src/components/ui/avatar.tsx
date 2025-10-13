import * as React from 'react';

// Un avatar minimalista compatible con el uso actual
// API: Avatar (wrapper), AvatarImage (img), AvatarFallback (contenedor para iniciales)

export function Avatar({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  function AvatarImage({ className = '', ...props }, ref) {
    return (
      <img
        ref={ref}
        className={`h-full w-full object-cover ${className}`}
        {...props}
      />
    );
  }
);

export function AvatarFallback({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-white/5 text-white/90 ${className}`} {...rest}>
      {children}
    </div>
  );
}
