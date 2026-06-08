import { Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

// 取得所有設定值 (例如營業時間)
export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM settings');
        const settingsMap: Record<string, string> = {};
        rows.forEach(row => {
            settingsMap[row.key] = row.value;
        });
        return res.json(settingsMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: '獲取設定失敗' });
    }
};

// 修改營業設定 (限 Admin)
export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    const { business_start_time, business_end_time } = req.body;

    if (!business_start_time || !business_end_time) {
        return res.status(400).json({ error: '必須提供營業開始與結束時間' });
    }

    try {
        // 更新資料庫中的值
        await pool.execute('UPDATE settings SET value = ? WHERE `key` = ?', [business_start_time, 'business_start_time']);
        await pool.execute('UPDATE settings SET value = ? WHERE `key` = ?', [business_end_time, 'business_end_time']);

        // 寫入操作日誌 (Audit Log)
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_SETTINGS',
                `管理員【${employeeName}】將營業時間調整為 ${business_start_time} 至 ${business_end_time}`
            ]
        );

        return res.json({ success: true, message: '營業時間修改成功！' });
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: '修改營業設定失敗' });
    }
};

// 取得操作歷史軌跡日誌 (限 Admin 或是開放給 Staff 看但只能讀)
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 連接員工表，拉取操作人員名字
        const query = `
            SELECT a.id, a.action, a.details, a.created_at, e.name AS employee_name
            FROM audit_logs a
            LEFT JOIN employees e ON a.employee_id = e.id
            ORDER BY a.created_at DESC
            LIMIT 100; -- 限制 100 筆，避免查詢過載
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return res.status(500).json({ error: '獲取操作日誌失敗' });
    }
};
