
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, authMiddleware, type AuthRequest } from "./auth";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { mining_sessions } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  console.log("Entering registerRoutes in routes.ts...");
  // === AUTH SETUP ===
  console.log("Starting auth setup...");
  await setupAuth(app);
  app.use(authMiddleware);
  console.log("Auth setup completed.");

  console.log("Registering auth routes...");
  await registerAuthRoutes(app);
  console.log("Auth routes registered.");

  // === MOCK DATA GENERATOR ===
  // Update chain stats periodically to simulate live network
  setInterval(async () => {
    const chains = await storage.getChains();
    for (const chain of chains) {
      // Simulate TPS fluctuation
      const newTps = Math.max(0, (chain.tps || 0) + (Math.random() - 0.5) * 50);
      // Simulate Difficulty fluctuation
      const newDiff = Math.max(1, (chain.difficulty || 0) + (Math.random() - 0.5) * 0.1);
      // Simulate Block Time
      const newBlockTime = new Date();

      await storage.updateChainStats(chain.id, {
        tps: Number(newTps.toFixed(2)),
        difficulty: Number(newDiff.toFixed(2)),
        lastBlockTime: newBlockTime
      });
    }
  }, 2000); // Update every 2s

  // === SEED DATA ===
  await seedDatabase();

  // === HELPER ===
  async function getOrCreateGameUser(req: AuthRequest) {
    if (!req.user) return null;
    const authId = req.user.id;
    let user = await storage.getUserByAuthId(authId);
    if (!user) {
      user = await storage.createUser({
        authId,
        username: req.user.username,
        email: req.user.email
      });
    }
    return user;
  }

  // === API ROUTES ===

  // Chains
  app.get(api.chains.list.path, async (req, res) => {
    const chains = await storage.getChains();
    res.json(chains);
  });

  app.get(api.chains.get.path, async (req, res) => {
    const chain = await storage.getChain(Number(req.params.id));
    if (!chain) return res.status(404).json({ message: "Chain not found" });
    res.json(chain);
  });

  // User
  app.get(api.user.me.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const user = await getOrCreateGameUser(req);
    res.json(user);
  });

  app.post(api.user.upgradeMiner.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    try {
      const { type } = api.user.upgradeMiner.input.parse(req.body);
      let cost = 0;
      let powerGain = 0;

      if (type === 'gpu') { cost = 100; powerGain = 1; }
      else if (type === 'asic') { cost = 500; powerGain = 10; }
      else if (type === 'farm') { cost = 5000; powerGain = 150; }

      if ((user.tokens || 0) < cost) {
        return res.status(400).json({ message: "Not enough tokens" });
      }

      // Deduct tokens, Add power
      await storage.updateUserTokens(user.id, (user.tokens || 0) - cost);
      const updatedUser = await storage.updateUserMiningPower(user.id, (user.miningPower || 0) + powerGain);

      res.json(updatedUser);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Guardian Game - Stakes
  app.post(api.stakes.create.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    try {
      // Force userId to be the game user ID
      const input = api.stakes.create.input.parse({
        ...req.body,
        userId: user.id
      });

      if ((user.tokens || 0) < input.amount) {
        return res.status(400).json({ message: "Not enough tokens" });
      }

      await storage.updateUserTokens(user.id, (user.tokens || 0) - input.amount);
      const stake = await storage.createStake(input);
      res.status(201).json(stake);
    } catch (e) {
      console.error(e);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.stakes.listMine.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.json([]);

    const stakes = await storage.getUserStakes(user.id);
    res.json(stakes);
  });

  // Predictions
  app.post(api.predictions.create.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    try {
      const input = api.predictions.create.input.parse({
        ...req.body,
        userId: user.id
      });
      const pred = await storage.createPrediction(input);
      res.status(201).json(pred);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.predictions.list.path, async (req, res) => {
    const preds = await storage.getPredictions();
    res.json(preds);
  });

  // === MINING SYSTEM ===

  app.post(api.mining.session.start.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    const { chainId } = api.mining.session.start.input.parse(req.body);

    // Check if there's already an active session
    const active = await storage.getActiveMiningSession(user.id);
    if (active) return res.json(active);

    const session = await storage.createMiningSession({
      userId: user.id,
      chainId: chainId || null,
      tokensEarned: 0,
      clickCount: 0,
      autoMineSeconds: 0,
      active: true
    });

    res.status(201).json(session);
  });

  app.post(api.mining.session.click.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    const { clicks, sessionId } = api.mining.session.click.input.parse(req.body);
    const session = await storage.updateMiningSession(sessionId, {
      clickCount: sql`${mining_sessions.clickCount} + ${clicks}` as any
    });

    if (!session || session.userId !== user.id) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Calculate tokens earned (base 1 per click * mining power)
    const tokensGained = clicks * (user.miningPower || 1);
    const updatedUser = await storage.updateUserTokens(user.id, (user.tokens || 0) + tokensGained);
    await storage.updateUserStats(user.id, {
      totalMined: (user.totalMined || 0) + tokensGained,
      totalClicks: (user.totalClicks || 0) + clicks
    });

    res.json({ tokensEarned: tokensGained, user: updatedUser });
  });

  app.post(api.mining.session.end.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    const { sessionId } = api.mining.session.end.input.parse(req.body);
    const session = await storage.endMiningSession(sessionId, 0); // tokens already added in click/auto
    res.json(session);
  });

  app.get(api.mining.upgrades.list.path, async (req, res) => {
    const userId = Number(req.query.userId); // In a real app, this would be from auth
    const upgrades = await storage.getUserMiningUpgrades(userId);
    res.json(upgrades);
  });

  app.post(api.mining.upgrades.purchase.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();

    const { upgradeType, upgradeName } = api.mining.upgrades.purchase.input.parse(req.body);

    // Hardcoded costs and multipliers for now
    const cost = 500;
    if ((user.tokens || 0) < cost) {
      return res.status(400).json({ message: "Not enough tokens" });
    }

    await storage.updateUserTokens(user.id, (user.tokens || 0) - cost);
    const upgrade = await storage.purchaseMiningUpgrade({
      userId: user.id,
      upgradeType,
      upgradeName,
      level: 1,
      multiplier: 1.5,
      cost
    });

    // Update user mining power
    await storage.updateUserMiningPower(user.id, (user.miningPower || 1) * 1.5);

    res.json(upgrade);
  });

  // === NFT SYSTEM ===

  app.get(api.nfts.collections.list.path, async (req, res) => {
    const collections = await storage.getNftCollections();
    res.json(collections);
  });

  app.get(api.nfts.user.list.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.json([]);
    const nfts = await storage.getUserNfts(user.id);
    res.json(nfts);
  });

  app.post(api.nfts.user.equip.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const { userNftId } = api.nfts.user.equip.input.parse(req.body);
    const nft = await storage.equipNft(userNftId);
    res.json(nft);
  });

  app.post(api.nfts.user.unequip.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const { userNftId } = api.nfts.user.unequip.input.parse(req.body);
    const nft = await storage.unequipNft(userNftId);
    res.json(nft);
  });

  // === QUEST SYSTEM ===

  app.get(api.quests.list.path, async (req, res) => {
    const quests = await storage.getActiveQuests();
    res.json(quests);
  });

  app.get(api.quests.user.progress.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.json([]);
    const progress = await storage.getUserQuestProgress(user.id);
    res.json(progress);
  });

  app.post(api.quests.user.claim.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();
    const { questId } = api.quests.user.claim.input.parse(req.body);
    const result = await storage.claimQuestReward(user.id, questId);
    res.json(result);
  });

  // === LEADERBOARDS ===

  app.get(api.leaderboards.get.path, async (req, res) => {
    const { category, period } = req.params;
    const entries = await storage.getLeaderboard(category as string, period as string);
    res.json(entries);
  });

  // === TEAMS ===

  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });

  app.post(api.teams.create.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();
    const input = api.teams.create.input.parse({ ...req.body, leaderId: user.id });
    const team = await storage.createTeam(input);
    await storage.joinTeam(user.id, team.id);
    res.status(201).json(team);
  });

  app.post(api.teams.join.path, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).send();
    const user = await getOrCreateGameUser(req);
    if (!user) return res.status(401).send();
    const { teamId } = api.teams.join.input.parse(req.body);
    const member = await storage.joinTeam(user.id, teamId);
    res.json(member);
  });

  return httpServer;
}

