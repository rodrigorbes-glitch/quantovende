import React, { type ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      secondary: "bg-card text-foreground hover:bg-card/80 border border-border shadow-sm",
      outline: "border border-input bg-transparent hover:bg-foreground/5 text-foreground",
      ghost: "hover:bg-foreground/5 text-foreground",
      danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
    };
    
    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-12 px-6 text-sm font-medium",
      lg: "h-14 px-8 text-base font-medium",
      icon: "h-10 w-10 justify-center",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
