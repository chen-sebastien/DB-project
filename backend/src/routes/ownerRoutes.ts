import { Router } from 'express';
import { getOwners, getOwnerPets } from '../controllers/reservationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getOwners as any);
router.get('/:id/pets', getOwnerPets as any);

export default router;
