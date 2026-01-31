import { motion } from "framer-motion";
import { type Chain } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Activity, Users, Shield } from "lucide-react";

interface ChainNodeProps {
  chain: Chain;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChainNode({ chain, isSelected, onClick }: ChainNodeProps) {
  // Determine color/size based on tier
  const isPrime = chain.tier === 'prime';
  const isRegion = chain.tier === 'region';
  
  const sizeClass = isPrime ? "h-32 w-32" : isRegion ? "h-24 w-24" : "h-16 w-16";
  const glowClass = isPrime 
    ? "shadow-[0_0_30px_rgba(255,51,51,0.4)] border-primary" 
    : isRegion 
      ? "shadow-[0_0_20px_rgba(255,165,0,0.3)] border-orange-500" 
      : "shadow-[0_0_10px_rgba(50,205,50,0.2)] border-green-500";
      
  const textClass = isPrime ? "text-primary" : isRegion ? "text-orange-500" : "text-green-500";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur cursor-pointer transition-all z-10",
        sizeClass,
        glowClass,
        isSelected && "ring-4 ring-white/20"
      )}
      onClick={onClick}
    >
      <div className="absolute -top-6 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {chain.name}
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <span className={cn("font-display font-bold", isPrime ? "text-2xl" : "text-lg", textClass)}>
          {chain.tps?.toFixed(0)}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">TPS</span>
      </div>

      {/* Orbiting particles for activity */}
      {chain.activeMiners && chain.activeMiners > 0 && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-white/10"
        />
      )}
    </motion.div>
  );
}
