import { Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

// --- Rooms CRUD ---

export const getRooms = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM rooms ORDER BY room_number ASC');
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return res.status(500).json({ error: '獲取房間列表失敗' });
    }
};

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
    const { room_number, room_type, daily_rate } = req.body;

    if (!room_number || !room_type || daily_rate === undefined) {
        return res.status(400).json({ error: '請提供房號、房型與每日價格' });
    }

    try {
        // 檢查房號是否已存在
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM rooms WHERE room_number = ?',
            [room_number]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: '此房號已存在' });
        }

        const insertQuery = 'INSERT INTO rooms (room_number, room_type, daily_rate) VALUES (?, ?, ?)';
        const [result] = await pool.execute<ResultSetHeader>(insertQuery, [room_number, room_type, daily_rate]);

        // 寫入操作日誌 (Audit Log)
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'CREATE_ROOM',
                `管理員【${employeeName}】新增了房間【房號：${room_number}，房型：${room_type}，價格：${daily_rate}】`
            ]
        );

        return res.status(201).json({ success: true, message: '房間新增成功', id: result.insertId });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: '新增房間失敗' });
    }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
        // 檢查是否有進行中或未來的預約使用此房間
        // status 為 Confirmed 或 Pending，且 end_time >= NOW()
        const checkQuery = `
            SELECT id FROM reservations 
            WHERE room_id = ? AND status IN ('Pending', 'Confirmed') AND end_time >= NOW()
            LIMIT 1
        `;
        const [rows]: any = await pool.execute(checkQuery, [id]);
        if (rows.length > 0) {
            return res.status(409).json({ 
                error: 'Conflict', 
                message: '無法刪除此房間：此房間在未來或目前有預約安排！' 
            });
        }

        // 獲取房間編號以記錄日誌
        const [roomRows]: any = await pool.execute('SELECT room_number FROM rooms WHERE id = ?', [id]);
        if (roomRows.length === 0) {
            return res.status(404).json({ error: '找不到該房間' });
        }
        const roomNumber = roomRows[0].room_number;

        // 執行刪除
        await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);

        // 寫入操作日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'DELETE_ROOM',
                `管理員【${employeeName}】刪除了房間【房號：${roomNumber} (ID: ${id})】`
            ]
        );

        return res.json({ success: true, message: '房間刪除成功' });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ error: '刪除房間失敗' });
    }
};

// --- Groomers CRUD ---

export const getGroomers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM groomers ORDER BY name ASC');
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching groomers:', error);
        return res.status(500).json({ error: '獲取美容師列表失敗' });
    }
};

export const createGroomer = async (req: AuthenticatedRequest, res: Response) => {
    const { name, specialty, experience_years, rating, service_count, service_rate } = req.body;

    if (!name || service_rate === undefined) {
        return res.status(400).json({ error: '請提供美容師姓名與服務收費' });
    }

    try {
        // 檢查是否重名
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM groomers WHERE name = ?',
            [name]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: '此美容師姓名已存在' });
        }

        const insertQuery = `
            INSERT INTO groomers (name, specialty, experience_years, rating, service_count, service_rate)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute<ResultSetHeader>(insertQuery, [
            name,
            specialty || null,
            experience_years !== undefined ? Number(experience_years) : 0,
            rating !== undefined ? Number(rating) : 5.0,
            service_count !== undefined ? Number(service_count) : 0,
            Number(service_rate)
        ]);

        // 寫入操作日誌 (Audit Log)
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'CREATE_GROOMER',
                `管理員【${employeeName}】新增了美容師【姓名：${name}，收費：${service_rate}，專長：${specialty || '無'}】`
            ]
        );

        return res.status(201).json({ success: true, message: '美容師新增成功', id: result.insertId });
    } catch (error) {
        console.error('Error creating groomer:', error);
        return res.status(500).json({ error: '新增美容師失敗' });
    }
};

export const deleteGroomer = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
        // 檢查是否有進行中或未來的預約指派給此美容師
        // status 為 Confirmed 或 Pending，且 end_time >= NOW()
        const checkQuery = `
            SELECT id FROM reservations 
            WHERE groomer_id = ? AND status IN ('Pending', 'Confirmed') AND end_time >= NOW()
            LIMIT 1
        `;
        const [rows]: any = await pool.execute(checkQuery, [id]);
        if (rows.length > 0) {
            return res.status(409).json({ 
                error: 'Conflict', 
                message: '無法刪除此美容師：此美容師在未來或目前有預約安排！' 
            });
        }

        // 獲取美容師姓名以記錄日誌
        const [groomerRows]: any = await pool.execute('SELECT name FROM groomers WHERE id = ?', [id]);
        if (groomerRows.length === 0) {
            return res.status(404).json({ error: '找不到該美容師' });
        }
        const groomerName = groomerRows[0].name;

        // 執行刪除
        await pool.execute('DELETE FROM groomers WHERE id = ?', [id]);

        // 寫入操作日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'DELETE_GROOMER',
                `管理員【${employeeName}】刪除了美容師【姓名：${groomerName} (ID: ${id})】`
            ]
        );

        return res.json({ success: true, message: '美容師刪除成功' });
    } catch (error) {
        console.error('Error deleting groomer:', error);
        return res.status(500).json({ error: '刪除美容師失敗' });
    }
};
