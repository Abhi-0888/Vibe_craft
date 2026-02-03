import { useChains, useMe, useMyStakes, useMyQuestProgress, useMyNfts } from "@/hooks/use-game";
import { usePelagus } from "@/hooks/use-pelagus";
import { useEffect } from "react";
import { CyberCard } from "@/components/CyberCard";
import { Activity, Shield, Pickaxe, TrendingUp, Cpu, Award, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_DATA = [
  { time: '10:00', tps: 2400 },
  { time: '10:05', tps: 1398 },
  { time: '10:10', tps: 3800 },
  { time: '10:15', tps: 3908 },
  { time: '10:20', tps: 4800 },
  { time: '10:25', tps: 3800 },
  { time: '10:30', tps: 4300 },
];

export default function Dashboard() {
  const { data: user } = useMe();
  const { balance: walletBalance, address, refreshBalance, isConnected, connect, isLoading: isWalletLoading } = usePelagus();

  useEffect(() => {
    const interval = setInterval(refreshBalance, 10000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const { data: chains } = useChains();
  const { data: stakes } = useMyStakes();
  const { data: questProgress } = useMyQuestProgress();
  const { data: nfts } = useMyNfts();

  const totalTps = chains?.reduce((acc: number, c) => acc + (c.tps || 0), 0) ?? 0;
  const activeQuests = questProgress?.filter((p) => !p.completed).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
          Command <span className="text-primary">Center</span>
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            UPLINK ACTIVE
          </div>
          <div className="text-primary font-bold">LATENCY: 14ms</div>
          <div className="ml-4">
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={isWalletLoading}
                className="px-3 py-2 bg-primary/20 hover:bg-primary/40 border border-primary/50 rounded text-xs text-primary uppercase font-bold tracking-wider transition-all"
              >
                {isWalletLoading ? "..." : "Connect Wallet"}
              </button>
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-foreground">
                  {walletBalance ? `${parseFloat(walletBalance).toFixed(4)} QUAI` : "0 QUAI"}
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-muted-foreground">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center text-xs font-mono">
        <a href="https://dominantstrategies.io/" target="_blank" rel="noreferrer" className="px-2 py-1 border border-border hover:border-primary transition-colors">
          Dominant Strategies
        </a>
        <a href="https://qu.ai/#partners" target="_blank" rel="noreferrer" className="px-2 py-1 border border-border hover:border-primary transition-colors">
          Quai Partners
        </a>
        <a href="https://docs.qu.ai/learn/introduction" target="_blank" rel="noreferrer" className="px-2 py-1 border border-border hover:border-primary transition-colors">
          Quai Docs
        </a>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CyberCard variant="glow" className="flex flex-col justify-between h-32 relative group">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Mining Power</span>
            <Pickaxe className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-3xl font-display font-bold text-shadow-glow">
            {0} <span className="text-sm font-mono text-primary">H/s</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-primary w-full opacity-20" />
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32 relative">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Qi Balance</span>
            <span className="text-yellow-500 font-bold">Qi</span>
          </div>
          <div className="text-3xl font-display font-bold text-yellow-500">
            {isConnected && walletBalance
              ? parseFloat(walletBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
              : "0"
            }
          </div>
          {!isConnected && (
            <button 
              onClick={connect}
              disabled={isWalletLoading}
              className="absolute bottom-2 right-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 rounded text-xs text-yellow-200 uppercase font-bold tracking-wider transition-all"
            >
              {isWalletLoading ? "..." : "Connect"}
            </button>
          )}
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">NFT Artifacts</span>
            <Cpu className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-display font-bold text-blue-400">
            {nfts?.length || 0}
          </div>
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Active Quests</span>
            <Shield className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-3xl font-display font-bold text-green-500">
            {activeQuests}
          </div>
        </CyberCard>
      </div>

      {/* Charts & Activity Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CyberCard title="Yield Projection" className="lg:col-span-2 h-[400px]">
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'black', border: '1px solid hsl(var(--primary))', color: 'white' }}
                />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        <div className="space-y-6">
          <CyberCard title="Recent Logs" className="h-[200px] flex flex-col">
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 text-xs font-mono">
              <div className="text-green-500 bg-green-500/5 p-1">[SUCCESS] BLOCK #49281 MINED</div>
              <div className="text-primary bg-primary/5 p-1">[ALERT] DIFFICULTY INCREASED (+2.4%)</div>
              <div className="text-muted-foreground p-1">[INFO] STAKE REWARD RECEIVED (+0.45 Q)</div>
              <div className="text-blue-400 bg-blue-400/5 p-1">[NOTICE] NEW QUEST AVAILABLE</div>
            </div>
          </CyberCard>

          <CyberCard title="Network Stats" className="h-[175px] flex flex-col">
            <div className="space-y-3 flex-1 justify-center flex flex-col">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">AGGR. THROUGHPUT</span>
                <span className="font-bold text-foreground">{totalTps.toLocaleString()} TPS</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">ACTIVE NODES</span>
                <span className="font-bold text-foreground">{chains?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">NETWORK HEALTH</span>
                <span className="font-bold text-green-500">STABLE (99.9%)</span>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
