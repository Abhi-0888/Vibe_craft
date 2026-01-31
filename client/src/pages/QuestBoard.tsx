import { useMe, useQuests, useMyQuestProgress, useClaimQuest } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { ShieldCheck, Target, Award, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function QuestBoard() {
    const { data: user } = useMe();
    const { data: quests, isLoading: loadingQuests } = useQuests();
    const { data: progress, isLoading: loadingProgress } = useMyQuestProgress();
    const claimMutation = useClaimQuest();
    const { toast } = useToast();

    const handleClaim = (questId: number) => {
        claimMutation.mutate(questId, {
            onSuccess: () => {
                toast({ title: "REWARD CLAIMED", description: "Resources have been added to your inventory." });
            }
        });
    };

    if (loadingQuests || loadingProgress) {
        return <div className="p-8 text-center font-mono animate-pulse">Downloading mission data...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col">
                <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">
                    QUEST <span className="text-primary">BOARD</span>
                </h1>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-tight mt-1">
                    Daily Objectives for Session {new Date().toLocaleDateString()}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests?.map((quest) => {
                    const userProgress = progress?.find(p => p.questId === quest.id);
                    const isCompleted = userProgress?.completed;
                    const isClaimed = userProgress?.claimed;
                    const currentProgress = userProgress?.progress ?? 0;
                    const progressPercent = (currentProgress / (quest.requirementValue || 1)) * 100;

                    return (
                        <CyberCard key={quest.id} className="relative flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-primary/10 rounded-sm border border-primary/20">
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {quest.type.toUpperCase()}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-2">{quest.title}</h3>
                            <p className="text-sm text-muted-foreground mb-6 flex-grow">{quest.description}</p>

                            <div className="space-y-4 mt-auto">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono uppercase">
                                        <span>Progress</span>
                                        <span>{Math.min(100, Math.round(progressPercent))}%</span>
                                    </div>
                                    <Progress value={progressPercent} className="h-1 bg-primary/10" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-primary">
                                        <Award className="w-4 h-4" />
                                        <span className="text-xs font-mono font-bold">{quest.rewardTokens} Q</span>
                                    </div>

                                    {isClaimed ? (
                                        <div className="flex items-center gap-1 text-green-500 font-mono text-[10px] font-bold">
                                            <CheckCircle2 className="w-4 h-4" /> CLAIMED
                                        </div>
                                    ) : isCompleted ? (
                                        <CyberButton
                                            variant="secondary"
                                            className="px-4 h-8 text-xs h-auto"
                                            onClick={() => handleClaim(quest.id)}
                                            disabled={claimMutation.isPending}
                                        >
                                            CLAIM REWARD
                                        </CyberButton>
                                    ) : (
                                        <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold border border-border px-2 py-1">
                                            IN PROGRESS
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CyberCard>
                    );
                })}
            </div>
        </div>
    );
}
