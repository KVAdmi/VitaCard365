import React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-vita-input bg-vita-secondary px-4 py-3 text-base text-vita-foreground ring-offset-vita-background placeholder:text-vita-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vita-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };