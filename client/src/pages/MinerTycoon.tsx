import { MiningCenter } from "@/components/MiningCenter";

export default function MinerTycoon() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">
          MINING <span className="text-primary">HUB</span>
        </h1>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-tight mt-1">
          Active Node: <span className="text-primary">Quai Prime Central</span>
        </p>
      </div>

      <MiningCenter />
    </div>
  );
}
