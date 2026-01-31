import { cn } from "@/lib/utils";

interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'outline';
  title?: string;
  className?: string;
}

export function CyberCard({ children, variant = 'default', title, className, ...props }: CyberCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-sm border bg-card p-6 text-card-foreground shadow-sm transition-all",
        "clip-corner-br", // Custom utility for cut corner
        variant === 'glow' && "border-primary/50 shadow-lg shadow-primary/10 border-glow",
        variant === 'outline' && "border-muted-foreground/30 bg-transparent",
        className
      )}
      {...props}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 h-2 w-2 border-l-2 border-t-2 border-primary opacity-50" />
      <div className="absolute top-0 right-0 h-2 w-2 border-r-2 border-t-2 border-primary opacity-50" />
      <div className="absolute bottom-0 left-0 h-2 w-2 border-l-2 border-b-2 border-primary opacity-50" />
      
      {title && (
        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-primary text-shadow-glow">
            {title}
          </h3>
          <div className="h-1 w-12 bg-primary/20" />
        </div>
      )}
      
      {children}
    </div>
  );
}
