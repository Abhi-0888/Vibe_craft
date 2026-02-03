import React from "react";
import { BrowserProvider } from "quais";
import { Interface, formatEther, id } from "ethers";
import { CyberCard } from "@/components/CyberCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePelagus } from "@/hooks/use-pelagus";

const CONTRACT_ADDRESS = "0x00024F68D4A979621951E4749795840fD1a5b526";
const EVENT_ABI = [
  "event GameCompleted(uint256 gameId, address winner, uint256 totalPool, uint256 fee, uint256 payout, uint256 timestamp)"
];
const IFACE = new Interface(EVENT_ABI);
const TOPIC = id("GameCompleted(uint256,address,uint256,uint256,uint256,uint256)");

type HistoryItem = {
  gameId: number;
  winner: string;
  totalPool: string;
  fee: string;
  payout: string;
  timestamp: number;
  txHash: string;
};

declare global {
  interface Window {
    pelagus?: any;
  }
}

export default function GameHistory() {
  const { address } = usePelagus();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [lastBlock, setLastBlock] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    // @ts-ignore
    if (!window.pelagus) return;
    const provider = new BrowserProvider(window.pelagus);

    const fetchInitial = async () => {
      try {
        const latestHex = await provider.send("eth_blockNumber", []);
        const latest = typeof latestHex === "string" ? parseInt(latestHex, 16) : Number(latestHex);
        const logs = await provider.send("eth_getLogs", [{
          address: CONTRACT_ADDRESS,
          topics: [TOPIC],
          fromBlock: "0x0",
          toBlock: "latest"
        }]);
        const parsed: HistoryItem[] = logs.map((log: any) => {
          const decoded = IFACE.parseLog({ topics: log.topics, data: log.data });
          if (!decoded) return null as any;
          const [gameId, winner, totalPool, fee, payout, ts] = decoded.args;
          return {
            gameId: Number(gameId),
            winner: String(winner),
            totalPool: formatEther(totalPool),
            fee: formatEther(fee),
            payout: formatEther(payout),
            timestamp: Number(ts),
            txHash: log.transactionHash,
          };
        }).filter(Boolean).sort((a: HistoryItem, b: HistoryItem) => a.timestamp - b.timestamp);
        if (!mounted) return;
        setItems(parsed);
        setLastBlock(latest);
      } catch (e) {
        // silent
      }
    };
    fetchInitial();

    const poll = setInterval(async () => {
      try {
        const latestHex = await provider.send("eth_blockNumber", []);
        const latest = typeof latestHex === "string" ? parseInt(latestHex, 16) : Number(latestHex);
        if (lastBlock === 0 || latest <= lastBlock) return;
        const logs = await provider.send("eth_getLogs", [{
          address: CONTRACT_ADDRESS,
          topics: [TOPIC],
          fromBlock: "0x" + (lastBlock + 1).toString(16),
          toBlock: "latest"
        }]);
        if (logs.length) {
          const newItems: HistoryItem[] = logs.map((log: any) => {
            const decoded = IFACE.parseLog({ topics: log.topics, data: log.data });
            if (!decoded) return null as any;
            const [gameId, winner, totalPool, fee, payout, ts] = decoded.args;
            return {
              gameId: Number(gameId),
              winner: String(winner),
              totalPool: formatEther(totalPool),
              fee: formatEther(fee),
              payout: formatEther(payout),
              timestamp: Number(ts),
              txHash: log.transactionHash,
            };
          }).filter(Boolean);
          setItems(prev => [...prev, ...newItems].sort((a, b) => a.timestamp - b.timestamp));
        }
        setLastBlock(latest);
      } catch {}
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [address, lastBlock]);

  const chartData = items.map(i => ({
    time: new Date(i.timestamp * 1000).toLocaleTimeString(),
    payout: Number(i.payout),
  }));

  function explorerUrl(tx: string) {
    // Fallback explorer URL; tx hash determines page
    return `https://quaiscan.io/tx/${tx}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
          Game History
        </h1>
        <div className="text-xs font-mono text-muted-foreground">
          Live on-chain logs from CardGame contract
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CyberCard title="Completed Games" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Game ID</th>
                  <th className="py-2 pr-4">Winner</th>
                  <th className="py-2 pr-4">Total Pool</th>
                  <th className="py-2 pr-4">Fee (3%)</th>
                  <th className="py-2 pr-4">Payout (97%)</th>
                  <th className="py-2 pr-4">Tx</th>
                  <th className="py-2 pr-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={`${i.gameId}-${i.txHash}`} className="border-t border-border">
                    <td className="py-2 pr-4">#{i.gameId}</td>
                    <td className="py-2 pr-4">{i.winner.slice(0, 6)}...{i.winner.slice(-4)}</td>
                    <td className="py-2 pr-4">{Number(i.totalPool).toFixed(6)} QUAI</td>
                    <td className="py-2 pr-4">{Number(i.fee).toFixed(6)} QUAI</td>
                    <td className="py-2 pr-4 text-green-400">{Number(i.payout).toFixed(6)} QUAI</td>
                    <td className="py-2 pr-4">
                      <a className="text-primary underline" href={explorerUrl(i.txHash)} target="_blank" rel="noreferrer">
                        {i.txHash.slice(0, 8)}...{i.txHash.slice(-6)}
                      </a>
                    </td>
                    <td className="py-2 pr-4">{new Date(i.timestamp * 1000).toLocaleString()}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">No completed games yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CyberCard>

        <CyberCard title="Payouts Over Time" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="payout" stroke="#22c55e" fillOpacity={1} fill="url(#colorPayout)" />
            </AreaChart>
          </ResponsiveContainer>
        </CyberCard>
      </div>
    </div>
  );
}
