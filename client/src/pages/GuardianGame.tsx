import { useChains, useMe, useCreateStake, useMyStakes } from "@/hooks/use-game";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStakeSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GuardianGame() {
  const { data: user } = useMe();
  const { data: chains } = useChains();
  const { data: stakes } = useMyStakes();
  const { mutate: stake, isPending } = useCreateStake();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertStakeSchema>>({
    resolver: zodResolver(insertStakeSchema),
    defaultValues: {
      amount: 100,
      chainId: 0,
      userId: user?.id || 0, // This gets overridden by backend usually, but needed for types
    }
  });

  const onSubmit = (data: z.infer<typeof insertStakeSchema>) => {
    // Inject correct user ID
    if (!user) return;
    
    stake({ ...data, userId: user.id }, {
      onSuccess: () => {
        toast({
          title: "STAKE DEPLOYED",
          description: `Successfully staked ${data.amount} QUAI to protect chain.`,
        });
        form.reset();
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Staking Interface */}
      <CyberCard title="Deploy Guardian Stake" variant="glow">
        <p className="mb-6 text-sm text-muted-foreground">
          Stake your QUAI tokens to secure specific chains. Higher stakes increase chain health and earn yield.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="chainId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Chain</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-border font-mono">
                        <SelectValue placeholder="Select a chain to protect" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chains?.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name} ({chain.tier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stake Amount (Max: {user?.tokens?.toFixed(0)})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      className="bg-background border-border font-mono text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <CyberButton 
                type="submit" 
                className="w-full" 
                disabled={isPending}
                isLoading={isPending}
              >
                <Shield className="mr-2 h-4 w-4" />
                INITIATE STAKE
              </CyberButton>
            </div>
          </form>
        </Form>
      </CyberCard>

      {/* Active Stakes List */}
      <div className="space-y-6">
        <CyberCard title="Active Guardians" variant="outline">
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {stakes?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="mb-2 h-8 w-8 opacity-50" />
                <span>NO ACTIVE STAKES DETECTED</span>
              </div>
            )}
            
            {stakes?.map((stake) => {
              const chainName = chains?.find(c => c.id === stake.chainId)?.name || "Unknown Chain";
              return (
                <div key={stake.id} className="flex items-center justify-between rounded border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-500/10 p-2 text-green-500">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{chainName}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {stake.id.toString().padStart(6, '0')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-primary">
                      {stake.amount} QUAI
                    </div>
                    <div className="text-xs text-green-500">ACTIVE</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
