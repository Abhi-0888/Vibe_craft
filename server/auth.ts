import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

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
        // For development, create a guest user
        req.user = {
            id: 'guest-' + Date.now(),
            username: 'Guest' + Math.floor(Math.random() * 1000),
        };
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        next();
    } catch (error) {
        // Invalid token, create guest user
        req.user = {
            id: 'guest-' + Date.now(),
            username: 'Guest' + Math.floor(Math.random() * 1000),
        };
        next();
    }
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

// Simple login/register
export function setupAuth(app: any) {
    // For now, just a placeholder
    console.log('Auth system initialized (Simple JWT)');
}

export function registerAuthRoutes(app: any) {
    // Simple auth endpoints
    app.post('/api/auth/login', (req: Request, res: Response) => {
        const { username, email } = req.body;

        const user: AuthUser = {
            id: 'user-' + Date.now(),
            username: username || 'Player' + Math.floor(Math.random() * 10000),
            email,
        };

        const token = generateToken(user);

        res.json({
            user,
            token,
        });
    });

    app.post('/api/auth/register', (req: Request, res: Response) => {
        const { username, email } = req.body;

        const user: AuthUser = {
            id: 'user-' + Date.now(),
            username: username || 'Player' + Math.floor(Math.random() * 10000),
            email,
        };

        const token = generateToken(user);

        res.json({
            user,
            token,
        });
    });

    app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
        res.json({ user: req.user });
    });

    app.post('/api/auth/logout', (req: Request, res: Response) => {
        res.json({ success: true });
    });
}
