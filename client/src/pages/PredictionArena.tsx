import { usePredictions, useCreatePrediction, useMe, useChains } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

export default function PredictionArena() {
  const { data: user } = useMe();
  const { data: chains } = useChains();
  const { data: predictions } = usePredictions();
  const { mutate: predict, isPending } = useCreatePrediction();
  const { toast } = useToast();
  
  const [selectedDirection, setSelectedDirection] = useState<'UP' | 'DOWN' | null>(null);

  // Default to predicting Prime chain TPS for MVP
  const primeChain = chains?.find(c => c.tier === 'prime');

  const handlePredict = () => {
    if (!user || !primeChain || !selectedDirection) return;

    // Logic: Predict if TPS > current + 100 (UP) or < current - 100 (DOWN)
    const currentTps = primeChain.tps || 2000;
    const targetValue = selectedDirection === 'UP' ? currentTps + 100 : currentTps - 100;

    predict({
      userId: user.id,
      type: 'tps_spike',
      targetChainId: primeChain.id,
      predictedValue: targetValue,
    }, {
      onSuccess: () => {
        toast({
          title: "PREDICTION LOGGED",
          description: "Smart contract engaged. Awaiting resolution.",
        });
        setSelectedDirection(null);
      },
      onError: (err) => {
        toast({
          title: "ERROR",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-8rem)]">
      {/* Trading Interface */}
      <CyberCard title="TPS Binary Options" className="flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="text-sm text-muted-foreground uppercase font-mono mb-2">Current Prime Chain TPS</div>
          <div className="text-6xl font-display font-bold text-primary text-shadow-glow">
            {primeChain?.tps?.toFixed(0) || "---"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedDirection('UP')}
            className={`
              relative p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4
              ${selectedDirection === 'UP' 
                ? 'border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                : 'border-border bg-background/50 hover:border-green-500/50'}
            `}
          >
            <TrendingUp className="h-12 w-12 text-green-500" />
            <span className="font-display font-bold text-xl uppercase text-green-500">SPIKE</span>
            <span className="text-xs text-muted-foreground font-mono">TPS WILL RISE</span>
          </button>

          <button
            onClick={() => setSelectedDirection('DOWN')}
            className={`
              relative p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4
              ${selectedDirection === 'DOWN' 
                ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                : 'border-border bg-background/50 hover:border-red-500/50'}
            `}
          >
            <TrendingDown className="h-12 w-12 text-red-500" />
            <span className="font-display font-bold text-xl uppercase text-red-500">DROP</span>
            <span className="text-xs text-muted-foreground font-mono">TPS WILL FALL</span>
          </button>
        </div>

        <div className="px-12">
          <CyberButton 
            className="w-full h-14 text-lg" 
            disabled={!selectedDirection || isPending}
            onClick={handlePredict}
          >
            {isPending ? "PROCESSING..." : "CONFIRM PREDICTION (50 QUAI)"}
          </CyberButton>
        </div>
      </CyberCard>

      {/* History Feed */}
      <CyberCard title="Live Market Feed" variant="outline" className="flex flex-col">
        <div className="space-y-0 divide-y divide-border/50 overflow-y-auto custom-scrollbar flex-1">
          {predictions?.map((pred) => (
            <div key={pred.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    TPS {pred.type === 'tps_spike' ? 'TARGET' : 'PREDICTION'}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {pred.createdAt ? format(new Date(pred.createdAt), "HH:mm:ss") : "--:--"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-lg font-bold">
                  {pred.predictedValue.toFixed(0)}
                </div>
                <div className={`text-xs font-bold ${pred.resolved ? (pred.won ? 'text-green-500' : 'text-red-500') : 'text-yellow-500'}`}>
                  {pred.resolved ? (pred.won ? 'WON' : 'LOST') : 'PENDING'}
                </div>
              </div>
            </div>
          ))}
          {!predictions?.length && (
            <div className="text-center py-12 text-muted-foreground">No recent market activity</div>
          )}
        </div>
      </CyberCard>
    </div>
  );
}
