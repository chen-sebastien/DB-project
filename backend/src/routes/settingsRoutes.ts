import { Router } from 'express';
import { getSettings, updateSettings, getAuditLogs } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 所有設定 API 皆需要登入驗證
router.use(authenticateToken as any);

// 獲取營業時間設定 (任何登入員工皆可查看)
router.get('/', getSettings);

// 修改營業設定 (限 Admin 管理員)
router.put('/', requireAdmin as any, updateSettings);

// 獲取系統日誌 (限 Admin 管理員)
router.get('/logs', requireAdmin as any, getAuditLogs);

export default router;
