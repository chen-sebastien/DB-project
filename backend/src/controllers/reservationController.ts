import { Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

export const createReservation = async (req: AuthenticatedRequest, res: Response) => {
    const { pet_id, room_id, staff_id, start_datetime, end_datetime } = req.body;

    if (!start_datetime || !end_datetime || !pet_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
        return res.status(400).json({ error: 'start_datetime must be earlier than end_datetime' });
    }

    if (!room_id && !staff_id) {
        return res.status(400).json({ error: 'Must select at least one resource (room or staff)' });
    }

    try {
        // 🚨 營業時間防呆校驗
        const [settingsRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM settings');
        const settingsMap: Record<string, string> = {};
        settingsRows.forEach(row => { settingsMap[row.key] = row.value; });
        
        const businessStart = settingsMap['business_start_time'] || '09:00';
        const businessEnd = settingsMap['business_end_time'] || '21:00';

        // 取得時間之 HH:MM 格式字串，用來比對營業時間
        const getHourMinuteStr = (dateStr: string) => {
            const date = new Date(dateStr);
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        const startHM = getHourMinuteStr(start_datetime);
        const endHM = getHourMinuteStr(end_datetime);

        if (startHM < businessStart || endHM > businessEnd) {
            return res.status(400).json({ 
                error: 'BusinessHoursConflict', 
                message: `⚠️ 預約時間不在營業時間內！本店營業時間為 ${businessStart} 至 ${businessEnd}，請重新調整。` 
            });
        }

        // 🚨 終極保險 1：將前端傳來的字串 ID 強制轉為「數字」，避免資料庫配對失效
        const safeRoomId = room_id ? Number(room_id) : null;
        const safeStaffId = staff_id ? Number(staff_id) : null;

        // 🚨 終極保險 2：在 Node.js 端手動清洗時間格式，確保 MySQL 絕對能辨識
        const formatDateTime = (dt: string) => {
            let formatted = dt.replace('T', ' ');
            if (formatted.length === 16) formatted += ':00';
            return formatted;
        };
        const safeStart = formatDateTime(start_datetime);
        const safeEnd = formatDateTime(end_datetime);

        // 衝堂檢核核心邏輯
        const overlapQuery = `
            SELECT 
                res.room_id, r.room_number,
                res.groomer_id, g.name AS groomer_name
            FROM reservations res
            LEFT JOIN rooms r ON res.room_id = r.id
            LEFT JOIN groomers g ON res.groomer_id = g.id
            WHERE 
                res.status IN ('Confirmed', 'Completed') AND
                (
                    (res.room_id IS NOT NULL AND res.room_id = ?) OR 
                    (res.groomer_id IS NOT NULL AND res.groomer_id = ?)
                ) AND 
                res.start_time < ? AND 
                res.end_time > ?
            LIMIT 1;
        `;

        // 傳入安全的數字與乾淨的時間字串
        const [conflictRows]: any = await pool.execute(overlapQuery, [
            safeRoomId, 
            safeStaffId, 
            safeEnd, 
            safeStart
        ]);

        if (conflictRows.length > 0) {
            const conflict = conflictRows[0];
            let conflictMessage = '此時段資源已被佔用，請選擇其他時段或資源。';
            
            // ✨ 終極保險 3：使用寬鬆比對 (==) 或是直接拿 safeRoomId 比對，確保對話框能正確顯示 ✨
            if (safeRoomId && conflict.room_id === safeRoomId) {
                conflictMessage = `⚠️ 衝堂阻擋：您選擇的房間【${conflict.room_number || '未知'}】在該時段已被預約！`;
            } else if (safeStaffId && conflict.groomer_id === safeStaffId) {
                conflictMessage = `⚠️ 衝堂阻擋：美容師【${conflict.groomer_name || '未知'}】在該時段已有排程！`;
            }

            return res.status(409).json({ 
                error: 'Conflict', 
                message: conflictMessage 
            });
        }

        // 新增預約 (寫入安全的格式)
        const insertQuery = `
            INSERT INTO reservations (pet_id, room_id, groomer_id, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, 'Confirmed');
        `;
        
        const [insertResult]: any = await pool.execute(insertQuery, [
            pet_id,
            safeRoomId,
            safeStaffId,
            safeStart,
            safeEnd
        ]);

        const newReservationId = insertResult.insertId;

        // ✨ 自動產生一筆預設的餵食任務 ✨
        const insertFeedingQuery = `
            INSERT INTO feeding_tasks (reservation_id, feeding_time, food_info, is_fed)
            VALUES (?, ?, '系統預設：入住乾糧一份 (可由後台修改)', 0);
        `;
        await pool.execute(insertFeedingQuery, [newReservationId, safeStart]);

        // 記錄此操作到日誌中
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'CREATE_RESERVATION',
                `員工【${employeeName}】新增了預約（ID: ${newReservationId}，寵物 ID: ${pet_id}）`
            ]
        );

        return res.status(201).json({ 
            message: 'Reservation created successfully',
            reservation_id: newReservationId 
        });

    } catch (error) {
        console.error('Error creating reservation:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 取得所有預約紀錄 (進階版：將 ID 替換成真實名稱)
export const getReservations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = `
            SELECT 
                res.id, 
                p.name AS pet_name, 
                r.room_number, 
                g.name AS groomer_name, 
                res.start_time, 
                res.end_time, 
                res.status 
            FROM reservations res
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            LEFT JOIN groomers g ON res.groomer_id = g.id
            ORDER BY res.start_time DESC;
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 撈取寵物與對應的飼主資料 (展示 JOIN 的威力)
export const getPets = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = `
            SELECT p.id, p.name AS pet_name, p.size, o.name AS owner_name 
            FROM pets p
            JOIN owners o ON p.owner_id = o.id
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching pets:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 取得餵食清單 (修復版：過濾掉已取消的訂單) ---
export const getFeedingTasks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = `
            SELECT 
                f.id, f.feeding_time, f.food_info, f.is_fed,
                p.name AS pet_name, 
                p.medical_history, 
                p.notes,
                r.room_number
            FROM feeding_tasks f
            JOIN reservations res ON f.reservation_id = res.id
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            WHERE UPPER(res.status) != 'CANCELLED'
            ORDER BY f.feeding_time ASC;
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching feeding tasks:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 更新餵食狀態 (打勾/取消打勾)
export const updateFeedingStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { is_fed } = req.body;

    try {
        const fedStatus = is_fed ? 1 : 0; 
        await pool.execute('UPDATE feeding_tasks SET is_fed = ? WHERE id = ?', [fedStatus, id]);

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_FEEDING_STATUS',
                `員工【${employeeName}】更動了任務 ID: ${id} 的餵食狀態為【${is_fed ? '已餵食' : '未餵食'}】`
            ]
        );

        return res.json({ success: true, message: '狀態更新成功' });
    } catch (error) {
        console.error('Error updating feeding status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 顧客與寵物建檔 API ---
export const createPetWithOwner = async (req: AuthenticatedRequest, res: Response) => {
    const { owner_name, phone, pet_name, size, medical_history, notes } = req.body;

    if (!owner_name || !phone || !pet_name || !size) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    try {
        const insertOwnerQuery = `INSERT INTO owners (name, phone) VALUES (?, ?)`;
        const [ownerResult] = await pool.execute<ResultSetHeader>(insertOwnerQuery, [owner_name, phone]);
        const ownerId = ownerResult.insertId;

        const insertPetQuery = `
            INSERT INTO pets (owner_id, name, species, size, medical_history, notes) 
            VALUES (?, ?, 'Dog', ?, ?, ?)
        `;
        await pool.execute(insertPetQuery, [
            ownerId, 
            pet_name, 
            size, 
            medical_history || null, 
            notes || null
        ]);

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'CREATE_PET_WITH_OWNER',
                `員工【${employeeName}】建立了新顧客與寵物檔案：【${owner_name} / 寵物：${pet_name}】`
            ]
        );

        return res.status(201).json({ success: true, message: '建檔成功！' });
    } catch (error: any) {
        console.error('Error creating owner and pet:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: '此電話號碼已經註冊過囉！' });
        }
        return res.status(500).json({ error: '系統發生異常，建檔失敗' });
    }
};

// 更新預約狀態
export const updateReservationStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updateQuery = `UPDATE reservations SET status = ? WHERE id = ?`;
        await pool.execute(updateQuery, [status, id]);

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_RESERVATION_STATUS',
                `員工【${employeeName}】更新預約 ID: ${id} 的狀態為【${status}】`
            ]
        );

        return res.json({ success: true, message: '狀態更新成功' });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 營運統計看板 API ---
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 1. 訂單狀態統計
        const [statusRows] = await pool.execute(`
            SELECT status, COUNT(*) as count 
            FROM reservations 
            GROUP BY status
        `);

        // 2. 明星美容師排行
        const [groomerRows] = await pool.execute(`
            SELECT g.name, COUNT(res.id) as task_count
            FROM reservations res
            JOIN groomers g ON res.groomer_id = g.id
            GROUP BY g.id, g.name
            ORDER BY task_count DESC
            LIMIT 3
        `);

        // 3. 今日即時住房率動態計算
        const [roomCountRows]: any = await pool.execute(`SELECT COUNT(*) as total_rooms FROM rooms`);
        const totalRooms = roomCountRows[0]?.total_rooms || 1;

        const [occupiedRows]: any = await pool.execute(`
            SELECT COUNT(DISTINCT room_id) as occupied_count 
            FROM reservations 
            WHERE status = 'Confirmed' 
              AND room_id IS NOT NULL 
              AND NOW() BETWEEN start_time AND end_time
        `);
        const occupiedRooms = occupiedRows[0]?.occupied_count || 0;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        return res.json({
            statusStats: statusRows,
            topGroomers: groomerRows,
            occupancy: {
                occupied: occupiedRooms,
                total: totalRooms,
                rate: occupancyRate
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};