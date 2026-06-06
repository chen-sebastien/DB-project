import { Router } from 'express';
// 記得把 getDashboardStats 加進來
import {
    createReservation,
    getReservations,
    getPets,
    getFeedingTasks,
    updateFeedingStatus,
    createPetWithOwner,
    updateReservationStatus,
    getDashboardStats // ✨ 新增這行
} from '../controllers/reservationController';

const router = Router();

// 預約相關
router.post('/', createReservation);
router.get('/', getReservations);
router.patch('/:id/status', updateReservationStatus);

// 營運統計相關
router.get('/stats', getDashboardStats); // ✨ 新增這行：用來抓取看板數據

// 寵物相關
router.get('/pets', getPets);
router.post('/pets', createPetWithOwner);

// 餵食清單相關
router.get('/feeding', getFeedingTasks);
router.patch('/feeding/:id', updateFeedingStatus);

export default router;