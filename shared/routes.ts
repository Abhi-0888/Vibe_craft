
import { z } from 'zod';
import { insertUserSchema, insertStakeSchema, insertPredictionSchema, chains, users, stakes, predictions } from './schema';

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
      path: '/api/me', // Returns current user extended info
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    upgradeMiner: {
      method: 'POST' as const,
      path: '/api/game/miner/upgrade',
      input: z.object({
        type: z.enum(['gpu', 'asic', 'farm']),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },

  // === GAME: GUARDIAN ===
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

  // === GAME: PREDICTION ===
  predictions: {
    create: {
      method: 'POST' as const,
      path: '/api/game/predict',
      input: insertPredictionSchema,
      responses: {
        201: z.custom<typeof predictions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/game/predictions',
      responses: {
        200: z.array(z.custom<typeof predictions.$inferSelect>()),
      },
    }
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
