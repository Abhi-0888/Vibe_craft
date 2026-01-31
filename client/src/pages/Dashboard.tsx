import { useChains, useMe, useMyStakes } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { Activity, Shield, Pickaxe, TrendingUp } from "lucide-react";
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
  const { data: chains } = useChains();
  const { data: stakes } = useMyStakes();

  const totalTps = chains?.reduce((acc, c) => acc + (c.tps || 0), 0) || 0;
  const activeMiners = chains?.reduce((acc, c) => acc + (c.activeMiners || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
          Network <span className="text-primary">Overview</span>
        </h1>
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CyberCard variant="glow" className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Total TPS</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-display font-bold text-shadow-glow">
            {totalTps.toLocaleString()}
          </div>
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Active Miners</span>
            <UsersIcon className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-display font-bold text-blue-400">
            {activeMiners.toLocaleString()}
          </div>
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">My Balance</span>
            <span className="text-yellow-500">$QUAI</span>
          </div>
          <div className="text-3xl font-display font-bold text-yellow-500">
            {user?.tokens?.toFixed(0)}
          </div>
        </CyberCard>

        <CyberCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-xs uppercase font-mono">Active Stakes</span>
            <Shield className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-3xl font-display font-bold text-green-500">
            {stakes?.length || 0}
          </div>
        </CyberCard>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CyberCard title="Network Throughput" className="lg:col-span-2 h-[400px]">
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
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

        <CyberCard title="Recent Activity" className="h-[400px] flex flex-col">
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {chains?.slice(0, 5).map((chain) => (
              <div key={chain.id} className="flex items-center justify-between border-b border-border/50 pb-2">
                <div>
                  <div className="font-mono text-sm font-bold text-foreground">{chain.name}</div>
                  <div className="text-xs text-muted-foreground">{chain.tier.toUpperCase()} CHAIN</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-primary">{chain.tps?.toFixed(0)} TPS</div>
                  <div className="text-xs text-green-500">HEALTH: {chain.health}%</div>
                </div>
              </div>
            ))}
            {!chains && <div className="text-center text-muted-foreground py-8">Loading network data...</div>}
          </div>
        </CyberCard>
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
