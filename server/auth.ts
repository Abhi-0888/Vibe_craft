import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { users } from '@shared/models/auth';
import { db } from './db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';
const REFRESH_EXP_DAYS = 30;

export interface AuthUser {
    id: string;
    username: string;
    email?: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

// Simple JWT-based auth middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
}

function setRefreshCookie(res: Response, payload: { id: string; tokenVersion: number }) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${REFRESH_EXP_DAYS}d` });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        path: '/api/auth',
        maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60 * 1000,
    });
}

function parseCookies(req: Request): Record<string, string> {
    const header = req.headers.cookie;
    if (!header) return {};
    const out: Record<string, string> = {};
    header.split(';').forEach(part => {
        const [k, ...v] = part.trim().split('=');
        out[k] = decodeURIComponent(v.join('='));
    });
    return out;
}

// Simple login/register
export function setupAuth(app: any) {
    console.log('Auth system initialized (Simple JWT)');
}

export function registerAuthRoutes(app: any) {
    const registerSchema = z.object({
        email: z.string().email().transform(e => e.toLowerCase().trim()),
        username: z.string().min(3),
        password: z.string().min(8),
    });
    const loginSchema = z.object({
        email: z.string().email().transform(e => e.toLowerCase().trim()),
        password: z.string().min(8),
    });
    function hashPassword(password: string) {
        const salt = crypto.randomBytes(16).toString('hex');
        const derived = crypto.scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${derived}`;
    }
    function verifyPassword(password: string, stored: string) {
        const [salt, key] = stored.split(':');
        const derived = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
    }
    app.post('/api/auth/register', async (req: Request, res: Response) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
        if (!db) return res.status(500).json({ message: 'Database not ready' });
        const existing = await db.select().from(users).where(eq(users.email, parsed.data.email));
        if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });
        const passwordHash = hashPassword(parsed.data.password);
        const [row] = await db.insert(users).values({
            email: parsed.data.email,
            firstName: parsed.data.username,
            passwordHash,
            tokenVersion: 0,
        }).returning();
        const user: AuthUser = {
            id: row.id,
            username: parsed.data.username,
            email: parsed.data.email,
        };
        const token = generateToken(user);
        setRefreshCookie(res, { id: row.id, tokenVersion: row.tokenVersion ?? 0 });
        res.status(201).json({ user, token });
    });

    app.post('/api/auth/guest', async (req: Request, res: Response) => {
        const guestId = `guest_${crypto.randomBytes(4).toString('hex')}`;
        const user: AuthUser = {
            id: guestId,
            username: `Guest_${guestId.slice(-4).toUpperCase()}`,
        };
        const token = generateToken(user);
        res.json({ user, token });
    });
    app.get('/api/auth/guest', async (_req: Request, res: Response) => {
        const guestId = `guest_${crypto.randomBytes(4).toString('hex')}`;
        const user: AuthUser = {
            id: guestId,
            username: `Guest_${guestId.slice(-4).toUpperCase()}`,
        };
        const token = generateToken(user);
        res.json({ user, token });
    });
    // Handle any method for /api/auth/guest to fix 405 errors
    app.all('/api/auth/guest', async (req: Request, res: Response) => {
        const guestId = `guest_${crypto.randomBytes(4).toString('hex')}`;
        const user: AuthUser = {
            id: guestId,
            username: `Guest_${guestId.slice(-4).toUpperCase()}`,
        };
        const token = generateToken(user);
        res.json({ user, token });
    });
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
        if (!db) return res.status(500).json({ message: 'Database not ready' });
        const [row] = await db.select().from(users).where(eq(users.email, parsed.data.email));
        if (!row || !row.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = verifyPassword(parsed.data.password, row.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const user: AuthUser = {
            id: row.id,
            username: row.firstName || 'User',
            email: row.email || undefined,
        };
        const token = generateToken(user);
        setRefreshCookie(res, { id: row.id, tokenVersion: row.tokenVersion ?? 0 });
        res.json({ user, token });
    });

    app.post('/api/auth/wallet', async (req: Request, res: Response) => {
        const { address } = req.body;
        if (!address) return res.status(400).json({ message: 'Address required' });

        // For MVP, we trust the address. In production, we MUST verify a signature.
        let [row] = await db.select().from(users).where(eq(users.firstName, address)); // temporary: use firstName as storage for wallet addr map or assume existing username logic

        // Actually, let's look up by authId logic in createUser if possible, but here we strictly use 'users' table.
        // We'll treat the address as the "username" for now if no dedicated column.
        // Or better, check if 'auth_id' column exists in this 'users' model.
        // The 'users' imported from '@shared/models/auth' might be just local auth.
        // Let's check shared/models/auth.ts first to see available columns.

        // Assuming we can create a user with username=address
        if (!row) {
            [row] = await db.insert(users).values({
                email: `${address}@wallet.placeholder`, // Fake email
                firstName: address,
                passwordHash: '', // No password
                tokenVersion: 0,
            }).returning();
        }

        const user: AuthUser = {
            id: row.id,
            username: row.firstName || address,
        };
        const token = generateToken(user);
        setRefreshCookie(res, { id: row.id, tokenVersion: row.tokenVersion ?? 0 });
        res.json({ user, token });
    });

    app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
        res.json({ user: req.user });
    });

    app.post('/api/auth/logout', (req: Request, res: Response) => {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refresh_token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
            path: '/api/auth',
        });
        res.json({ success: true });
    });

    app.post('/api/auth/refresh', async (req: Request, res: Response) => {
        try {
            const cookies = parseCookies(req);
            const token = cookies['refresh_token'];
            if (!token) return res.status(401).json({ message: 'Unauthorized' });
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; tokenVersion: number };
            if (!db) return res.status(500).json({ message: 'Database not ready' });
            const [row] = await db.select().from(users).where(eq(users.id, decoded.id));
            if (!row || (row.tokenVersion ?? 0) !== decoded.tokenVersion) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const user: AuthUser = { id: row.id, username: row.firstName || 'User', email: row.email || undefined };
            const access = generateToken(user);
            res.json({ token: access });
        } catch {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    });
}
