
import { db } from "./db";
import { 
  users, chains, stakes, predictions,
  type User, type Chain, type Stake, type Prediction,
  type CreateStakeRequest, type CreatePredictionRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByAuthId(authId: string): Promise<User | undefined>;
  createUser(user: { authId: string, username: string, email?: string | null }): Promise<User>;
  updateUserMiningPower(userId: number, power: number): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User>;
  
  // Chains
  getChains(): Promise<Chain[]>;
  getChain(id: number): Promise<Chain | undefined>;
  updateChainStats(id: number, stats: Partial<Chain>): Promise<Chain>;
  createChain(chain: Omit<Chain, "id">): Promise<Chain>;

  // Stakes
  createStake(stake: CreateStakeRequest): Promise<Stake>;
  getUserStakes(userId: number): Promise<Stake[]>;

  // Predictions
  createPrediction(prediction: CreatePredictionRequest): Promise<Prediction>;
  getPredictions(): Promise<Prediction[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByAuthId(authId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.authId, authId));
    return user;
  }

  async createUser(user: { authId: string, username: string, email?: string | null }): Promise<User> {
    const [newUser] = await db.insert(users).values({
      authId: user.authId,
      username: user.username,
      email: user.email || undefined
    }).returning();
    return newUser;
  }

  async updateUserMiningPower(userId: number, power: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ miningPower: power })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ tokens })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Chains
  async getChains(): Promise<Chain[]> {
    return await db.select().from(chains).orderBy(chains.id);
  }

  async getChain(id: number): Promise<Chain | undefined> {
    const [chain] = await db.select().from(chains).where(eq(chains.id, id));
    return chain;
  }

  async updateChainStats(id: number, stats: Partial<Chain>): Promise<Chain> {
    const [chain] = await db.update(chains)
      .set(stats)
      .where(eq(chains.id, id))
      .returning();
    return chain;
  }

  async createChain(chain: Omit<Chain, "id">): Promise<Chain> {
    const [newChain] = await db.insert(chains).values(chain).returning();
    return newChain;
  }

  // Stakes
  async createStake(stake: CreateStakeRequest): Promise<Stake> {
    const [newStake] = await db.insert(stakes).values(stake).returning();
    return newStake;
  }

  async getUserStakes(userId: number): Promise<Stake[]> {
    return await db.select().from(stakes).where(eq(stakes.userId, userId));
  }

  // Predictions
  async createPrediction(prediction: CreatePredictionRequest): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictions(): Promise<Prediction[]> {
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(50);
  }
}

export const storage = new DatabaseStorage();