async function seedDatabase() {
  const chainsFound = await storage.getChains();
  if (chainsFound.length === 0) {
    // Prime Chain
    const prime = await storage.createChain({
      name: "Prime Chain",
      tier: "prime",
      parentId: null,
      tps: 5000,
      difficulty: 100,
      activeMiners: 5000,
      lastBlockTime: new Date(),
      health: 100,
      miningMultiplier: 1.0
    });

    // Region Chains (3)
    const regions = ["Cyprus", "Paxos", "Hydra"];
    for (const rName of regions) {
      const region = await storage.createChain({
        name: rName,
        tier: "region",
        parentId: prime.id,
        tps: 1500,
        difficulty: 50,
        activeMiners: 1500,
        lastBlockTime: new Date(),
        health: 100,
        miningMultiplier: 1.2
      });

      // Zone Chains (3 per region)
      for (let i = 1; i <= 3; i++) {
        await storage.createChain({
          name: `${rName} Zone ${i}`,
          tier: "zone",
          parentId: region.id,
          tps: 300,
          difficulty: 10,
          activeMiners: 200,
          lastBlockTime: new Date(),
          health: 100,
          miningMultiplier: 1.5
        });
      }
    }
  }

  // Seed some basic NFT collections if empty
  const collections = await storage.getNftCollections();
  if (collections.length === 0) {
    await storage.createNftCollection({
      name: "Basic Miner",
      description: "A standard mining tool.",
      rarity: "common",
      imageUrl: "https://example.com/common.png",
      benefitType: "mining_boost",
      benefitValue: 1.1,
      maxSupply: 1000
    });
    await storage.createNftCollection({
      name: "Pro Rig",
      description: "Professional grade equipment.",
      rarity: "rare",
      imageUrl: "https://example.com/rare.png",
      benefitType: "mining_boost",
      benefitValue: 1.5,
      maxSupply: 500
    });
  }
}
