import React, { type InputHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, prefix, suffix, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-foreground/90">
          {label}
        </label>
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-foreground/50 text-sm">
              {prefix}
            </span>
          )}
          <input
            inputMode={props.type === 'number' ? 'decimal' : undefined}
            className={cn(
              "flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              prefix && "pl-8",
              suffix && "pr-8",
              error && "border-danger focus-visible:ring-danger focus-visible:border-danger",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-foreground/50 text-sm">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
        {helperText && !error && <p className="text-xs text-foreground/50 mt-0.5">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
