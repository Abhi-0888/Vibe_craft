import { useMe, useNftCollections, useMyNfts, useEquipNft } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { Cpu, Shield, Zap, Star, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function NftGallery() {
    const { data: user } = useMe();
    const { data: collections, isLoading: loadingCollections } = useNftCollections();
    const { data: myNfts, isLoading: loadingMyNfts } = useMyNfts();
    const equipMutation = useEquipNft();
    const { toast } = useToast();

    const handleEquip = (userNftId: number) => {
        equipMutation.mutate(userNftId, {
            onSuccess: () => {
                toast({ title: "NFT EQUIPPED", description: "Your bonuses are now active." });
            }
        });
    };

    if (loadingCollections || loadingMyNfts) {
        return <div className="p-8 text-center font-mono animate-pulse">Scanning blockchain for assets...</div>;
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col">
                <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">
                    NFT <span className="text-primary">ARCHIVE</span>
                </h1>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-tight mt-1">
                    Authorized Operator: <span className="text-primary">{user?.username}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Collection Browser */}
                <div className="xl:col-span-3 space-y-6">
                    <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="text-primary w-5 h-5" /> Available Collections
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections?.map((col) => (
                            <CyberCard key={col.id} className="relative group overflow-hidden">
                                <div className="aspect-square bg-muted/50 mb-4 flex items-center justify-center relative">
                                    <Cpu className="w-16 h-16 text-primary/10 group-hover:text-primary/30 transition-colors" />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 border border-primary/20 text-[10px] font-mono font-bold uppercase text-primary">
                                        {col.rarity}
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{col.name}</h3>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{col.description}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1 text-primary">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-mono font-bold">+{col.benefitValue}x Boost</span>
                                    </div>
                                    <CyberButton variant="secondary" className="px-3 py-1 h-auto text-[10px]">
                                        MINT (1000 Q)
                                    </CyberButton>
                                </div>
                            </CyberCard>
                        ))}
                    </div>
                </div>

                {/* My Inventory */}
                <div className="space-y-6">
                    <h2 className="text-xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                        <Shield className="text-primary w-5 h-5" /> My Inventory
                    </h2>
                    <div className="space-y-4">
                        {myNfts && myNfts.length > 0 ? (
                            myNfts.map((item) => (
                                <div key={item.id} className="p-4 border border-primary/20 bg-primary/5 rounded-sm relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-tighter">
                                            {item.nft.rarity} #{item.id}
                                        </span>
                                        {item.equipped && (
                                            <span className="text-[10px] bg-primary text-white px-1 font-mono animate-pulse">EQUIPPED</span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-sm">{item.nft.name}</h4>
                                    <div className="mt-3 flex gap-2">
                                        {!item.equipped ? (
                                            <button
                                                onClick={() => handleEquip(item.id)}
                                                className="text-[10px] font-mono font-bold text-primary hover:underline"
                                                disabled={equipMutation.isPending}
                                            >
                                                [ EQUIP ]
                                            </button>
                                        ) : (
                                            <button className="text-[10px] font-mono font-bold text-muted-foreground">
                                                [ UNEQUIP ]
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border border-dashed border-border rounded-sm">
                                <p className="text-xs text-muted-foreground italic">No assets detected.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
