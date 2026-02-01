import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, integer } from "drizzle-orm/pg-core";

// Session storage table.
export const sessions = pgTable(
    "sessions",
    {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull(),
    },
    (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (Replit Auth)
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    username: varchar("username").unique(),
    passwordHash: varchar("password_hash"),
    tokenVersion: integer("token_version").default(0),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertAuthUser = typeof users.$inferInsert;
export type AuthUser = typeof users.$inferSelect;
