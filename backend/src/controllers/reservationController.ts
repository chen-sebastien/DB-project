import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createReservation = async (req: Request, res: Response) => {
    const { pet_id, room_id, staff_id, start_datetime, end_datetime } = req.body;

    if (!start_datetime || !end_datetime || !pet_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
        return res.status(400).json({ error: 'start_datetime must be earlier than end_datetime' });
    }

    // 依據討論，預約房間或美容師為獨立資源，但至少須擇一
    if (!room_id && !staff_id) {
        return res.status(400).json({ error: 'Must select at least one resource (room or staff)' });
    }

    try {
        // 衝堂檢核核心邏輯
        const overlapQuery = `
            SELECT id FROM reservations 
            WHERE 
                status != 'Cancelled' AND
                (
                    (room_id IS NOT NULL AND room_id = ?) OR 
                    (groomer_id IS NOT NULL AND groomer_id = ?)
                ) AND 
                start_time < ? AND 
                end_time > ?
            LIMIT 1;
        `;

        const [conflictRows] = await pool.execute<RowDataPacket[]>(overlapQuery, [
            room_id || null, 
            staff_id || null, 
            end_datetime, 
            start_datetime
        ]);

        if (conflictRows.length > 0) {
            return res.status(409).json({ 
                error: 'Conflict', 
                message: '此時段資源已被佔用，請選擇其他時段或資源。' 
            });
        }

        // 新增預約
        // ... (前面原本的新增預約程式碼保留) ...
        const insertQuery = `
            INSERT INTO reservations (pet_id, room_id, groomer_id, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, 'Confirmed');
        `;
        
        const [insertResult] = await pool.execute<ResultSetHeader>(insertQuery, [
            pet_id,
            room_id || null,
            staff_id || null,
            start_datetime,
            end_datetime
        ]);

        // ✨ 這裡開始是新加的：自動產生一筆預設的餵食任務 ✨
        // 假設預設在入住時間的同一天發送餵食任務
        const newReservationId = insertResult.insertId;
        const insertFeedingQuery = `
            INSERT INTO feeding_tasks (reservation_id, feeding_time, food_info, is_fed)
            VALUES (?, ?, '系統預設：入住乾糧一份 (可由後台修改)', 0);
        `;
        await pool.execute(insertFeedingQuery, [newReservationId, start_datetime]);
        // ✨ 新加區塊結束 ✨

        return res.status(201).json({ 
            message: 'Reservation created successfully',
            reservation_id: newReservationId 
        });
        // ... (後面的 catch 保留) ...

    } catch (error) {
        console.error('Error creating reservation:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 取得所有預約紀錄 (進階版：將 ID 替換成真實名稱)
export const getReservations = async (req: Request, res: Response) => {
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
export const getPets = async (req: Request, res: Response) => {
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

// --- 餵食清單相關 API ---

// --- 取得餵食清單 (進階版：利用 JOIN 撈出寵物的過敏史與備註) ---
export const getFeedingTasks = async (req: Request, res: Response) => {
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
            ORDER BY f.feeding_time ASC;
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching feeding tasks:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. 更新餵食狀態 (打勾/取消打勾)
export const updateFeedingStatus = async (req: Request, res: Response) => {
    const { id } = req.params; // 從網址抓取任務 ID
    const { is_fed } = req.body; // 從前端傳來的狀態 (true/false)

    try {
        // MySQL 裡 boolean 通常存成 1 或 0
        const fedStatus = is_fed ? 1 : 0; 
        await pool.execute('UPDATE feeding_tasks SET is_fed = ? WHERE id = ?', [fedStatus, id]);
        return res.json({ success: true, message: '狀態更新成功' });
    } catch (error) {
        console.error('Error updating feeding status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 顧客與寵物建檔 API ---
export const createPetWithOwner = async (req: Request, res: Response) => {
    // 增加接收 medical_history 和 notes
    const { owner_name, phone, pet_name, size, medical_history, notes } = req.body;

    if (!owner_name || !phone || !pet_name || !size) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    try {
        const insertOwnerQuery = `INSERT INTO owners (name, phone) VALUES (?, ?)`;
        const [ownerResult] = await pool.execute<ResultSetHeader>(insertOwnerQuery, [owner_name, phone]);
        const ownerId = ownerResult.insertId;

        // 將過敏史與備註一起寫入資料庫，如果沒填就給 null
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
export const updateReservationStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updateQuery = `UPDATE reservations SET status = ? WHERE id = ?`;
        await pool.execute(updateQuery, [status, id]);
        return res.json({ success: true, message: '狀態更新成功' });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


// --- 營運統計看板 API (大秀 SQL 聚合函數實力) ---
// --- 營運統計看板 API (進階版：加入今日即時住房率) ---
export const getDashboardStats = async (req: Request, res: Response) => {
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

        // 3. ✨ 全新加入：今日即時住房率動態計算 ✨
        // A. 撈取資料庫內總共有幾間房
        const [roomCountRows]: any = await pool.execute(`SELECT COUNT(*) as total_rooms FROM rooms`);
        const totalRooms = roomCountRows[0]?.total_rooms || 1; // 防呆，避免除以 0

        // B. 計算「現在這個瞬間 (NOW())」有幾間房被 Confirmed 的訂單佔用
        const [occupiedRows]: any = await pool.execute(`
            SELECT COUNT(DISTINCT room_id) as occupied_count 
            FROM reservations 
            WHERE status = 'Confirmed' 
              AND room_id IS NOT NULL 
              AND NOW() BETWEEN start_time AND end_time
        `);
        const occupiedRooms = occupiedRows[0]?.occupied_count || 0;

        // C. 計算百分比
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        // 回傳統計資料給前端
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