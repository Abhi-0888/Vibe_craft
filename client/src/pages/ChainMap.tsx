import { useChains } from "@/hooks/use-game";
import { ChainNode } from "@/components/ChainNode";
import { CyberCard } from "@/components/CyberCard";
import { useState } from "react";
import { type Chain } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function ChainMap() {
  const { data: chains, isLoading } = useChains();
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);

  if (isLoading) return <div className="flex h-full items-center justify-center font-mono text-primary animate-pulse">CONNECTING TO NEURAL NET...</div>;

  // Group chains by tier for hierarchical layout
  const prime = chains?.find(c => c.tier === 'prime');
  const regions = chains?.filter(c => c.tier === 'region') || [];
  const zones = chains?.filter(c => c.tier === 'zone') || [];

  return (
    <div className="h-[calc(100vh-6rem)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      {/* HUD Overlay Info */}
      <div className="absolute top-4 right-4 z-20 w-64">
        <AnimatePresence>
          {selectedChain && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CyberCard variant="glow" title={selectedChain.name}>
                <div className="space-y-4 text-sm font-mono">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">TIER</span>
                    <span className="text-foreground font-bold uppercase">{selectedChain.tier}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">TPS</span>
                    <span className="text-primary font-bold">{selectedChain.tps?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">DIFFICULTY</span>
                    <span className="text-foreground">{selectedChain.difficulty?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HEALTH</span>
                    <span className={selectedChain.health && selectedChain.health > 80 ? "text-green-500" : "text-red-500"}>
                      {selectedChain.health}%
                    </span>
                  </div>
                </div>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visualization Container */}
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-30">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-primary" />
            </marker>
          </defs>
          {/* Logic to draw lines would go here based on coordinates - simplified for this demo */}
        </svg>

        <div className="relative z-10 grid gap-16 text-center">
          
          {/* Prime Chain (Center Top) */}
          <div className="flex justify-center mb-12">
            {prime && (
              <ChainNode 
                chain={prime} 
                isSelected={selectedChain?.id === prime.id}
                onClick={() => setSelectedChain(prime)} 
              />
            )}
          </div>

          {/* Region Chains (Middle Row) */}
          <div className="flex gap-24 justify-center">
            {regions.map(region => (
              <div key={region.id} className="flex flex-col items-center gap-8">
                <ChainNode 
                  chain={region}
                  isSelected={selectedChain?.id === region.id}
                  onClick={() => setSelectedChain(region)} 
                />
                
                {/* Zone Chains (Bottom Row per Region) */}
                <div className="flex gap-4 mt-8">
                  {zones.filter(z => z.parentId === region.id).map(zone => (
                    <ChainNode 
                      key={zone.id} 
                      chain={zone}
                      isSelected={selectedChain?.id === zone.id}
                      onClick={() => setSelectedChain(zone)} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
