import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// === CORE TABLES ===

export const game_users = pgTable('game_users', {
  id: serial('id').primaryKey(),
  authId: text('auth_id').notNull().unique(),
  username: text('username').notNull().unique(),
  email: text('email'),
  tokens: doublePrecision('tokens').default(1000),
  miningPower: doublePrecision('mining_power').default(1),
  experience: integer('experience').default(0),
  level: integer('level').default(1),
  totalMined: doublePrecision('total_mined').default(0),
  totalClicks: integer('total_clicks').default(0),
  prestigeLevel: integer('prestige_level').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
});

export const chains = pgTable('chains', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  tier: text('tier').notNull(),
  parentId: integer('parent_id'),
  tps: doublePrecision('tps').default(0),
  difficulty: doublePrecision('difficulty').default(1),
  activeMiners: integer('active_miners').default(0),
  lastBlockTime: timestamp('last_block_time').defaultNow(),
  health: doublePrecision('health').default(100),
  miningMultiplier: doublePrecision('mining_multiplier').default(1),
});

export const stakes = pgTable('stakes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  chainId: integer('chain_id').notNull(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').default('active'),
  active: boolean('active').default(true),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  rewardsClaimed: doublePrecision('rewards_claimed').default(0),
});

export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: text('type').notNull(),
  targetChainId: integer('target_chain_id').notNull(),
  predictedValue: doublePrecision('predicted_value').notNull(),
  actualValue: doublePrecision('actual_value'),
  wagerAmount: doublePrecision('wager_amount').default(0),
  status: text('status').default('pending'),
  resolved: boolean('resolved').default(false),
  won: boolean('won'),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// === MINING SYSTEM ===

export const mining_sessions = pgTable('mining_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  chainId: integer('chain_id'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  tokensEarned: doublePrecision('tokens_earned').default(0),
  clickCount: integer('click_count').default(0),
  autoMineSeconds: integer('auto_mine_seconds').default(0),
  active: boolean('active').default(true),
});

export const mining_upgrades = pgTable('mining_upgrades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  upgradeType: text('upgrade_type').notNull(),
  upgradeName: text('upgrade_name').notNull(),
  level: integer('level').default(1),
  multiplier: doublePrecision('multiplier').default(1),
  cost: doublePrecision('cost').notNull(),
  purchasedAt: timestamp('purchased_at').defaultNow(),
}, (table) => ({
  userUpgradeUnique: unique().on(table.userId, table.upgradeType, table.upgradeName),
}));

// === NFT SYSTEM ===

export const nft_collections = pgTable('nft_collections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  rarity: text('rarity').notNull(),
  imageUrl: text('image_url').notNull(),
  benefitType: text('benefit_type'),
  benefitValue: doublePrecision('benefit_value').default(0),
  maxSupply: integer('max_supply'),
  currentSupply: integer('current_supply').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const user_nfts = pgTable('user_nfts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  nftId: integer('nft_id').notNull(),
  tokenId: text('token_id').notNull().unique(),
  equipped: boolean('equipped').default(false),
  mintedAt: timestamp('minted_at').defaultNow(),
});

// === QUEST SYSTEM ===

export const quests = pgTable('quests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  requirementType: text('requirement_type').notNull(),
  requirementValue: doublePrecision('requirement_value').notNull(),
  rewardTokens: doublePrecision('reward_tokens').default(0),
  rewardNftId: integer('reward_nft_id'),
  rewardExperience: integer('reward_experience').default(0),
  active: boolean('active').default(true),
  startTime: timestamp('start_time').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const user_quest_progress = pgTable('user_quest_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  questId: integer('quest_id').notNull(),
  progress: doublePrecision('progress').default(0),
  completed: boolean('completed').default(false),
  claimed: boolean('claimed').default(false),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  claimedAt: timestamp('claimed_at'),
}, (table) => ({
  userQuestUnique: unique().on(table.userId, table.questId),
}));

// === ACHIEVEMENT SYSTEM ===

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  tier: text('tier').notNull(),
  requirementType: text('requirement_type').notNull(),
  requirementValue: doublePrecision('requirement_value').notNull(),
  rewardTokens: doublePrecision('reward_tokens').default(0),
  rewardNftId: integer('reward_nft_id'),
  rewardTitle: text('reward_title'),
  hidden: boolean('hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const user_achievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  achievementId: integer('achievement_id').notNull(),
  progress: doublePrecision('progress').default(0),
  unlocked: boolean('unlocked').default(false),
  claimed: boolean('claimed').default(false),
  unlockedAt: timestamp('unlocked_at'),
  claimedAt: timestamp('claimed_at'),
}, (table) => ({
  userAchievementUnique: unique().on(table.userId, table.achievementId),
}));

// === TEAM SYSTEM ===

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  tag: text('tag').notNull().unique(),
  leaderId: integer('leader_id').notNull(),
  logoUrl: text('logo_url'),
  totalMembers: integer('total_members').default(1),
  totalTokens: doublePrecision('total_tokens').default(0),
  totalMiningPower: doublePrecision('total_mining_power').default(0),
  level: integer('level').default(1),
  experience: integer('experience').default(0),
  maxMembers: integer('max_members').default(10),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const team_members = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  userId: integer('user_id').notNull(),
  role: text('role').default('member'),
  contributedTokens: doublePrecision('contributed_tokens').default(0),
  contributedMiningPower: doublePrecision('contributed_mining_power').default(0),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  userTeamUnique: unique().on(table.userId),
}));

