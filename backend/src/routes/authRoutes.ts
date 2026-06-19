import { Router } from 'express';
import { login, registerStaff, changePassword, getEmployees, toggleEmployeeReservable, getEmployeeTasks, toggleEmployeeActive, updateProfile } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// /api/auth/login
router.post('/login', login);

// /api/auth/register-staff (限管理員 Admin 呼叫)
router.post('/register-staff', authenticateToken as any, requireAdmin as any, registerStaff as any);

// /api/auth/change-password (登入員工修改自身密碼)
router.post('/change-password', authenticateToken as any, changePassword as any);

// /api/auth/profile (更新登入員工個人資料、頭像與密碼)
router.put('/profile', authenticateToken as any, updateProfile as any);

// /api/auth/employees (取得所有員工清單，Admin 專用)
router.get('/employees', authenticateToken as any, requireAdmin as any, getEmployees as any);

// /api/auth/employees/:id/reservable (變更排班權限，Admin 專用)
router.patch('/employees/:id/reservable', authenticateToken as any, requireAdmin as any, toggleEmployeeReservable as any);

// /api/auth/employees/:id/active (變更啟用狀態，Admin 專用)
router.patch('/employees/:id/active', authenticateToken as any, requireAdmin as any, toggleEmployeeActive as any);

// /api/auth/employees/:id/tasks (取得特定員工的任務，限管理員或登入用戶)
router.get('/employees/:id/tasks', authenticateToken as any, getEmployeeTasks as any);

export default router;


