import { Router } from 'express';
import { login, registerStaff, changePassword } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// /api/auth/login
router.post('/login', login);

// /api/auth/register-staff (限管理員 Admin 呼叫)
router.post('/register-staff', authenticateToken as any, requireAdmin as any, registerStaff as any);

// /api/auth/change-password (登入員工修改自身密碼)
router.post('/change-password', authenticateToken as any, changePassword as any);

export default router;