// === LEADERBOARD SYSTEM ===

export const leaderboard_entries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  category: text('category').notNull(),
  score: doublePrecision('score').notNull(),
  rank: integer('rank'),
  period: text('period').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userCategoryPeriodUnique: unique().on(table.userId, table.category, table.period, table.periodStart),
}));

// === MARKETPLACE ===

export const marketplace_listings = pgTable('marketplace_listings', {
  id: serial('id').primaryKey(),
  sellerId: integer('seller_id').notNull(),
  userNftId: integer('user_nft_id').notNull(),
  price: doublePrecision('price').notNull(),
  status: text('status').default('active'),
  listedAt: timestamp('listed_at').defaultNow(),
  soldAt: timestamp('sold_at'),
  buyerId: integer('buyer_id'),
});

export const marketplace_transactions = pgTable('marketplace_transactions', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').notNull(),
  sellerId: integer('seller_id').notNull(),
  buyerId: integer('buyer_id').notNull(),
  userNftId: integer('user_nft_id').notNull(),
  price: doublePrecision('price').notNull(),
  transactionHash: text('transaction_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const card_game_state = pgTable('card_game_state', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').default(1),
  active: boolean('active').default(false),
  turn: integer('turn').default(1), // 1 or 2
  winner: integer('winner').default(0),
  hp1: integer('hp1').default(100),
  hp2: integer('hp2').default(100),
  prizePool: doublePrecision('prize_pool').default(0),
  cards1: integer('cards1').default(0),
  cards2: integer('cards2').default(0),
  lastActionAt: timestamp('last_action_at').defaultNow(),
});

export const card_game_players = pgTable('card_game_players', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull(),
  userId: integer('user_id').notNull(),
  team: integer('team').notNull(), // 1 or 2
  deck: jsonb('deck').$type<number[]>(), // Array of card IDs
  hasJoined: boolean('has_joined').default(true),
});

// === TYPES ===

export type User = typeof game_users.$inferSelect;
export type Chain = typeof chains.$inferSelect;
export type Stake = typeof stakes.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type MiningSession = typeof mining_sessions.$inferSelect;
export type MiningUpgrade = typeof mining_upgrades.$inferSelect;
export type NftCollection = typeof nft_collections.$inferSelect;
export type UserNft = typeof user_nfts.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type UserQuestProgress = typeof user_quest_progress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof user_achievements.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof team_members.$inferSelect;
export type LeaderboardEntry = typeof leaderboard_entries.$inferSelect;
export type MarketplaceListing = typeof marketplace_listings.$inferSelect;
export type MarketplaceTransaction = typeof marketplace_transactions.$inferSelect;
export type CardGameState = typeof card_game_state.$inferSelect;
export type CardGamePlayer = typeof card_game_players.$inferSelect;

// === INSERT SCHEMAS ===

export const insertUserSchema = createInsertSchema(game_users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  tokens: true,
  miningPower: true,
  experience: true,
  level: true,
  totalMined: true,
  totalClicks: true,
  prestigeLevel: true,
});

export const insertStakeSchema = createInsertSchema(stakes).omit({
  id: true,
  active: true,
  startTime: true,
  rewardsClaimed: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  resolved: true,
  won: true,
  createdAt: true,
  resolvedAt: true,
  actualValue: true,
});

export const insertMiningSessionSchema = createInsertSchema(mining_sessions).omit({
  id: true,
  startTime: true,
});

export const insertMiningUpgradeSchema = createInsertSchema(mining_upgrades).omit({
  id: true,
  purchasedAt: true,
});

export const insertNftCollectionSchema = createInsertSchema(nft_collections).omit({
  id: true,
  createdAt: true,
  currentSupply: true,
});

export const insertUserNftSchema = createInsertSchema(user_nfts).omit({
  id: true,
  mintedAt: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  totalMembers: true,
  totalTokens: true,
  totalMiningPower: true,
  level: true,
  experience: true,
});

// === REQUEST TYPES ===

export type CreateStakeRequest = z.infer<typeof insertStakeSchema>;
export type CreatePredictionRequest = z.infer<typeof insertPredictionSchema>;
export type CreateMiningSessionRequest = z.infer<typeof insertMiningSessionSchema>;
export type CreateMiningUpgradeRequest = z.infer<typeof insertMiningUpgradeSchema>;
export type CreateUserNftRequest = z.infer<typeof insertUserNftSchema>;
export type CreateTeamRequest = z.infer<typeof insertTeamSchema>;

export interface MinerUpgradeRequest {
  type: 'gpu' | 'asic' | 'farm';
}

export interface MineClickRequest {
  clicks: number;
  sessionId?: number;
}

export interface ClaimQuestRequest {
  questId: number;
}

export interface EquipNftRequest {
  userNftId: number;
}

export interface JoinTeamRequest {
  teamId: number;
}

export interface CreateMarketplaceListingRequest {
  userNftId: number;
  price: number;
}

export interface BuyNftRequest {
  listingId: number;
}


// Re-export Auth models
export * from './models/auth';
