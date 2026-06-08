import { Router } from 'express';
import {
    createReservation,
    getReservations,
    getPets,
    getFeedingTasks,
    updateFeedingStatus,
    createPetWithOwner,
    updateReservationStatus,
    getDashboardStats
} from '../controllers/reservationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 保護所有 API：存取以下所有端點均需登入 JWT Token 驗證
router.use(authenticateToken as any);

// 預約相關
router.post('/', createReservation as any);
router.get('/', getReservations as any);
router.patch('/:id/status', updateReservationStatus as any);

// 營運統計相關
router.get('/stats', getDashboardStats as any);

// 寵物相關
router.get('/pets', getPets as any);
router.post('/pets', createPetWithOwner as any);

// 餵食清單相關
router.get('/feeding', getFeedingTasks as any);
router.patch('/feeding/:id', updateFeedingStatus as any);

export default router;