import React from 'react';
import { 
  useMe,
} from "@/hooks/use-game";
import { usePelagus } from "@/hooks/use-pelagus";
import { BrowserProvider, Contract } from "quais";
import { parseEther, formatEther } from "ethers";
import { Sword, Users, Zap, RefreshCw, ShieldAlert, Coins, Play, RotateCcw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ChatPanel } from "@/components/ChatPanel";
import { CardGamePlayer } from "@shared/schema";

const TEAM_RED = 1;
const TEAM_BLUE = 2;

// Card values mapping (from server/storage.ts)
const CARD_VALUES: Record<number, number> = { 0: 5, 1: 8, 2: 3, 3: 12, 4: 6 };

const Card = ({ id, index, onClick, disabled }: { id: number, index: number, onClick?: (index: number) => void, disabled?: boolean }) => (
  <div
    onClick={() => !disabled && onClick && onClick(index)}
    className={`relative w-32 h-48 rounded-xl border-4 transition-all duration-300 transform 
      ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 cursor-pointer bg-slate-800 border-slate-600 hover:border-yellow-400 shadow-xl hover:shadow-yellow-500/20'}
      flex flex-col items-center justify-between p-3 overflow-hidden group shrink-0 select-none`}
  >
    <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-slate-500">#{id}</div>

    <div className="mt-2 p-3 bg-slate-900 rounded-full group-hover:bg-slate-700 transition-colors">
      <Sword size={32} className="text-slate-200 group-hover:text-yellow-400 transition-colors" />
    </div>

    <div className="w-full mt-2">
      <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest mb-1">Damage</div>
      <div className="flex items-center justify-center space-x-2 bg-black/40 py-1 rounded-lg border border-slate-700">
        <span className="text-2xl font-black text-white">{CARD_VALUES[id] || '?'}</span>
      </div>
    </div>
  </div>
);

