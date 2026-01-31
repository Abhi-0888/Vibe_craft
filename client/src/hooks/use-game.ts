import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import {
  type User,
  type Chain,
  type Stake,
  type Prediction,
  type MiningSession,
  type MiningUpgrade,
  type NftCollection,
  type UserNft,
  type Quest,
  type UserQuestProgress,
  type Team,
  type TeamMember,
  type LeaderboardEntry,
  type CreateStakeRequest,
  type CreatePredictionRequest
} from "@shared/schema";

// === CHAINS ===
export function useChains() {
  return useQuery({
    queryKey: [api.chains.list.path],
    queryFn: async () => {
      const res = await fetch(api.chains.list.path);
      if (!res.ok) throw new Error("Failed to fetch chains");
      return api.chains.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

// === USER & ECONOMY ===
export function useMe() {
  return useQuery({
    queryKey: [api.user.me.path],
    queryFn: async () => {
      const res = await fetch(api.user.me.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.user.me.responses[200].parse(await res.json());
    },
  });
}

// === MINING SYSTEM ===

export function useMiningSession(userId?: number) {
  return useQuery({
    queryKey: ["/api/mining/active", userId],
    queryFn: async () => {
      // In a real app, the server knows the user from the session
      const res = await fetch(api.mining.session.start.path, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to get/start mining session");
      return res.json() as Promise<MiningSession>;
    },
    enabled: !!userId,
  });
}

export function useMiningClick() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { clicks: number, sessionId: number }) => {
      const res = await fetch(api.mining.session.click.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Click failed");
      return res.json() as Promise<{ tokensEarned: number, user: User }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.user.me.path], data.user);
    },
  });
}

export function useMiningUpgrades(userId?: number) {
  return useQuery({
    queryKey: [api.mining.upgrades.list.path, userId],
    queryFn: async () => {
      const res = await fetch(`${api.mining.upgrades.list.path}?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch upgrades");
      return res.json() as Promise<MiningUpgrade[]>;
    },
    enabled: !!userId,
  });
}

export function usePurchaseUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { upgradeType: string, upgradeName: string }) => {
      const res = await fetch(api.mining.upgrades.purchase.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Purchase failed");
      return res.json() as Promise<MiningUpgrade>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.mining.upgrades.list.path] });
    },
  });
}

// === NFT SYSTEM ===

export function useNftCollections() {
  return useQuery({
    queryKey: [api.nfts.collections.list.path],
    queryFn: async () => {
      const res = await fetch(api.nfts.collections.list.path);
      if (!res.ok) throw new Error("Failed to fetch NFT collections");
      return res.json() as Promise<NftCollection[]>;
    },
  });
}

export function useMyNfts() {
  return useQuery({
    queryKey: [api.nfts.user.list.path],
    queryFn: async () => {
      const res = await fetch(api.nfts.user.list.path);
      if (!res.ok) throw new Error("Failed to fetch your NFTs");
      return res.json() as Promise<(UserNft & { nft: NftCollection })[]>;
    },
  });
}

export function useEquipNft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userNftId: number) => {
      const res = await fetch(api.nfts.user.equip.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userNftId }),
      });
      if (!res.ok) throw new Error("Equip failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.nfts.user.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

// === QUEST SYSTEM ===

export function useQuests() {
  return useQuery({
    queryKey: [api.quests.list.path],
    queryFn: async () => {
      const res = await fetch(api.quests.list.path);
      if (!res.ok) throw new Error("Failed to fetch quests");
      return res.json() as Promise<Quest[]>;
    },
  });
}

export function useMyQuestProgress() {
  return useQuery({
    queryKey: [api.quests.user.progress.path],
    queryFn: async () => {
      const res = await fetch(api.quests.user.progress.path);
      if (!res.ok) throw new Error("Failed to fetch quest progress");
      return res.json() as Promise<(UserQuestProgress & { quest: Quest })[]>;
    },
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: number) => {
      const res = await fetch(api.quests.user.claim.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (!res.ok) throw new Error("Claim failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quests.user.progress.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

// === LEADERBOARDS ===

export function useLeaderboard(category: string, period: string) {
  return useQuery({
    queryKey: ["leaderboard", category, period],
    queryFn: async () => {
      const url = buildUrl(api.leaderboards.get.path, { category, period });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json() as Promise<(LeaderboardEntry & { user: User })[]>;
    },
  });
}

// === TEAMS ===

export function useTeams() {
  return useQuery({
    queryKey: [api.teams.list.path],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<Team[]>;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string, description: string }) => {
      const res = await fetch(api.teams.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Team creation failed");
      return res.json() as Promise<Team>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

export function useMyStakes() {
  return useQuery({
    queryKey: [api.stakes.listMine.path],
    queryFn: async () => {
      const res = await fetch(api.stakes.listMine.path);
      if (!res.ok) throw new Error("Failed to fetch stakes");
      return api.stakes.listMine.responses[200].parse(await res.json());
    },
  });
}

// === LEGACY / OTHER ===

export function useCreateStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStakeRequest) => {
      const res = await fetch(api.stakes.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

export function usePredictions() {
  return useQuery({
    queryKey: [api.predictions.list.path],
    queryFn: async () => {
      const res = await fetch(api.predictions.list.path);
      return res.json() as Promise<Prediction[]>;
    },
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePredictionRequest) => {
      const res = await fetch(api.predictions.create.path, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.predictions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}
