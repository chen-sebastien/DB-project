import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pethotel-secret-key-12345';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        name: string;
        role: 'Admin' | 'Staff';
    };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized', message: '請先登入系統' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden', message: '登入憑證無效或已過期' });
        }
        req.user = user as any;
        next();
    });
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden', message: '此操作需要管理員權限' });
    }
    next();
};
