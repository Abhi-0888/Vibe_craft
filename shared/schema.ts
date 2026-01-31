
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const game_users = pgTable("game_users", {
  id: serial("id").primaryKey(),
  authId: text("auth_id").notNull().unique(), // Link to Replit Auth User ID
  username: text("username").notNull(),
  email: text("email"),
  // Game Economy
  tokens: doublePrecision("tokens").default(1000), 
  miningPower: doublePrecision("mining_power").default(0),
  experience: integer("experience").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chains = pgTable("chains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // 'prime', 'region', 'zone'
  parentId: integer("parent_id"), // Adjacency list for hierarchy
  // Real-time stats (mocked)
  tps: doublePrecision("tps").default(0),
  difficulty: doublePrecision("difficulty").default(0),
  activeMiners: integer("active_miners").default(0),
  lastBlockTime: timestamp("last_block_time").defaultNow(),
  health: doublePrecision("health").default(100), // 0-100
});

export const stakes = pgTable("stakes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References game_users.id
  chainId: integer("chain_id").notNull(), // References chains.id
  amount: doublePrecision("amount").notNull(),
  active: boolean("active").default(true),
  startTime: timestamp("start_time").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // References game_users.id
  type: text("type").notNull(), // 'tps_spike', 'block_time'
  targetChainId: integer("target_chain_id").notNull(),
  predictedValue: doublePrecision("predicted_value").notNull(),
  resolved: boolean("resolved").default(false),
  won: boolean("won"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(game_users).omit({ 
  id: true, 
  createdAt: true, 
  tokens: true, 
  miningPower: true, 
  experience: true 
});

export const insertChainSchema = createInsertSchema(chains).omit({ 
  id: true 
});

export const insertStakeSchema = createInsertSchema(stakes).omit({ 
  id: true, 
  active: true, 
  startTime: true 
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({ 
  id: true, 
  resolved: true, 
  won: true, 
  createdAt: true 
});

// === EXPLICIT API TYPES ===

export type User = typeof game_users.$inferSelect;
export type Chain = typeof chains.$inferSelect;
export type Stake = typeof stakes.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;

export type CreateStakeRequest = z.infer<typeof insertStakeSchema>;
export type CreatePredictionRequest = z.infer<typeof insertPredictionSchema>;

export interface MinerUpgradeRequest {
  type: 'gpu' | 'asic' | 'farm';
}

// Re-export Auth models as well
export * from "./models/auth";
