
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  await setupAuth(app);
  registerAuthRoutes(app);

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
  async function getOrCreateGameUser(req: any) {
    if (!req.user) return null;
    const authId = req.user.claims.sub;
    let user = await storage.getUserByAuthId(authId);
    if (!user) {
      user = await storage.createUser({
        authId,
        username: req.user.claims.email?.split('@')[0] || `User${Math.floor(Math.random()*1000)}`,
        email: req.user.claims.email
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
  app.get(api.user.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const user = await getOrCreateGameUser(req);
    res.json(user);
  });

  app.post(api.user.upgradeMiner.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
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
  app.post(api.stakes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
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

  app.get(api.stakes.listMine.path, async (req, res) => {
     if (!req.isAuthenticated()) return res.status(401).send();
     const user = await getOrCreateGameUser(req);
     if (!user) return res.json([]);
     
     const stakes = await storage.getUserStakes(user.id);
     res.json(stakes);
  });

  // Predictions
  app.post(api.predictions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
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

  return httpServer;
}

async function seedDatabase() {
  const chains = await storage.getChains();
  if (chains.length === 0) {
    // Prime Chain
    const prime = await storage.createChain({
      name: "Prime Chain",
      tier: "prime",
      parentId: null,
      tps: 5000,
      difficulty: 100,
      activeMiners: 5000,
      lastBlockTime: new Date(),
      health: 100
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
        health: 100
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
          health: 100
        });
      }
    }
  }
}
