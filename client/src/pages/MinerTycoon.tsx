import { useMe, useUpgradeMiner } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { Pickaxe, Cpu, Server, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UPGRADES = [
  { type: 'gpu', name: 'Nvidia RTX 5090', cost: 100, power: 10, icon: Cpu },
  { type: 'asic', name: 'Antminer S21', cost: 500, power: 60, icon: Server },
  { type: 'farm', name: 'Mining Facility', cost: 2000, power: 300, icon: Zap },
] as const;

export default function MinerTycoon() {
  const { data: user } = useMe();
  const { mutate: upgrade, isPending } = useUpgradeMiner();
  const { toast } = useToast();

  const handleBuy = (type: typeof UPGRADES[number]['type'], name: string, cost: number) => {
    if ((user?.tokens || 0) < cost) {
      toast({
        title: "INSUFFICIENT FUNDS",
        description: "You need more QUAI tokens to purchase this upgrade.",
        variant: "destructive",
      });
      return;
    }

    upgrade(type, {
      onSuccess: () => {
        toast({
          title: "UPGRADE INSTALLED",
          description: `Successfully purchased ${name}.`,
        });
      },
      onError: (err) => {
        toast({
          title: "TRANSACTION FAILED",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <CyberCard variant="glow" className="flex flex-col justify-center items-center py-12 text-center">
          <Pickaxe className="h-16 w-16 text-primary animate-pulse mb-4" />
          <h2 className="text-4xl font-display font-bold text-foreground text-shadow-glow">
            {user?.miningPower || 0} H/s
          </h2>
          <p className="text-muted-foreground font-mono uppercase tracking-widest mt-2">
            Current Hashrate
          </p>
        </CyberCard>

        <CyberCard className="flex flex-col justify-center items-center py-12 text-center">
          <div className="text-6xl mb-4">⛏️</div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Mining Operation Active
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Your hardware is automatically securing the Quai Network and earning rewards every block.
          </p>
        </CyberCard>
      </div>

      <h2 className="text-2xl font-display font-bold uppercase tracking-wider mt-8 mb-4 flex items-center gap-2">
        <Cpu className="text-primary" /> Hardware Marketplace
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {UPGRADES.map((item) => (
          <CyberCard key={item.type} className="relative group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary rounded-lg">
                <item.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-foreground">{item.cost}</div>
                <div className="text-xs text-muted-foreground uppercase">QUAI</div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold font-display uppercase tracking-wide mb-1">{item.name}</h3>
            <p className="text-sm text-green-500 font-mono mb-6">+{item.power} H/s Power</p>
            
            <CyberButton 
              className="w-full" 
              variant="secondary"
              disabled={isPending || (user?.tokens || 0) < item.cost}
              onClick={() => handleBuy(item.type, item.name, item.cost)}
            >
              PURCHASE
            </CyberButton>
          </CyberCard>
        ))}
      </div>
    </div>
  );
}
