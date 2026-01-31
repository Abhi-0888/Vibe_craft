import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_ANON_KEY: z.string().min(1),
    SESSION_SECRET: z.string().min(1),
    PORT: z.string().default("5005"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
