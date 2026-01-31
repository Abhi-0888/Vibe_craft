console.log("Entering server/storage.ts...");

import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  game_users as users,
  chains,
  stakes,
  predictions,
  mining_sessions,
  mining_upgrades,
  nft_collections,
  user_nfts,
  quests,
  user_quest_progress,
  achievements,
  user_achievements,
  teams,
  team_members,
  leaderboard_entries,
  marketplace_listings,
  marketplace_transactions,
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
  type Achievement,
  type UserAchievement,
  type Team,
  type TeamMember,
  type LeaderboardEntry,
  type MarketplaceListing,
  type MarketplaceTransaction,
  type CreateStakeRequest,
  type CreatePredictionRequest,
  type CreateMiningSessionRequest,
  type CreateMiningUpgradeRequest,
  type CreateUserNftRequest,
  type CreateTeamRequest,
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

// Import db dynamically to avoid circular dependency issues
let db: any = null;
let dbModule: any = null;

async function getDb() {
  if (!dbModule) {
    dbModule = await import("./db");
  }
  return dbModule.db;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByAuthId(authId: string): Promise<User | undefined>;
  createUser(user: { authId: string; username: string; email?: string | null }): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User>;
  updateUserMiningPower(userId: number, power: number): Promise<User>;
  updateUserStats(userId: number, stats: Partial<User>): Promise<User>;

  // Chains
  getChains(): Promise<Chain[]>;
  getChain(id: number): Promise<Chain | undefined>;
  updateChainStats(id: number, stats: Partial<Chain>): Promise<Chain>;
  createChain(chain: Omit<Chain, "id">): Promise<Chain>;

  // Stakes
  createStake(stake: CreateStakeRequest): Promise<Stake>;
  getUserStakes(userId: number): Promise<Stake[]>;
  getActiveStakes(userId: number): Promise<Stake[]>;
  closeStake(stakeId: number): Promise<Stake>;

  // Predictions
  createPrediction(prediction: CreatePredictionRequest): Promise<Prediction>;
  getPredictions(): Promise<Prediction[]>;
  getUserPredictions(userId: number): Promise<Prediction[]>;
  resolvePrediction(predictionId: number, actualValue: number, won: boolean): Promise<Prediction>;

  // Mining
  createMiningSession(session: CreateMiningSessionRequest): Promise<MiningSession>;
  getActiveMiningSession(userId: number): Promise<MiningSession | undefined>;
  updateMiningSession(sessionId: number, updates: Partial<MiningSession>): Promise<MiningSession>;
  endMiningSession(sessionId: number, tokensEarned: number): Promise<MiningSession>;
  getUserMiningUpgrades(userId: number): Promise<MiningUpgrade[]>;
  purchaseMiningUpgrade(upgrade: CreateMiningUpgradeRequest): Promise<MiningUpgrade>;
  upgradeMiningUpgrade(userId: number, upgradeType: string, upgradeName: string): Promise<MiningUpgrade>;

  // NFTs
  getNftCollections(): Promise<NftCollection[]>;
  getNftCollection(id: number): Promise<NftCollection | undefined>;
  createNftCollection(nft: Omit<NftCollection, "id" | "createdAt" | "currentSupply">): Promise<NftCollection>;
  getUserNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]>;
  mintNft(userId: number, nftId: number): Promise<UserNft>;
  equipNft(userNftId: number): Promise<UserNft>;
  unequipNft(userNftId: number): Promise<UserNft>;
  getEquippedNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]>;

  // Quests
  getActiveQuests(): Promise<Quest[]>;
  getUserQuestProgress(userId: number): Promise<(UserQuestProgress & { quest: Quest })[]>;
  startQuest(userId: number, questId: number): Promise<UserQuestProgress>;
  updateQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuestProgress>;
  completeQuest(userId: number, questId: number): Promise<UserQuestProgress>;
  claimQuestReward(userId: number, questId: number): Promise<{ quest: Quest; progress: UserQuestProgress }>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement>;
  unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  claimAchievementReward(userId: number, achievementId: number): Promise<{ achievement: Achievement; userAchievement: UserAchievement }>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: CreateTeamRequest): Promise<Team>;
  joinTeam(userId: number, teamId: number): Promise<TeamMember>;
  leaveTeam(userId: number): Promise<void>;
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]>;
  getUserTeam(userId: number): Promise<(TeamMember & { team: Team }) | undefined>;

  // Leaderboards
  getLeaderboard(category: string, period: string, limit?: number): Promise<(LeaderboardEntry & { user: User })[]>;
  updateLeaderboardEntry(userId: number, category: string, score: number, period: string): Promise<LeaderboardEntry>;

  // Marketplace
  getMarketplaceListings(status?: string): Promise<(MarketplaceListing & { nft: UserNft & { nft: NftCollection }; seller: User })[]>;
  createMarketplaceListing(sellerId: number, userNftId: number, price: number): Promise<MarketplaceListing>;
  buyNft(listingId: number, buyerId: number): Promise<MarketplaceTransaction>;
  cancelListing(listingId: number): Promise<MarketplaceListing>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByAuthId(authId: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.authId, authId));
    return user;
  }

  async createUser(user: { authId: string; username: string; email?: string | null }): Promise<User> {
    const db = await getDb();
    const [newUser] = await db.insert(users).values({
      authId: user.authId,
      username: user.username,
      email: user.email || undefined,
    }).returning();
    return newUser;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User> {
    const db = await getDb();
    const [user] = await db.update(users)
      .set({ tokens })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserMiningPower(userId: number, power: number): Promise<User> {
    const db = await getDb();
    const [user] = await db.update(users)
      .set({ miningPower: power })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStats(userId: number, stats: Partial<User>): Promise<User> {
    const db = await getDb();
    const [user] = await db.update(users)
      .set(stats)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Chains
  async getChains(): Promise<Chain[]> {
    const db = await getDb();
    return await db.select().from(chains).orderBy(chains.id);
  }

  async getChain(id: number): Promise<Chain | undefined> {
    const db = await getDb();
    const [chain] = await db.select().from(chains).where(eq(chains.id, id));
    return chain;
  }

  async updateChainStats(id: number, stats: Partial<Chain>): Promise<Chain> {
    const db = await getDb();
    const [chain] = await db.update(chains)
      .set(stats)
      .where(eq(chains.id, id))
      .returning();
    return chain;
  }

  async createChain(chain: Omit<Chain, "id">): Promise<Chain> {
    const db = await getDb();
    const [newChain] = await db.insert(chains).values(chain).returning();
    return newChain;
  }

  // Stakes
  async createStake(stake: CreateStakeRequest): Promise<Stake> {
    const db = await getDb();
    const [newStake] = await db.insert(stakes).values(stake).returning();
    return newStake;
  }

  async getUserStakes(userId: number): Promise<Stake[]> {
    const db = await getDb();
    return await db.select().from(stakes).where(eq(stakes.userId, userId));
  }

  async getActiveStakes(userId: number): Promise<Stake[]> {
    const db = await getDb();
    return await db.select().from(stakes)
      .where(and(eq(stakes.userId, userId), eq(stakes.active, true)));
  }

  async closeStake(stakeId: number): Promise<Stake> {
    const db = await getDb();
    const [stake] = await db.update(stakes)
      .set({ active: false, status: 'closed', endTime: new Date() })
      .where(eq(stakes.id, stakeId))
      .returning();
    return stake;
  }

  // Predictions
  async createPrediction(prediction: CreatePredictionRequest): Promise<Prediction> {
    const db = await getDb();
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictions(): Promise<Prediction[]> {
    const db = await getDb();
    return await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(50);
  }

  async getUserPredictions(userId: number): Promise<Prediction[]> {
    const db = await getDb();
    return await db.select().from(predictions)
      .where(eq(predictions.userId, userId))
      .orderBy(desc(predictions.createdAt));
  }

  async resolvePrediction(predictionId: number, actualValue: number, won: boolean): Promise<Prediction> {
    const db = await getDb();
    const [prediction] = await db.update(predictions)
      .set({
        actualValue,
        won,
        resolved: true,
        status: 'resolved',
        resolvedAt: new Date(),
      })
      .where(eq(predictions.id, predictionId))
      .returning();
    return prediction;
  }

  // Mining
  async createMiningSession(session: CreateMiningSessionRequest): Promise<MiningSession> {
    const db = await getDb();
    const [newSession] = await db.insert(mining_sessions).values(session).returning();
    return newSession;
  }

  async getActiveMiningSession(userId: number): Promise<MiningSession | undefined> {
    const db = await getDb();
    const [session] = await db.select().from(mining_sessions)
      .where(and(eq(mining_sessions.userId, userId), eq(mining_sessions.active, true)))
      .orderBy(desc(mining_sessions.startTime))
      .limit(1);
    return session;
  }

  async updateMiningSession(sessionId: number, updates: Partial<MiningSession>): Promise<MiningSession> {
    const db = await getDb();
    const [session] = await db.update(mining_sessions)
      .set(updates)
      .where(eq(mining_sessions.id, sessionId))
      .returning();
    return session;
  }

  async endMiningSession(sessionId: number, tokensEarned: number): Promise<MiningSession> {
    const db = await getDb();
    const [session] = await db.update(mining_sessions)
      .set({
        endTime: new Date(),
        tokensEarned,
        active: false,
      })
      .where(eq(mining_sessions.id, sessionId))
      .returning();
    return session;
  }

  async getUserMiningUpgrades(userId: number): Promise<MiningUpgrade[]> {
    const db = await getDb();
    return await db.select().from(mining_upgrades)
      .where(eq(mining_upgrades.userId, userId));
  }

  async purchaseMiningUpgrade(upgrade: CreateMiningUpgradeRequest): Promise<MiningUpgrade> {
    const db = await getDb();
    const [newUpgrade] = await db.insert(mining_upgrades).values(upgrade).returning();
    return newUpgrade;
  }

  async upgradeMiningUpgrade(userId: number, upgradeType: string, upgradeName: string): Promise<MiningUpgrade> {
    const db = await getDb();
    const [upgrade] = await db.update(mining_upgrades)
      .set({
        level: sql`${mining_upgrades.level} + 1`,
        multiplier: sql`${mining_upgrades.multiplier} * 1.5`,
      })
      .where(and(
        eq(mining_upgrades.userId, userId),
        eq(mining_upgrades.upgradeType, upgradeType),
        eq(mining_upgrades.upgradeName, upgradeName)
      ))
      .returning();
    return upgrade;
  }

  // NFTs
  async getNftCollections(): Promise<NftCollection[]> {
    const db = await getDb();
    return await db.select().from(nft_collections).orderBy(nft_collections.rarity);
  }

  async getNftCollection(id: number): Promise<NftCollection | undefined> {
    const db = await getDb();
    const [nft] = await db.select().from(nft_collections).where(eq(nft_collections.id, id));
    return nft;
  }

  async createNftCollection(nft: Omit<NftCollection, "id" | "createdAt" | "currentSupply">): Promise<NftCollection> {
    const db = await getDb();
    const [newNft] = await db.insert(nft_collections).values(nft).returning();
    return newNft;
  }

  async getUserNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(user_nfts)
      .leftJoin(nft_collections, eq(user_nfts.nftId, nft_collections.id))
      .where(eq(user_nfts.userId, userId));

    return results.map((r: any) => ({ ...r.user_nfts, nft: r.nft_collections! }));
  }

  async mintNft(userId: number, nftId: number): Promise<UserNft> {
    const db = await getDb();
    const tokenId = `nft-${nftId}-${userId}-${Date.now()}`;
    const [newUserNft] = await db.insert(user_nfts).values({
      userId,
      nftId,
      tokenId,
    }).returning();

    // Update supply
    await db.update(nft_collections)
      .set({ currentSupply: sql`${nft_collections.currentSupply} + 1` })
      .where(eq(nft_collections.id, nftId));

    return newUserNft;
  }

  async equipNft(userNftId: number): Promise<UserNft> {
    const db = await getDb();
    const [nft] = await db.update(user_nfts)
      .set({ equipped: true })
      .where(eq(user_nfts.id, userNftId))
      .returning();
    return nft;
  }

  async unequipNft(userNftId: number): Promise<UserNft> {
    const db = await getDb();
    const [nft] = await db.update(user_nfts)
      .set({ equipped: false })
      .where(eq(user_nfts.id, userNftId))
      .returning();
    return nft;
  }

  async getEquippedNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(user_nfts)
      .leftJoin(nft_collections, eq(user_nfts.nftId, nft_collections.id))
      .where(and(eq(user_nfts.userId, userId), eq(user_nfts.equipped, true)));

    return results.map((r: any) => ({ ...r.user_nfts, nft: r.nft_collections! }));
  }

  // Quests
  async getActiveQuests(): Promise<Quest[]> {
    const db = await getDb();
    const now = new Date();
    return await db.select().from(quests)
      .where(and(
        eq(quests.active, true),
        sql`${quests.expiresAt} > ${now} OR ${quests.expiresAt} IS NULL`
      ));
  }

  async getUserQuestProgress(userId: number): Promise<(UserQuestProgress & { quest: Quest })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(user_quest_progress)
      .leftJoin(quests, eq(user_quest_progress.questId, quests.id))
      .where(eq(user_quest_progress.userId, userId));

    return results.map((r: any) => ({ ...r.user_quest_progress, quest: r.quests! }));
  }

  async startQuest(userId: number, questId: number): Promise<UserQuestProgress> {
    const db = await getDb();
    const [progress] = await db.insert(user_quest_progress).values({
      userId,
      questId,
    }).returning();
    return progress;
  }

  async updateQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuestProgress> {
    const db = await getDb();
    const [updated] = await db.update(user_quest_progress)
      .set({ progress })
      .where(and(
        eq(user_quest_progress.userId, userId),
        eq(user_quest_progress.questId, questId)
      ))
      .returning();
    return updated;
  }

  async completeQuest(userId: number, questId: number): Promise<UserQuestProgress> {
    const db = await getDb();
    const [completed] = await db.update(user_quest_progress)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(and(
        eq(user_quest_progress.userId, userId),
        eq(user_quest_progress.questId, questId)
      ))
      .returning();
    return completed;
  }

  async claimQuestReward(userId: number, questId: number): Promise<{ quest: Quest; progress: UserQuestProgress }> {
    const db = await getDb();

    const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
    const [progress] = await db.update(user_quest_progress)
      .set({ claimed: true, claimedAt: new Date() })
      .where(and(
        eq(user_quest_progress.userId, userId),
        eq(user_quest_progress.questId, questId)
      ))
      .returning();

    return { quest, progress };
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    const db = await getDb();
    return await db.select().from(achievements).orderBy(achievements.tier);
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(user_achievements)
      .leftJoin(achievements, eq(user_achievements.achievementId, achievements.id))
      .where(eq(user_achievements.userId, userId));

    return results.map((r: any) => ({ ...r.user_achievements, achievement: r.achievements! }));
  }

  async updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement> {
    const db = await getDb();
    const [updated] = await db.update(user_achievements)
      .set({ progress })
      .where(and(
        eq(user_achievements.userId, userId),
        eq(user_achievements.achievementId, achievementId)
      ))
      .returning();
    return updated;
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const db = await getDb();
    const [unlocked] = await db.update(user_achievements)
      .set({
        unlocked: true,
        unlockedAt: new Date(),
      })
      .where(and(
        eq(user_achievements.userId, userId),
        eq(user_achievements.achievementId, achievementId)
      ))
      .returning();
    return unlocked;
  }

  async claimAchievementReward(userId: number, achievementId: number): Promise<{ achievement: Achievement; userAchievement: UserAchievement }> {
    const db = await getDb();

    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, achievementId));
    const [userAchievement] = await db.update(user_achievements)
      .set({ claimed: true, claimedAt: new Date() })
      .where(and(
        eq(user_achievements.userId, userId),
        eq(user_achievements.achievementId, achievementId)
      ))
      .returning();

    return { achievement, userAchievement };
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    const db = await getDb();
    return await db.select().from(teams).orderBy(desc(teams.totalTokens));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const db = await getDb();
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: CreateTeamRequest): Promise<Team> {
    const db = await getDb();
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async joinTeam(userId: number, teamId: number): Promise<TeamMember> {
    const db = await getDb();
    const [member] = await db.insert(team_members).values({
      userId,
      teamId,
    }).returning();

    // Update team member count
    await db.update(teams)
      .set({ totalMembers: sql`${teams.totalMembers} + 1` })
      .where(eq(teams.id, teamId));

    return member;
  }

  async leaveTeam(userId: number): Promise<void> {
    const db = await getDb();
    const [member] = await db.select().from(team_members).where(eq(team_members.userId, userId));

    if (member) {
      await db.delete(team_members).where(eq(team_members.userId, userId));
      await db.update(teams)
        .set({ totalMembers: sql`${teams.totalMembers} - 1` })
        .where(eq(teams.id, member.teamId));
    }
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(team_members)
      .leftJoin(users, eq(team_members.userId, users.id))
      .where(eq(team_members.teamId, teamId));

    return results.map((r: any) => ({ ...r.team_members, user: r.game_users! }));
  }

  async getUserTeam(userId: number): Promise<(TeamMember & { team: Team }) | undefined> {
    const db = await getDb();
    const results = await db.select()
      .from(team_members)
      .leftJoin(teams, eq(team_members.teamId, teams.id))
      .where(eq(team_members.userId, userId));

    if (results.length === 0) return undefined;
    return { ...results[0].team_members, team: results[0].teams! };
  }

  // Leaderboards
  async getLeaderboard(category: string, period: string, limit: number = 100): Promise<(LeaderboardEntry & { user: User })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(leaderboard_entries)
      .leftJoin(users, eq(leaderboard_entries.userId, users.id))
      .where(and(
        eq(leaderboard_entries.category, category),
        eq(leaderboard_entries.period, period)
      ))
      .orderBy(desc(leaderboard_entries.score))
      .limit(limit);

    return results.map((r: any) => ({ ...r.leaderboard_entries, user: r.game_users! }));
  }

  async updateLeaderboardEntry(userId: number, category: string, score: number, period: string): Promise<LeaderboardEntry> {
    const db = await getDb();
    const now = new Date();

    // Try to update existing entry
    const [existing] = await db.select().from(leaderboard_entries)
      .where(and(
        eq(leaderboard_entries.userId, userId),
        eq(leaderboard_entries.category, category),
        eq(leaderboard_entries.period, period)
      ));

    if (existing) {
      const [updated] = await db.update(leaderboard_entries)
        .set({ score, updatedAt: now })
        .where(eq(leaderboard_entries.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newEntry] = await db.insert(leaderboard_entries).values({
        userId,
        category,
        score,
        period,
        periodStart: now,
      }).returning();
      return newEntry;
    }
  }

  // Marketplace
  async getMarketplaceListings(status: string = 'active'): Promise<(MarketplaceListing & { nft: UserNft & { nft: NftCollection }; seller: User })[]> {
    const db = await getDb();
    const results = await db.select()
      .from(marketplace_listings)
      .leftJoin(user_nfts, eq(marketplace_listings.userNftId, user_nfts.id))
      .leftJoin(nft_collections, eq(user_nfts.nftId, nft_collections.id))
      .leftJoin(users, eq(marketplace_listings.sellerId, users.id))
      .where(eq(marketplace_listings.status, status))
      .orderBy(desc(marketplace_listings.listedAt));

    return results.map((r: any) => ({
      ...r.marketplace_listings,
      nft: { ...r.user_nfts!, nft: r.nft_collections! },
      seller: r.game_users!,
    }));
  }

  async createMarketplaceListing(sellerId: number, userNftId: number, price: number): Promise<MarketplaceListing> {
    const db = await getDb();
    const [listing] = await db.insert(marketplace_listings).values({
      sellerId,
      userNftId,
      price,
    }).returning();
    return listing;
  }

  async buyNft(listingId: number, buyerId: number): Promise<MarketplaceTransaction> {
    const db = await getDb();

    // Get listing
    const [listing] = await db.select().from(marketplace_listings).where(eq(marketplace_listings.id, listingId));

    // Update listing
    await db.update(marketplace_listings)
      .set({
        status: 'sold',
        soldAt: new Date(),
        buyerId,
      })
      .where(eq(marketplace_listings.id, listingId));

    // Transfer NFT
    await db.update(user_nfts)
      .set({ userId: buyerId, equipped: false })
      .where(eq(user_nfts.id, listing.userNftId));

    // Create transaction
    const [transaction] = await db.insert(marketplace_transactions).values({
      listingId,
      sellerId: listing.sellerId,
      buyerId,
      userNftId: listing.userNftId,
      price: listing.price,
    }).returning();

    return transaction;
  }

  async cancelListing(listingId: number): Promise<MarketplaceListing> {
    const db = await getDb();
    const [listing] = await db.update(marketplace_listings)
      .set({ status: 'cancelled' })
      .where(eq(marketplace_listings.id, listingId))
      .returning();
    return listing;
  }
}

