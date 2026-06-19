import { Router } from 'express';
import {
    createReservation,
    getReservations,
    getReservableStaff,
    getPets,
    getFeedingTasks,
    updateFeedingStatus,
    createPetWithOwner,
    updatePetWithOwner,
    updateReservationStatus,
    getDashboardStats,
    deletePet,
    createFeedingTask,
    updateFeedingTask,
    checkAvailability
} from '../controllers/reservationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 保護所有 API：存取以下所有端點均需登入 JWT Token 驗證
router.use(authenticateToken as any);

// 預約相關
router.post('/', createReservation as any);
router.get('/', getReservations as any);
router.get('/staffs', getReservableStaff as any);
router.get('/check-availability', checkAvailability as any);
router.patch('/:id/status', updateReservationStatus as any);

// 營運統計相關
router.get('/stats', getDashboardStats as any);

// 寵物相關
router.get('/pets', getPets as any);
router.post('/pets', createPetWithOwner as any);
router.put('/pets/:id', updatePetWithOwner as any);
router.delete('/pets/:id', requireAdmin as any, deletePet as any);

// 餵食清單相關
router.get('/feeding', getFeedingTasks as any);
router.patch('/feeding/:id', updateFeedingStatus as any);
router.post('/feeding', createFeedingTask as any);
router.put('/feeding/:id', updateFeedingTask as any);

export default router;