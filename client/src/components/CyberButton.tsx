import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "clip-corner-br border", // Base shape
          
          // Variants
          variant === 'primary' && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(255,51,51,0.5)]",
          variant === 'secondary' && "bg-secondary text-secondary-foreground border-secondary-foreground/20 hover:bg-secondary/80 hover:border-primary/50",
          variant === 'ghost' && "bg-transparent border-transparent hover:bg-accent hover:text-accent-foreground",
          variant === 'destructive' && "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",

          // Sizes
          size === 'sm' && "h-8 px-3 text-xs",
          size === 'md' && "h-10 px-6 py-2 text-sm",
          size === 'lg' && "h-12 px-8 text-base",
          
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        
        {/* Hover scanline effect for primary */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
        )}
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";
