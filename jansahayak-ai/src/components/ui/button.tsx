import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50';

        const variants = {
            primary: 'bg-primary text-white hover:bg-primary/90',
            secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-100',
            accent: 'bg-accent text-white hover:bg-accent/90',
            success: 'bg-success text-white hover:bg-success/90',
            outline: 'border border-primary text-primary hover:bg-primary/10',
            ghost: 'hover:bg-gray-100 hover:text-gray-900',
        };

        const sizes = {
            sm: 'h-[36px] px-3 text-xs',
            md: 'h-[44px] px-4 py-2',
            lg: 'h-[56px] px-8 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
