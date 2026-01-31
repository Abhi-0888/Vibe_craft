import { useTeams, useCreateTeam, useMe } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { Users, UserPlus, Trophy, ShieldAlert, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function TeamHub() {
    const { data: user } = useMe();
    const { data: teams, isLoading } = useTeams();
    const createTeamMutation = useCreateTeam();
    const { toast } = useToast();

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");

    const handleCreate = () => {
        if (!name) return;
        createTeamMutation.mutate({ name, description: desc }, {
            onSuccess: () => {
                toast({ title: "TEAM ESTABLISHED", description: `Authorized ${name} as a new operator cell.` });
                setShowCreate(false);
            }
        });
    };

    if (isLoading) return <div className="p-8 font-mono animate-pulse">Scanning frequencies for clusters...</div>;

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">
                        TEAM <span className="text-primary">HUB</span>
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-tight mt-1">
                        Collaborative Mining Networks
                    </p>
                </div>
                {!showCreate && (
                    <CyberButton onClick={() => setShowCreate(true)} variant="secondary" className="px-6">
                        ESTABLISH CELL
                    </CyberButton>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Teams List */}
                <div className="lg:col-span-2 space-y-6">
                    {showCreate && (
                        <CyberCard variant="glow" title="NEW OPERATION PARAMETERS">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-primary uppercase font-bold">Cell Designation</label>
                                    <input
                                        className="w-full bg-background border border-primary/20 p-2 font-mono text-sm focus:border-primary outline-none"
                                        placeholder="Enter name..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-primary uppercase font-bold">Mission Statement</label>
                                    <textarea
                                        className="w-full bg-background border border-primary/20 p-2 font-mono text-sm focus:border-primary outline-none h-20"
                                        placeholder="Enter description..."
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <CyberButton onClick={handleCreate} disabled={createTeamMutation.isPending} className="flex-1">CONFIRM</CyberButton>
                                    <CyberButton onClick={() => setShowCreate(false)} variant="secondary" className="flex-1">ABORT</CyberButton>
                                </div>
                            </div>
                        </CyberCard>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {teams?.map((team) => (
                            <CyberCard key={team.id} className="group hover:border-primary/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{team.name}</h3>
                                            <p className="text-xs text-muted-foreground italic font-mono">{team.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-3 text-xs font-mono">
                                            <span className="text-muted-foreground uppercase">Strength:</span>
                                            <span className="text-primary font-bold">{team.totalMembers} Operators</span>
                                        </div>
                                        <CyberButton variant="secondary" className="px-4 py-1 h-auto text-[10px]">
                                            JOIN CELL
                                        </CyberButton>
                                    </div>
                                </div>
                            </CyberCard>
                        ))}
                    </div>
                </div>

                {/* Global Stats */}
                <div className="space-y-6">
                    <CyberCard title="GLOBAL STANDINGS">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <span className="text-xs text-muted-foreground font-mono">TOTAL CELLS</span>
                                <span className="font-bold text-foreground font-mono">{teams?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <span className="text-xs text-muted-foreground font-mono">AGGREGATE HASHRATE</span>
                                <span className="font-bold text-primary font-mono">15.4 PH/s</span>
                            </div>
                        </div>
                    </CyberCard>

                    <CyberCard title="ACTIVE DISRUPTIONS" variant="outline">
                        <div className="flex flex-col items-center justify-center py-6 text-red-500/50">
                            <ShieldAlert className="w-8 h-8 mb-2 animate-pulse" />
                            <p className="text-[10px] font-mono uppercase tracking-widest">No active threats detected</p>
                        </div>
                    </CyberCard>
                </div>
            </div>
        </div>
    );
}
