import { useState, useEffect } from "react";
import { useMe, useMiningSession, useMiningClick, useMiningUpgrades } from "@/hooks/use-game";
import { CyberCard } from "./CyberCard";
import { CyberButton } from "./CyberButton";
import { Pickaxe, TrendingUp, Zap, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function MiningCenter() {
    const { data: user } = useMe();
    const { data: session } = useMiningSession(Number(user?.id || 0));
    const clickMutation = useMiningClick();
    const { toast } = useToast();

    const [localClicks, setLocalClicks] = useState(0);
    const [clickPositions, setClickPositions] = useState<{ id: number, x: number, y: number }[]>([]);

    // Sync clicks with server periodically
    useEffect(() => {
        if (localClicks > 0 && session) {
            const timer = setTimeout(() => {
                clickMutation.mutate({ clicks: localClicks, sessionId: session.id });
                setLocalClicks(0);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [localClicks, session]);

    const handleMiningClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setLocalClicks(prev => prev + 1);

        // Add visual feedback
        const id = Date.now();
        const x = e.clientX;
        const y = e.clientY;
        setClickPositions(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setClickPositions(prev => prev.filter(p => p.id !== id));
        }, 1000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto h-full content-start">
            {/* Mining Interaction */}
            <CyberCard title="CENTRAL MINING UNIT" className="lg:col-span-2">
                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                    {/* Big Mining Button */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMiningClick}
                            className="w-48 h-48 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/40 p-1 shadow-[0_0_30px_rgba(255,51,51,0.4)] relative group overflow-hidden"
                        >
                            <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center group-hover:bg-background/80 transition-colors">
                                <Pickaxe className="w-16 h-16 text-primary mb-2 group-hover:rotate-12 transition-transform" />
                                <span className="font-display font-bold text-primary tracking-widest text-lg">MINE</span>
                            </div>

                            {/* Decorative Rings */}
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
                            <div className="absolute inset-2 border border-primary/40 rounded-full animate-pulse" />
                        </motion.button>

                        {/* Click Feedback Particles */}
                        <AnimatePresence>
                            {clickPositions.map(pos => (
                                <motion.div
                                    key={pos.id}
                                    initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                    animate={{ opacity: 0, y: -100, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed font-mono font-bold text-primary pointer-events-none z-[100]"
                                    style={{ left: pos.x, top: pos.y }}
                                >
                                    +{user?.miningPower ?? 1}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Session Earned</p>
                            <p className="text-2xl font-mono font-bold text-foreground">
                                {(session?.tokensEarned ?? 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Click Power</p>
                            <p className="text-2xl font-mono font-bold text-primary">
                                {user?.miningPower ?? 1} H/s
                            </p>
                        </div>
                    </div>
                </div>
            </CyberCard>

            {/* Upgrades Sidebar */}
            <div className="space-y-6">
                <CyberCard title="EQUIPMENT BOOTS">
                    <div className="space-y-4">
                        <UpgradeItem
                            icon={<Zap className="w-4 h-4" />}
                            name="Micro GPU"
                            description="+2.5 H/s per unit"
                            cost={100}
                            onPurchase={() => toast({ title: "Module offline", description: "Upgrade system coming soon" })}
                        />
                        <UpgradeItem
                            icon={<Clock className="w-4 h-4" />}
                            name="Auto-Clicker"
                            description="Automates clicks"
                            cost={500}
                            onPurchase={() => { }}
                        />
                        <UpgradeItem
                            icon={<TrendingUp className="w-4 h-4" />}
                            name="Quai Router"
                            description="Low latency mining"
                            cost={2500}
                            onPurchase={() => { }}
                        />
                    </div>
                </CyberCard>

                <CyberCard title="ACTIVE BUFFS">
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <Zap className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-mono italic">No active multipliers</p>
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}

function UpgradeItem({ icon, name, description, cost, onPurchase }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-sm border border-border bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <button
                onClick={onPurchase}
                className="px-3 py-1 bg-primary/20 text-primary text-xs font-mono font-bold hover:bg-primary hover:text-white transition-colors border border-primary/40"
            >
                {cost} Q
            </button>
        </div>
    );
}
