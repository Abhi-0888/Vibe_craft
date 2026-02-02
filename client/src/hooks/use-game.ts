import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
  type CardGameState,
  type CardGamePlayer
} from "@shared/schema";

// === CARD GAME SYSTEM ===
export function useCardGameState() {
  return useQuery<CardGameState>({
    queryKey: [api.cardGame.state.path],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 2000,
  });
}

export function useCardGamePlayers() {
  return useQuery<CardGamePlayer[]>({
    queryKey: [api.cardGame.players.path],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 5000,
  });
}

export function useJoinCardGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { team: number; walletAddress: string; signature: string; stake?: number }) => {
      const res = await apiRequest('POST', api.cardGame.join.path, data);
      return res.json() as Promise<CardGamePlayer>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cardGame.players.path] });
    },
  });
}

export function useBeginCardGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.cardGame.begin.path);
      return res.json() as Promise<CardGameState>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cardGame.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.cardGame.players.path] });
    },
  });
}

export function usePlayCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { index: number }) => {
      const res = await apiRequest('POST', api.cardGame.play.path, data);
      return res.json() as Promise<CardGameState>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cardGame.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.cardGame.players.path] });
    },
  });
}

export function useResetCardGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', api.cardGame.reset.path);
      return res.json() as Promise<CardGameState>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cardGame.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.cardGame.players.path] });
    },
  });
}

// === CHAINS ===
export function useChains() {
  return useQuery<Chain[]>({
    queryKey: [api.chains.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 5000,
  });
}

// === USER & ECONOMY ===
export function useMe() {
  // Use the auth user instead of API call
  const { user } = useAuth();
  return { data: user };
}

// === MINING SYSTEM ===

export function useMiningSession(userId?: number) {
  return useQuery({
    queryKey: ["/api/mining/active"],
    queryFn: async () => {
      const res = await apiRequest('POST', api.mining.session.start.path);
      return res.json() as Promise<MiningSession>;
    },
    enabled: !!userId,
  });
}

export function useMiningClick() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { clicks: number, sessionId: number }) => {
      const res = await apiRequest('POST', api.mining.session.click.path, data);
      return res.json() as Promise<{ tokensEarned: number, user: User }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.user.me.path], data.user);
    },
  });
}

export function useMiningUpgrades(userId?: number) {
  return useQuery({
    queryKey: [api.mining.upgrades.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!userId,
  });
}

export function usePurchaseUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { upgradeType: string, upgradeName: string }) => {
      const res = await apiRequest('POST', api.mining.upgrades.purchase.path, data);
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
  return useQuery<NftCollection[]>({
    queryKey: [api.nfts.collections.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useMyNfts() {
  return useQuery<(UserNft & { nft: NftCollection })[]>({
    queryKey: [api.nfts.user.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useEquipNft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userNftId: number) => {
      const res = await apiRequest('POST', api.nfts.user.equip.path, { userNftId });
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
  return useQuery<Quest[]>({
    queryKey: [api.quests.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useMyQuestProgress() {
  return useQuery<UserQuestProgress[]>({
    queryKey: [api.quests.user.progress.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: number) => {
      const res = await apiRequest('POST', api.quests.user.claim.path, { questId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quests.user.progress.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

// === PREDICTIONS (client-side stubs to satisfy typechecking) ===
export function usePredictions() {
  return useQuery<Prediction[]>({
    queryKey: ["predictions"],
    queryFn: async () => [],
  });
}

export function useCreatePrediction() {
  return useMutation({
    mutationFn: async (data: { userId: number; type: string; targetChainId: number; predictedValue: number }) => {
      return Promise.resolve({ ok: true });
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
  return useQuery<Team[]>({
    queryKey: [api.teams.list.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string, description: string }) => {
      const res = await apiRequest('POST', api.teams.create.path, data);
      return res.json() as Promise<Team>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

export function useMyStakes() {
  return useQuery<Stake[]>({
    queryKey: [api.stakes.listMine.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}

// === LEGACY / OTHER ===

export function useCreateStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStakeRequest) => {
      const res = await apiRequest('POST', api.stakes.create.path, data);
      return res.json() as Promise<Stake>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.stakes.listMine.path] });
    },
  });
}
