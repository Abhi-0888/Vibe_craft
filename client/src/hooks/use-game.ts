import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateStakeRequest, type CreatePredictionRequest } from "@shared/routes";
import { type User, type Chain, type Stake, type Prediction } from "@shared/schema";

// === CHAINS ===
export function useChains() {
  return useQuery({
    queryKey: [api.chains.list.path],
    queryFn: async () => {
      const res = await fetch(api.chains.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chains");
      return api.chains.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Poll every 2s for live feel
  });
}

export function useChain(id: number) {
  return useQuery({
    queryKey: [api.chains.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.chains.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch chain");
      return api.chains.get.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}

// === USER & ECONOMY ===
export function useMe() {
  return useQuery({
    queryKey: [api.user.me.path],
    queryFn: async () => {
      const res = await fetch(api.user.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.user.me.responses[200].parse(await res.json());
    },
  });
}

export function useUpgradeMiner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: 'gpu' | 'asic' | 'farm') => {
      const res = await fetch(api.user.upgradeMiner.path, {
        method: api.user.upgradeMiner.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.user.upgradeMiner.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to upgrade miner");
      }
      return api.user.upgradeMiner.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}

// === GUARDIAN GAME (STAKES) ===
export function useMyStakes() {
  return useQuery({
    queryKey: [api.stakes.listMine.path],
    queryFn: async () => {
      const res = await fetch(api.stakes.listMine.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stakes");
      return api.stakes.listMine.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStakeRequest) => {
      const validated = api.stakes.create.input.parse(data);
      const res = await fetch(api.stakes.create.path, {
        method: api.stakes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.stakes.create.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to stake");
      }
      return api.stakes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stakes.listMine.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] }); // Balance update
    },
  });
}

// === PREDICTION ARENA ===
export function usePredictions() {
  return useQuery({
    queryKey: [api.predictions.list.path],
    queryFn: async () => {
      const res = await fetch(api.predictions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return api.predictions.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePredictionRequest) => {
      const validated = api.predictions.create.input.parse(data);
      const res = await fetch(api.predictions.create.path, {
        method: api.predictions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.predictions.create.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to place prediction");
      }
      return api.predictions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.predictions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
  });
}
