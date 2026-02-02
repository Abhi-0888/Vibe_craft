import { z } from 'zod';
import {
  insertUserSchema,
  insertStakeSchema,
  insertPredictionSchema,
  insertMiningSessionSchema,
  insertMiningUpgradeSchema,
  insertNftCollectionSchema,
  insertUserNftSchema,
  insertQuestSchema,
  insertTeamSchema,
  chains,
  game_users as users,
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
  card_game_state,
  card_game_players
} from './schema';

// Error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  // === CORE DATA ===
  chains: {
    list: {
      method: 'GET' as const,
      path: '/api/chains',
      responses: {
        200: z.array(z.custom<typeof chains.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/chains/:id',
      responses: {
        200: z.custom<typeof chains.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },

  // === USER & ECONOMY ===
  user: {
    me: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    upgradeMiner: {
      method: 'POST' as const,
      path: '/api/game/miner/upgrade', // Legacy - kept for compatibility
      input: z.object({
        type: z.enum(['gpu', 'asic', 'farm']),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },

  // === MINING SYSTEM ===
  mining: {
    session: {
      start: {
        method: 'POST' as const,
        path: '/api/mining/session/start',
        input: z.object({
          chainId: z.number().optional(),
        }),
        responses: {
          201: z.custom<typeof mining_sessions.$inferSelect>(),
          401: errorSchemas.unauthorized,
        },
      },
      click: {
        method: 'POST' as const,
        path: '/api/mining/session/click',
        input: z.object({
          clicks: z.number(),
          sessionId: z.number(),
        }),
        responses: {
          200: z.object({ tokensEarned: z.number(), user: z.custom<typeof users.$inferSelect>() }),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      end: {
        method: 'POST' as const,
        path: '/api/mining/session/end',
        input: z.object({
          sessionId: z.number(),
        }),
        responses: {
          200: z.custom<typeof mining_sessions.$inferSelect>(),
          401: errorSchemas.unauthorized,
        },
      }
    },
    upgrades: {
      list: {
        method: 'GET' as const,
        path: '/api/mining/upgrades',
        responses: {
          200: z.array(z.custom<typeof mining_upgrades.$inferSelect>()),
        },
      },
      purchase: {
        method: 'POST' as const,
        path: '/api/mining/upgrades/purchase',
        input: z.object({
          upgradeType: z.string(),
          upgradeName: z.string(),
        }),
        responses: {
          200: z.custom<typeof mining_upgrades.$inferSelect>(),
          400: errorSchemas.validation,
        },
      }
    }
  },

  // === NFT SYSTEM ===
  nfts: {
    collections: {
      list: {
        method: 'GET' as const,
        path: '/api/nfts/collections',
        responses: {
          200: z.array(z.custom<typeof nft_collections.$inferSelect>()),
        },
      },
    },
    user: {
      list: {
        method: 'GET' as const,
        path: '/api/nfts/me',
        responses: {
          200: z.array(z.any()), // Extended UserNft with NftCollection
        },
      },
      equip: {
        method: 'POST' as const,
        path: '/api/nfts/equip',
        input: z.object({ userNftId: z.number() }),
        responses: {
          200: z.custom<typeof user_nfts.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      unequip: {
        method: 'POST' as const,
        path: '/api/nfts/unequip',
        input: z.object({ userNftId: z.number() }),
        responses: {
          200: z.custom<typeof user_nfts.$inferSelect>(),
          400: errorSchemas.validation,
        },
      }
    }
  },

  // === QUEST SYSTEM ===
  quests: {
    list: {
      method: 'GET' as const,
      path: '/api/quests',
      responses: {
        200: z.array(z.custom<typeof quests.$inferSelect>()),
      },
    },
    user: {
      progress: {
        method: 'GET' as const,
        path: '/api/quests/me',
        responses: {
          200: z.array(z.any()), // UserQuestProgress with Quest
        },
      },
      claim: {
        method: 'POST' as const,
        path: '/api/quests/claim',
        input: z.object({ questId: z.number() }),
        responses: {
          200: z.object({ quest: z.custom<typeof quests.$inferSelect>(), progress: z.custom<typeof user_quest_progress.$inferSelect>() }),
          400: errorSchemas.validation,
        },
      }
    }
  },

  // === LEADERBOARDS ===
  leaderboards: {
    get: {
      method: 'GET' as const,
      path: '/api/leaderboards/:category/:period',
      responses: {
        200: z.array(z.any()), // LeaderboardEntry with User
      },
    }
  },

  // === TEAMS ===
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams',
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams/create',
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/teams/join',
      input: z.object({ teamId: z.number() }),
      responses: {
        200: z.custom<typeof team_members.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },

  // === GUARDIAN GAME ===
  stakes: {
    create: {
      method: 'POST' as const,
      path: '/api/game/stake',
      input: insertStakeSchema,
      responses: {
        201: z.custom<typeof stakes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    listMine: {
      method: 'GET' as const,
      path: '/api/game/stakes/me',
      responses: {
        200: z.array(z.custom<typeof stakes.$inferSelect>()),
      },
    },
  },

  // === CARD GAME SYSTEM ===
  cardGame: {
    state: {
      method: 'GET' as const,
      path: '/api/game/card/state',
      responses: {
        200: z.custom<typeof card_game_state.$inferSelect>(),
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/game/card/join',
      input: z.object({
        team: z.number().int().min(1).max(2),
        walletAddress: z.string(),
        signature: z.string(),
        stake: z.number().positive().optional(),
      }),
      responses: {
        201: z.custom<typeof card_game_players.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    players: {
      method: 'GET' as const,
      path: '/api/game/card/players',
      responses: {
        200: z.array(z.custom<typeof card_game_players.$inferSelect>()),
      },
    },
    begin: {
      method: 'POST' as const,
      path: '/api/game/card/begin',
      input: z.object({}),
      responses: {
        200: z.custom<typeof card_game_state.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    play: {
      method: 'POST' as const,
      path: '/api/game/card/play',
      input: z.object({
        index: z.number().int().min(0),
      }),
      responses: {
        200: z.custom<typeof card_game_state.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/game/card/reset',
      input: z.object({}),
      responses: {
        200: z.custom<typeof card_game_state.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