export default function CardGame() {
  const { data: user } = useMe();
  const { isConnected, connect, isLoading: isWalletLoading, address, balance, refreshBalance } = usePelagus();
  const [chainState, setChainState] = React.useState<{
    active: boolean;
    turn: number;
    winner: number;
    hp1: number;
    hp2: number;
    count1: number;
    count2: number;
    cards1: number;
    cards2: number;
    gameId: number;
    prizePool: bigint;
  } | null>(null);
  const [myDeck, setMyDeck] = React.useState<number[]>([]);
  const [myTeamOnChain, setMyTeamOnChain] = React.useState<number>(0);
  const [isLoadingState, setIsLoadingState] = React.useState<boolean>(true);
  const [isResetting, setIsResetting] = React.useState<boolean>(false);
  const [redAddress, setRedAddress] = React.useState<string | null>(null);
  const [blueAddress, setBlueAddress] = React.useState<string | null>(null);
  
  const { toast } = useToast();

  const myTeam = myTeamOnChain || 0;
  
  // Derived state
  const count1 = chainState?.count1 || 0;
  const count2 = chainState?.count2 || 0;
  
  const isMyTurn = !!chainState?.active && chainState?.turn === myTeam;

  const CONTRACT_ADDRESS = "0x00024F68D4A979621951E4749795840fD1a5b526";
  const ABI = [
    { "type":"function", "name":"joinGame", "inputs":[], "outputs":[], "stateMutability":"payable" },
    { "type":"function", "name":"playCard", "inputs":[{"name":"index","type":"uint256"}], "outputs":[], "stateMutability":"nonpayable" },
    { "type":"function", "name":"resetGame", "inputs":[], "outputs":[], "stateMutability":"nonpayable" },
    { "type":"function", "name":"getMyDeck", "inputs":[], "outputs":[{"type":"uint256[]"}], "stateMutability":"view" },
    { "type":"function", "name":"getGameState", "inputs":[], "outputs":[
      {"type":"bool"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"},
      {"type":"uint256"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"},{"type":"uint256"}
    ], "stateMutability":"view" },
    { "type":"function", "name":"players", "inputs":[{"type":"uint256"},{"type":"address"}], "outputs":[
      {"type":"uint256[]"}, {"type":"uint256"}, {"type":"bool"}
    ], "stateMutability":"view" },
    { "type":"function", "name":"redPlayer", "inputs":[{"type":"uint256"}], "outputs":[{"type":"address"}], "stateMutability":"view" },
    { "type":"function", "name":"bluePlayer", "inputs":[{"type":"uint256"}], "outputs":[{"type":"address"}], "stateMutability":"view" }
  ] as const;

  const getContract = async (withSigner: boolean) => {
    // @ts-ignore
    const provider = new BrowserProvider(window.pelagus);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(CONTRACT_ADDRESS, ABI, signer);
    }
    return new Contract(CONTRACT_ADDRESS, ABI, await provider);
  };

  React.useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        // @ts-ignore
        if (!window.pelagus) return;
        const contract = await getContract(false);
        const state = await contract.getGameState();
        const s = {
          active: state[0],
          turn: Number(state[1]),
          winner: Number(state[2]),
          hp1: Number(state[3]),
          hp2: Number(state[4]),
          count1: Number(state[5]),
          count2: Number(state[6]),
          cards1: Number(state[7]),
          cards2: Number(state[8]),
          gameId: Number(state[9]),
          prizePool: BigInt(state[10])
        };
        if (!mounted) return;
        setChainState(s);

        // Load player addresses for UI
        const [red, blue] = await Promise.all([
          contract.redPlayer(s.gameId),
          contract.bluePlayer(s.gameId),
        ]);
        setRedAddress(red === "0x0000000000000000000000000000000000000000" ? null : red);
        setBlueAddress(blue === "0x0000000000000000000000000000000000000000" ? null : blue);

        if (address) {
          const contractRW = await getContract(true);
          const deck: number[] = (await contractRW.getMyDeck()).map((n: any) => Number(n));
          setMyDeck(deck);
          const playerTuple = await contractRW.players(s.gameId, address);
          const teamFromChain = Number(playerTuple[1] ?? 0);
          setMyTeamOnChain(teamFromChain);
        }
        setIsLoadingState(false);
      } catch (e) {
        setIsLoadingState(false);
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [address]);

  const handlePlayMatch = () => {
    if (!isConnected) {
      connect();
      return;
    }
    (async () => {
      try {
        const ENTRY = "0.0067";
        const bal = parseFloat(balance || "0");
        if (bal < parseFloat(ENTRY)) {
          toast({
            title: "INSUFFICIENT BALANCE",
            description: "Not enough QUAI in wallet to play.",
            variant: "destructive",
          });
          return;
        }
        const contract = await getContract(true);
        // @ts-ignore
        const provider = new BrowserProvider(window.pelagus);
        const code = await provider.send("eth_getCode", [CONTRACT_ADDRESS, "latest"]);
        if (!code || code === "0x") {
          toast({
            title: "CONTRACT NOT FOUND",
            description: "CardGame is not deployed at this address on the current network.",
            variant: "destructive",
          });
          return;
        }
        const tx = await contract.joinGame({ value: parseEther(ENTRY) });
        await tx.wait();
        const state = await contract.getGameState();
        setChainState({
          active: state[0],
          turn: Number(state[1]),
          winner: Number(state[2]),
          hp1: Number(state[3]),
          hp2: Number(state[4]),
          count1: Number(state[5]),
          count2: Number(state[6]),
          cards1: Number(state[7]),
          cards2: Number(state[8]),
          gameId: Number(state[9]),
          prizePool: BigInt(state[10]),
        });
        if (address) {
          const deck: number[] = (await contract.getMyDeck()).map((n: any) => Number(n));
          setMyDeck(deck);
          const playerTuple = await contract.players(Number(state[9]), address);
          setMyTeamOnChain(Number(playerTuple[1] ?? 0));
        }
        toast({ title: state[0] ? "MATCH STARTED" : "WAITING FOR OPPONENT", description: state[0] ? "Cards dealt. Game is active." : "You are queued. Another player must join." });
      } catch (err: any) {
        toast({
          title: "ERROR",
          description: err?.reason || err?.message || "Failed to join match",
          variant: "destructive",
        });
      }
    })();
  };

  const handlePlayCard = (index: number) => {
    if (!isConnected) {
      connect();
      return;
    }
    if (!isMyTurn) return;
    (async () => {
      try {
        const contract = await getContract(true);
        const tx = await contract.playCard(index);
        await tx.wait();
      } catch (err: any) {
        toast({
          title: "ERROR",
          description: err.message,
          variant: "destructive",
        });
      }
    })();
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to reset the game?")) return;
    (async () => {
      try {
        setIsResetting(true);
        const contract = await getContract(true);
        const tx = await contract.resetGame();
        await tx.wait();
        toast({ title: "GAME RESET", description: "The game has been reset on-chain." });
      } catch (err: any) {
        toast({
          title: "ERROR",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsResetting(false);
      }
    })();
  };

  if (!chainState || isLoadingState) return <div className="p-8 text-center text-slate-400">Loading Game State...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <Sword size={32} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Quai<span className="text-yellow-500">Clash</span>
            </h1>
            <p className="text-slate-500 font-mono text-sm">Decentralized Card Battle Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Game Controls */}
          <div className="flex gap-2">
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 border border-slate-700"
            >
              <RotateCcw size={16} /> RESET
            </button>
          </div>

          <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Prize Pool</div>
              <div className="text-2xl font-black text-yellow-400 flex items-center justify-end gap-2">
                <Coins size={20} />
                {chainState.prizePool ? formatEther(chainState.prizePool) : "0"} QUAI
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Platform Fee (3%)</div>
              <div className="text-lg font-bold text-slate-300">
                {chainState.prizePool ? (Number(formatEther(chainState.prizePool)) * 0.03).toFixed(6) : "0"} QUAI
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Winner Payout (97%)</div>
              <div className="text-lg font-bold text-green-400">
                {chainState.prizePool ? (Number(formatEther(chainState.prizePool)) * 0.97).toFixed(6) : "0"} QUAI
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Game ID</div>
              <div className="text-2xl font-black text-white">#{chainState.gameId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BATTLE ARENA */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT TEAM (RED) */}
        <div className={`lg:col-span-3 space-y-6 transition-all duration-500 ${chainState.turn === 1 ? 'scale-105 z-10' : 'opacity-80'}`}>
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/40 to-slate-900 border-2 ${chainState.turn === 1 ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-slate-800'} p-6`}>
            {chainState.turn === 1 && (
              <div className="absolute top-4 right-4 animate-pulse">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Attacking</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
                <ShieldAlert size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic">Team Red</h2>
                <div className="flex items-center gap-2 text-red-300 font-mono text-sm">
                  <Users size={14} /> {count1} Players
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  <span>Nexus Health</span>
                  <span>{chainState.hp1}/100</span>
                </div>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.max(0, chainState.hp1!)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-black/30 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">Cards Left</div>
                  <div className="text-xl font-bold text-white">{chainState.cards1}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="text-xl font-bold text-red-400">
                    {chainState.hp1! <= 0 ? "DEFEATED" : "ACTIVE"}
                  </div>
                </div>
              </div>
            </div>

            {/* Team selection buttons removed in favor of single JOIN GAME flow */}
          </div>
        </div>

        {/* CENTER ACTION AREA */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          {/* VS BADGE */}
          <div className="mb-8 relative z-10">
            <div className="bg-slate-900 border-4 border-slate-800 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black text-slate-700 italic">VS</span>
            </div>
          </div>

          {/* GAME STATUS MESSAGE + JOIN BUTTON + PLAYER INFO */}
          <div className="w-full mb-8 text-center">
             {chainState.winner !== 0 ? (
               <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-2xl animate-bounce">
                 <h3 className="text-3xl font-black text-yellow-400 uppercase italic mb-2">
                   Team {chainState.winner === TEAM_RED ? 'Red' : 'Blue'} Wins!
                 </h3>
                 <p className="text-yellow-200/80 font-mono">Game Over - Rewards Distributed</p>
               </div>
             ) : (
               <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 space-y-4">
                 <div className="flex items-center justify-center gap-3">
                   <RefreshCw size={20} className={`text-blue-400 ${chainState.active ? 'animate-spin' : ''}`} />
                   <h3 className="text-xl font-bold text-white uppercase tracking-widest">
                     {chainState.active ? (
                       <>Current Turn: <span className={chainState.turn === 1 ? 'text-red-400' : 'text-blue-400'}>
                         {chainState.turn === 1 ? 'Red Team' : 'Blue Team'}
                       </span></>
                     ) : (
                       <>Waiting for opponent… {myTeam ? `(You are ${myTeam === TEAM_RED ? 'Red' : 'Blue'})` : ""}</>
                     )}
                   </h3>
                 </div>
                 <p className="text-slate-500 text-sm font-mono">
                   {chainState.active ? (isMyTurn ? "It's your team's turn! Play a card!" : "Waiting for opponent...") : "Waiting for game start..."}
                 </p>

                 {/* Player vs Player info */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-xs font-mono">
                   <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                     <div className="text-slate-500 mb-1">Red Player</div>
                     <div className="text-slate-200 break-all">
                       {redAddress ? `${redAddress.slice(0, 8)}...${redAddress.slice(-4)}` : "Waiting..."}
                     </div>
                   </div>
                   <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                     <div className="text-slate-500 mb-1">Blue Player</div>
                     <div className="text-slate-200 break-all">
                       {blueAddress ? `${blueAddress.slice(0, 8)}...${blueAddress.slice(-4)}` : "Waiting..."}
                     </div>
                   </div>
                   <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                     <div className="text-slate-500 mb-1">You</div>
                     <div className="text-slate-200">
                       {myTeam ? `Team ${myTeam === TEAM_RED ? 'Red' : 'Blue'}` : "Not joined"}
                     </div>
                   </div>
                 </div>
                 {!chainState.active && chainState.winner === 0 && (
                   <div className="mt-4">
                     <button 
                       onClick={handlePlayMatch}
                       disabled={isWalletLoading}
                       className="px-6 py-3 bg-primary/80 hover:bg-primary text-white font-black rounded-xl transition-all"
                     >
                       {isWalletLoading ? "Connecting..." : "JOIN GAME"}
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* PLAYER HAND */}
          {myTeam !== 0 && (
            <div className={`w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${isMyTurn ? 'ring-2 ring-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'opacity-80'}`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                  <Zap className="text-yellow-400" /> Your Battle Deck
                </h3>
                <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-400 border border-slate-700">
                  Team {myTeam === TEAM_RED ? 'Red' : 'Blue'}
                </span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[220px]">
                 {myDeck && myDeck.length > 0 ? (
                   myDeck.map((cardId: number, idx: number) => (
                     <Card 
                        key={`${cardId}-${idx}`} 
                        id={cardId} 
                        index={idx}
                        onClick={handlePlayCard}
                        disabled={!isMyTurn || !chainState.active}
                     />
                   ))
                 ) : (
                   <div className="w-full text-center py-10 text-slate-500 font-mono border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center">
                     <p>No cards available.</p>
                     {!chainState.active && (
                       <p className="text-xs mt-2 text-slate-600">Wait for the game to start to receive cards.</p>
                     )}
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* CHAT PANEL - only visible during active match */}
          {chainState.active && chainState.winner === 0 && (
            <div className="w-full mt-6">
              <ChatPanel gameId={chainState.gameId} />
            </div>
          )}
        </div>

        {/* RIGHT TEAM (BLUE) */}
        <div className={`lg:col-span-3 space-y-6 transition-all duration-500 ${chainState.turn === 2 ? 'scale-105 z-10' : 'opacity-80'}`}>
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/40 to-slate-900 border-2 ${chainState.turn === 2 ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'border-slate-800'} p-6`}>
            {chainState.turn === 2 && (
              <div className="absolute top-4 right-4 animate-pulse">
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Attacking</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20">
                <ShieldAlert size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic">Team Blue</h2>
                <div className="flex items-center gap-2 text-blue-300 font-mono text-sm">
                  <Users size={14} /> {count2} Players
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  <span>Nexus Health</span>
                  <span>{chainState.hp2}/100</span>
                </div>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.max(0, chainState.hp2!)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-black/30 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">Cards Left</div>
                  <div className="text-xl font-bold text-white">{chainState.cards2}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="text-xl font-bold text-blue-400">
                    {chainState.hp2! <= 0 ? "DEFEATED" : "ACTIVE"}
                  </div>
                </div>
              </div>
            </div>

            {/* Team selection buttons removed in favor of single JOIN GAME flow */}
          </div>
        </div>

      </div>
    </div>
  );
}