// Memory storage implementation would go here (similar to before but with all new methods)
export class MemStorage implements IStorage {
  // ... (keeping existing implementation for brevity, would add all new methods)
  private users: Map<number, User>;
  private chains: Map<number, Chain>;
  private stakes: Map<number, Stake>;
  private predictions: Map<number, Prediction>;

  constructor() {
    this.users = new Map();
    this.chains = new Map();
    this.stakes = new Map();
    this.predictions = new Map();
  }

  // Implement all methods with in-memory logic...
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByAuthId(authId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.authId === authId);
  }

  async createUser(user: { authId: string; username: string; email?: string | null }): Promise<User> {
    const id = this.users.size + 1;
    const newUser: User = {
      ...user,
      id,
      miningPower: 1,
      tokens: 1000,
      createdAt: new Date(),
      experience: 0,
      level: 1,
      totalMined: 0,
      totalClicks: 0,
      prestigeLevel: 0,
      lastLoginAt: new Date(),
      email: user.email || null,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // ... (implement remaining methods with in-memory logic)
  // For brevity, showing stubs for new methods
  async updateUserTokens(userId: number, tokens: number): Promise<User> {
    const user = this.users.get(userId)!;
    const updated = { ...user, tokens };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserMiningPower(userId: number, power: number): Promise<User> {
    const user = this.users.get(userId)!;
    const updated = { ...user, miningPower: power };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserStats(userId: number, stats: Partial<User>): Promise<User> {
    const user = this.users.get(userId)!;
    const updated = { ...user, ...stats };
    this.users.set(userId, updated);
    return updated;
  }

  async getChains(): Promise<Chain[]> {
    return Array.from(this.chains.values());
  }

  async getChain(id: number): Promise<Chain | undefined> {
    return this.chains.get(id);
  }

  async updateChainStats(id: number, stats: Partial<Chain>): Promise<Chain> {
    const chain = this.chains.get(id)!;
    const updated = { ...chain, ...stats };
    this.chains.set(id, updated);
    return updated;
  }

  async createChain(chain: Omit<Chain, "id">): Promise<Chain> {
    const id = this.chains.size + 1;
    const newChain: Chain = { ...chain, id };
    this.chains.set(id, newChain);
    return newChain;
  }

  async createStake(stake: CreateStakeRequest): Promise<Stake> {
    const id = this.stakes.size + 1;
    const newStake: Stake = {
      ...stake,
      id,
      status: "active",
      active: true,
      startTime: new Date(),
      endTime: null,
      rewardsClaimed: 0,
    };
    this.stakes.set(id, newStake);
    return newStake;
  }

  async getUserStakes(userId: number): Promise<Stake[]> {
    return Array.from(this.stakes.values()).filter(s => s.userId === userId);
  }

  async getActiveStakes(userId: number): Promise<Stake[]> {
    return Array.from(this.stakes.values()).filter(s => s.userId === userId && s.active);
  }

  async closeStake(stakeId: number): Promise<Stake> {
    const stake = this.stakes.get(stakeId)!;
    const updated = { ...stake, active: false, status: 'closed', endTime: new Date() };
    this.stakes.set(stakeId, updated);
    return updated;
  }

  async createPrediction(prediction: CreatePredictionRequest): Promise<Prediction> {
    const id = this.predictions.size + 1;
    const newPrediction: Prediction = {
      ...prediction,
      id,
      status: "pending",
      resolved: false,
      won: null,
      actualValue: null,
      wagerAmount: prediction.wagerAmount ?? 0,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.predictions.set(id, newPrediction);
    return newPrediction;
  }

  async getPredictions(): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  async getUserPredictions(userId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  async resolvePrediction(predictionId: number, actualValue: number, won: boolean): Promise<Prediction> {
    const prediction = this.predictions.get(predictionId)!;
    const updated = {
      ...prediction,
      actualValue,
      won,
      resolved: true,
      status: 'resolved',
      resolvedAt: new Date(),
    };
    this.predictions.set(predictionId, updated);
    return updated;
  }

  // Stub implementations for new gaming features (would implement fully in production)
  async createMiningSession(session: CreateMiningSessionRequest): Promise<MiningSession> {
    throw new Error("Not implemented in MemStorage");
  }

  async getActiveMiningSession(userId: number): Promise<MiningSession | undefined> {
    return undefined;
  }

  async updateMiningSession(sessionId: number, updates: Partial<MiningSession>): Promise<MiningSession> {
    throw new Error("Not implemented in MemStorage");
  }

  async endMiningSession(sessionId: number, tokensEarned: number): Promise<MiningSession> {
    throw new Error("Not implemented in MemStorage");
  }

  async getUserMiningUpgrades(userId: number): Promise<MiningUpgrade[]> {
    return [];
  }

  async purchaseMiningUpgrade(upgrade: CreateMiningUpgradeRequest): Promise<MiningUpgrade> {
    throw new Error("Not implemented in MemStorage");
  }

  async upgradeMiningUpgrade(userId: number, upgradeType: string, upgradeName: string): Promise<MiningUpgrade> {
    throw new Error("Not implemented in MemStorage");
  }

  async getNftCollections(): Promise<NftCollection[]> {
    return [];
  }

  async getNftCollection(id: number): Promise<NftCollection | undefined> {
    return undefined;
  }

  async createNftCollection(nft: Omit<NftCollection, "id" | "createdAt" | "currentSupply">): Promise<NftCollection> {
    throw new Error("Not implemented in MemStorage");
  }

  async getUserNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]> {
    return [];
  }

  async mintNft(userId: number, nftId: number): Promise<UserNft> {
    throw new Error("Not implemented in MemStorage");
  }

  async equipNft(userNftId: number): Promise<UserNft> {
    throw new Error("Not implemented in MemStorage");
  }

  async unequipNft(userNftId: number): Promise<UserNft> {
    throw new Error("Not implemented in MemStorage");
  }

  async getEquippedNfts(userId: number): Promise<(UserNft & { nft: NftCollection })[]> {
    return [];
  }

  async getActiveQuests(): Promise<Quest[]> {
    return [];
  }

  async getUserQuestProgress(userId: number): Promise<(UserQuestProgress & { quest: Quest })[]> {
    return [];
  }

  async startQuest(userId: number, questId: number): Promise<UserQuestProgress> {
    throw new Error("Not implemented in MemStorage");
  }

  async updateQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuestProgress> {
    throw new Error("Not implemented in MemStorage");
  }

  async completeQuest(userId: number, questId: number): Promise<UserQuestProgress> {
    throw new Error("Not implemented in MemStorage");
  }

  async claimQuestReward(userId: number, questId: number): Promise<{ quest: Quest; progress: UserQuestProgress }> {
    throw new Error("Not implemented in MemStorage");
  }

  async getAchievements(): Promise<Achievement[]> {
    return [];
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return [];
  }

  async updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement> {
    throw new Error("Not implemented in MemStorage");
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    throw new Error("Not implemented in MemStorage");
  }

  async claimAchievementReward(userId: number, achievementId: number): Promise<{ achievement: Achievement; userAchievement: UserAchievement }> {
    throw new Error("Not implemented in MemStorage");
  }

  async getTeams(): Promise<Team[]> {
    return [];
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return undefined;
  }

  async createTeam(team: CreateTeamRequest): Promise<Team> {
    throw new Error("Not implemented in MemStorage");
  }

  async joinTeam(userId: number, teamId: number): Promise<TeamMember> {
    throw new Error("Not implemented in MemStorage");
  }

  async leaveTeam(userId: number): Promise<void> {
    // No-op
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    return [];
  }

  async getUserTeam(userId: number): Promise<(TeamMember & { team: Team }) | undefined> {
    return undefined;
  }

  async getLeaderboard(category: string, period: string, limit?: number): Promise<(LeaderboardEntry & { user: User })[]> {
    return [];
  }

  async updateLeaderboardEntry(userId: number, category: string, score: number, period: string): Promise<LeaderboardEntry> {
    throw new Error("Not implemented in MemStorage");
  }

  async getMarketplaceListings(status?: string): Promise<(MarketplaceListing & { nft: UserNft & { nft: NftCollection }; seller: User })[]> {
    return [];
  }

  async createMarketplaceListing(sellerId: number, userNftId: number, price: number): Promise<MarketplaceListing> {
    throw new Error("Not implemented in MemStorage");
  }

  async buyNft(listingId: number, buyerId: number): Promise<MarketplaceTransaction> {
    throw new Error("Not implemented in MemStorage");
  }

  async cancelListing(listingId: number): Promise<MarketplaceListing> {
    throw new Error("Not implemented in MemStorage");
  }
}

// Simple storage factory
export async function createStorage(): Promise<IStorage> {
  const { db } = await import("./db");

  if (db) {
    console.log("Using DatabaseStorage");
    return new DatabaseStorage();
  } else {
    console.log("Using MemStorage (In-Memory Fallback)");
    return new MemStorage();
  }
}

let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

export const storage = new Proxy({} as IStorage, {
  get: function (_target, prop: string) {
    return async (...args: any[]) => {
      const s = await getStorage();
      const method = (s as any)[prop];
      if (typeof method === 'function') {
        return method.apply(s, args);
      }
      return method;
    };
  }
});
