import { Router } from 'express';
import {
    getRooms,
    createRoom,
    deleteRoom,
    getGroomers,
    createGroomer,
    deleteGroomer
} from '../controllers/resourceController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 所有資源操作皆需要登入
router.use(authenticateToken as any);

// 房間相關
router.get('/rooms', getRooms as any);
router.post('/rooms', requireAdmin as any, createRoom as any);
router.delete('/rooms/:id', requireAdmin as any, deleteRoom as any);

// 美容師相關
router.get('/groomers', getGroomers as any);
router.post('/groomers', requireAdmin as any, createGroomer as any);
router.delete('/groomers/:id', requireAdmin as any, deleteGroomer as any);

export default router;
