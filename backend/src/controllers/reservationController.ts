import { Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

export const createReservation = async (req: AuthenticatedRequest, res: Response) => {
    const { pet_id, room_id, staff_id, start_datetime, end_datetime, needs_feeding, needs_walking, needs_medication, needs_grooming } = req.body;

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
                res.groomer_id, g.name AS groomer_name,
                res.start_time, res.end_time,
                p.name AS pet_name
            FROM reservations res
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            LEFT JOIN groomers g ON res.groomer_id = g.id
            WHERE 
                res.status IN ('Confirmed', 'Completed', 'Pending') AND
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
            const pad = (n: number) => String(n).padStart(2, '0');
            const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            const timeSlot = `${fmt(new Date(conflict.start_time))}至${fmt(new Date(conflict.end_time))}`;
            let conflictMessage = '此時段資源已被佔用，請選擇其他時段或資源。';
            
            if (safeRoomId && conflict.room_id === safeRoomId) {
                conflictMessage = `⚠️ 衝堂阻擋：[${conflict.room_number || '未知'}] [${timeSlot}] 已由 [${conflict.pet_name}] 預約，請重新選擇時間。`;
            } else if (safeStaffId && conflict.groomer_id === safeStaffId) {
                conflictMessage = `⚠️ 衝堂阻擋：[${conflict.groomer_name || '未知'}] [${timeSlot}] 已由 [${conflict.pet_name}] 預約，請重新選擇時間。`;
            }

            return res.status(409).json({ 
                error: 'Conflict', 
                message: conflictMessage 
            });
        }

        // 新增預約 (寫入安全的格式)
        const insertQuery = `
            INSERT INTO reservations (pet_id, room_id, groomer_id, start_time, end_time, status, needs_feeding, needs_walking, needs_medication, needs_grooming)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?);
        `;
        
        const safeNeedsFeeding = needs_feeding ? 1 : 0;
        const safeNeedsWalking = needs_walking ? 1 : 0;
        const safeNeedsMedication = needs_medication ? 1 : 0;
        const safeNeedsGrooming = needs_grooming ? 1 : 0;

        const [insertResult]: any = await pool.execute(insertQuery, [
            pet_id,
            safeRoomId,
            safeStaffId,
            safeStart,
            safeEnd,
            safeNeedsFeeding,
            safeNeedsWalking,
            safeNeedsMedication,
            safeNeedsGrooming
        ]);

        const newReservationId = insertResult.insertId;

        // ✨ 自動產生一筆預設的餵食任務 (若有勾選餵食需求) ✨
        if (safeNeedsFeeding) {
            const insertFeedingQuery = `
                INSERT INTO feeding_tasks (reservation_id, feeding_time, food_info, is_fed)
                VALUES (?, ?, '系統預設：入住乾糧一份 (可由後台修改)', 0);
            `;
            await pool.execute(insertFeedingQuery, [newReservationId, safeStart]);
        }

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

// 取得所有預約紀錄 (進階版：將 ID 替換成真實名稱，且依權限分流)
export const getReservations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let query = `
            SELECT 
                res.id, 
                p.name AS pet_name, 
                r.room_number, 
                g.name AS groomer_name, 
                res.start_time, 
                res.end_time, 
                res.status,
                res.payment_status,
                res.needs_feeding,
                res.needs_walking,
                res.needs_medication,
                res.needs_grooming,
                res.room_rate,
                res.grooming_rate,
                res.total_amount,
                res.payment_method
            FROM reservations res
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            LEFT JOIN groomers g ON res.groomer_id = g.id
        `;
        const params: any[] = [];

        // 員工 (Staff) 只能看見指派給自己的訂單，Admin (老闆) 可通覽全部
        if (req.user && req.user.role !== 'Admin') {
            query += ` WHERE g.name = ? `;
            params.push(req.user.name);
        }

        query += ` ORDER BY res.start_time DESC; `;

        const [rows] = await pool.execute(query, params);
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
            SELECT p.id, p.name AS pet_name, p.species, p.size, p.medical_history, p.notes, o.name AS owner_name, o.phone 
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

// --- 取得餵食與照護工作清單 (從 feeding_tasks 表撈取，且依權限分流) ---
export const getFeedingTasks = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let query = `
            SELECT 
                ft.id, 
                ft.reservation_id,
                ft.feeding_time, 
                ft.food_info,
                ft.is_fed,
                ft.is_walked AS walk_completed,
                ft.is_medicated AS medication_completed,
                ft.is_groomed AS grooming_completed,
                p.name AS pet_name, 
                p.medical_history, 
                p.notes,
                r.room_number,
                res.needs_feeding,
                res.needs_walking,
                res.needs_medication,
                res.needs_grooming,
                res.fed_completed AS overall_fed_completed,
                res.walk_completed AS overall_walk_completed,
                res.medication_completed AS overall_medication_completed,
                res.grooming_completed AS overall_grooming_completed
            FROM feeding_tasks ft
            JOIN reservations res ON ft.reservation_id = res.id
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            LEFT JOIN groomers g ON res.groomer_id = g.id
            WHERE UPPER(res.status) != 'CANCELLED'
        `;
        const params: any[] = [];

        if (req.user && req.user.role !== 'Admin') {
            query += ` AND g.name = ? `;
            params.push(req.user.name);
        }

        query += ` ORDER BY ft.feeding_time ASC; `;

        const [rows] = await pool.execute(query, params);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching feeding tasks:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 更新餵食與照護狀態 (打勾/取消打勾 - 任務獨立化)
export const updateFeedingStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { is_fed, is_walked, is_medicated, is_groomed } = req.body;

    try {
        let updateQuery = 'UPDATE feeding_tasks SET ';
        const updates: string[] = [];
        const params: any[] = [];

        if (is_fed !== undefined) {
            updates.push('is_fed = ?');
            params.push(is_fed ? 1 : 0);
        }
        if (is_walked !== undefined) {
            updates.push('is_walked = ?');
            params.push(is_walked ? 1 : 0);
        }
        if (is_medicated !== undefined) {
            updates.push('is_medicated = ?');
            params.push(is_medicated ? 1 : 0);
        }
        if (is_groomed !== undefined) {
            updates.push('is_groomed = ?');
            params.push(is_groomed ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '沒有提供需要修改的欄位' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await pool.execute(updateQuery, params);

        // 同步更新 reservations 中的整體完成狀態 (全部 timeline 任務都完成時才算整體完成)
        const [taskRows]: any = await pool.execute('SELECT reservation_id FROM feeding_tasks WHERE id = ?', [id]);
        if (taskRows.length > 0) {
            const resId = taskRows[0].reservation_id;
            
            // 重新讀取該預約下的所有任務以更新 parent reservation 狀態
            const [allTasks]: any = await pool.execute(
                'SELECT is_fed, is_walked, is_medicated, is_groomed FROM feeding_tasks WHERE reservation_id = ?', 
                [resId]
            );

            const allFed = allTasks.every((t: any) => t.is_fed === 1 || t.is_fed === true);
            const allWalked = allTasks.every((t: any) => t.is_walked === 1 || t.is_walked === true);
            const allMedicated = allTasks.every((t: any) => t.is_medicated === 1 || t.is_medicated === true);
            const allGroomed = allTasks.every((t: any) => t.is_groomed === 1 || t.is_groomed === true);

            await pool.execute(
                'UPDATE reservations SET fed_completed = ?, walk_completed = ?, medication_completed = ?, grooming_completed = ? WHERE id = ?',
                [
                    allFed ? 1 : 0,
                    allWalked ? 1 : 0,
                    allMedicated ? 1 : 0,
                    allGroomed ? 1 : 0,
                    resId
                ]
            );
        }

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_FEEDING_STATUS',
                `員工【${employeeName}】更動了照護任務 ID: ${id}，更新項目：${Object.keys(req.body).join(', ')}`
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
    const { owner_name, phone, pet_name, size, species, medical_history, notes } = req.body;

    if (!owner_name || !phone || !pet_name || !size || !species) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    try {
        const insertOwnerQuery = `INSERT INTO owners (name, phone) VALUES (?, ?)`;
        const [ownerResult] = await pool.execute<ResultSetHeader>(insertOwnerQuery, [owner_name, phone]);
        const ownerId = ownerResult.insertId;

        const insertPetQuery = `
            INSERT INTO pets (owner_id, name, species, size, medical_history, notes) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(insertPetQuery, [
            ownerId, 
            pet_name, 
            species,
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

// 更新預約狀態與付款狀態
export const updateReservationStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { 
        status, 
        payment_status, 
        payment_method,
        fed_completed, 
        walk_completed, 
        medication_completed, 
        grooming_completed 
    } = req.body;

    try {
        let updateQuery = 'UPDATE reservations SET ';
        const updates: string[] = [];
        const params: any[] = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
        }
        if (payment_method) {
            updates.push('payment_method = ?');
            params.push(payment_method);
        }
        if (fed_completed !== undefined) {
            updates.push('fed_completed = ?');
            params.push(fed_completed ? 1 : 0);
        }
        if (walk_completed !== undefined) {
            updates.push('walk_completed = ?');
            params.push(walk_completed ? 1 : 0);
        }
        if (medication_completed !== undefined) {
            updates.push('medication_completed = ?');
            params.push(medication_completed ? 1 : 0);
        }
        if (grooming_completed !== undefined) {
            updates.push('grooming_completed = ?');
            params.push(grooming_completed ? 1 : 0);
        }

        // 當預約審核變更為 Confirmed 且帶有 payment_method 時，後端依據晚數與價格計算
        if (status === 'Confirmed' && payment_method) {
            const [resRows]: any = await pool.execute(
                'SELECT room_id, groomer_id, start_time, end_time FROM reservations WHERE id = ?',
                [id]
            );
            if (resRows.length > 0) {
                const { room_id, groomer_id, start_time, end_time } = resRows[0];
                const startDate = new Date(start_time);
                const endDate = new Date(end_time);
                const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

                let room_rate = 0;
                let grooming_rate = 0;

                if (room_id) {
                    const [roomRows]: any = await pool.execute('SELECT daily_rate FROM rooms WHERE id = ?', [room_id]);
                    if (roomRows.length > 0) {
                        room_rate = roomRows[0].daily_rate;
                    }
                }

                if (groomer_id) {
                    const [groomerRows]: any = await pool.execute('SELECT service_rate FROM groomers WHERE id = ?', [groomer_id]);
                    if (groomerRows.length > 0) {
                        grooming_rate = groomerRows[0].service_rate;
                    }
                }

                const total_amount = (room_rate * nights) + grooming_rate;

                updates.push('room_rate = ?');
                params.push(room_rate);
                updates.push('grooming_rate = ?');
                params.push(grooming_rate);
                updates.push('total_amount = ?');
                params.push(total_amount);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await pool.execute(updateQuery, params);

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_RESERVATION_STATUS',
                `員工【${employeeName}】更新預約 ID: ${id}，狀態為【${status || '無更動'}】，付款狀態為【${payment_status || '無更動'}】，餵食：${fed_completed !== undefined ? (fed_completed ? '已完成' : '未完成') : '無更動'}，散步：${walk_completed !== undefined ? (walk_completed ? '已完成' : '未完成') : '無更動'}，給藥：${medication_completed !== undefined ? (medication_completed ? '已完成' : '未完成') : '無更動'}，美容：${grooming_completed !== undefined ? (grooming_completed ? '已完成' : '未完成') : '無更動'}`
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

// 編輯寵物與對應的飼主資料
export const updatePetWithOwner = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { owner_name, phone, pet_name, size, species, medical_history, notes } = req.body;

    if (!owner_name || !phone || !pet_name || !size || !species) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    try {
        // 先找出 pet 的 owner_id
        const [petRows]: any = await pool.execute('SELECT owner_id FROM pets WHERE id = ?', [id]);
        if (petRows.length === 0) {
            return res.status(404).json({ error: '找不到該寵物檔案' });
        }
        const ownerId = petRows[0].owner_id;

        // 更新 owners 表
        await pool.execute(
            'UPDATE owners SET name = ?, phone = ? WHERE id = ?',
            [owner_name, phone, ownerId]
        );

        // 更新 pets 表
        await pool.execute(
            'UPDATE pets SET name = ?, species = ?, size = ?, medical_history = ?, notes = ? WHERE id = ?',
            [pet_name, species, size, medical_history || null, notes || null, id]
        );

        // 記錄到日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_PET_WITH_OWNER',
                `員工【${employeeName}】編輯了寵物與飼主檔案（ID: ${id}，${owner_name} / 寵物：${pet_name}）`
            ]
        );

        return res.json({ success: true, message: '檔案更新成功！' });
    } catch (error: any) {
        console.error('Error updating owner and pet:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: '此電話號碼已被其他飼主使用囉！' });
        }
        return res.status(500).json({ error: '系統發生異常，更新失敗' });
    }
};

// 取得所有可預約的服務人員/員工
export const getReservableStaff = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 自動同步：找出所有 is_reservable = 1 且 is_active = 1 的員工，若無對應的 groomer 則自動建檔
        const [employees]: any = await pool.execute(
            'SELECT name FROM employees WHERE is_reservable = 1 AND is_active = 1'
        );
        for (const emp of employees) {
            const [groomerRows]: any = await pool.execute('SELECT id FROM groomers WHERE name = ?', [emp.name]);
            if (groomerRows.length === 0) {
                await pool.execute(
                    'INSERT INTO groomers (name, specialty, experience_years, rating, service_count, service_rate) VALUES (?, ?, ?, ?, ?, ?)',
                    [emp.name, '專業寵物照護、基礎洗沐', 1, 5.0, 0, 500]
                );
            }
        }

        const query = `
            SELECT g.id, g.name, g.specialty, g.experience_years, g.rating, g.service_count, g.service_rate 
            FROM groomers g
            JOIN employees e ON g.name = e.name
            WHERE e.is_reservable = 1 AND e.is_active = 1
            ORDER BY g.name ASC
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching reservable staff:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 取得所有飼主 (left join + group by pet count)
export const getOwners = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = `
            SELECT o.id, o.name, o.phone, o.email, COUNT(p.id) as pet_count
            FROM owners o
            LEFT JOIN pets p ON o.id = p.owner_id
            GROUP BY o.id
            ORDER BY o.name ASC
        `;
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching owners:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 取得特定飼主的名下寵物
export const getOwnerPets = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT id, name, species, size, medical_history, notes
            FROM pets
            WHERE owner_id = ?
            ORDER BY name ASC
        `;
        const [rows] = await pool.execute(query, [id]);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching owner pets:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 刪除寵物檔案 (限 Admin)
export const deletePet = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        // 檢查是否有未來/進行中的預約 (status 為 Confirmed 或 Pending，且 end_time >= NOW())
        const checkQuery = `
            SELECT id FROM reservations 
            WHERE pet_id = ? AND status IN ('Pending', 'Confirmed') AND end_time >= NOW()
            LIMIT 1
        `;
        const [rows]: any = await pool.execute(checkQuery, [id]);
        if (rows.length > 0) {
            return res.status(409).json({ 
                error: 'Conflict', 
                message: '無法刪除該寵物：此毛孩目前有進行中或尚未開始的預約！' 
            });
        }

        // 取得寵物與飼主名稱做 Log 用
        const [petInfo]: any = await pool.execute(`
            SELECT p.name AS pet_name, o.name AS owner_name 
            FROM pets p 
            JOIN owners o ON p.owner_id = o.id 
            WHERE p.id = ?
        `, [id]);

        let logDetails = `管理員刪除了寵物 ID: ${id}`;
        if (petInfo.length > 0) {
            logDetails = `管理員【${req.user?.name}】刪除了寵物檔案：【${petInfo[0].owner_name} / 寵物：${petInfo[0].pet_name}】`;
        }

        // 執行刪除
        await pool.execute('DELETE FROM pets WHERE id = ?', [id]);

        // 記錄 audit log
        const employeeId = req.user?.id || null;
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [employeeId, 'DELETE_PET', logDetails]
        );

        return res.json({ success: true, message: '寵物檔案刪除成功！' });
    } catch (error) {
        console.error('Error deleting pet:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 新增餵食任務
export const createFeedingTask = async (req: AuthenticatedRequest, res: Response) => {
    const { reservation_id, feeding_time, food_info } = req.body;
    if (!reservation_id || !feeding_time || !food_info) {
        return res.status(400).json({ error: '缺少必要欄位' });
    }
    try {
        const insertQuery = `
            INSERT INTO feeding_tasks (reservation_id, feeding_time, food_info, is_fed)
            VALUES (?, ?, ?, 0)
        `;
        await pool.execute(insertQuery, [reservation_id, feeding_time, food_info]);

        // 將預約的 fed_completed 設為 0 (因為新增了未完成的餵食任務)
        await pool.execute('UPDATE reservations SET fed_completed = 0 WHERE id = ?', [reservation_id]);

        // 寫入日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'CREATE_FEEDING_TASK',
                `員工【${employeeName}】為預約 ID: ${reservation_id} 新增了餵食任務：${food_info} (時間: ${feeding_time})`
            ]
        );
        return res.status(201).json({ success: true, message: '餵食任務新增成功' });
    } catch (error) {
        console.error('Error creating feeding task:', error);
        return res.status(500).json({ error: '新增餵食任務失敗' });
    }
};

// 修改餵食任務
export const updateFeedingTask = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { food_info, feeding_time, is_fed } = req.body;
    try {
        const [taskRows]: any = await pool.execute('SELECT reservation_id FROM feeding_tasks WHERE id = ?', [id]);
        if (taskRows.length === 0) {
            return res.status(404).json({ error: '找不到該餵食任務' });
        }
        const resId = taskRows[0].reservation_id;

        let updateQuery = 'UPDATE feeding_tasks SET ';
        const updates: string[] = [];
        const params: any[] = [];

        if (food_info !== undefined) {
            updates.push('food_info = ?');
            params.push(food_info);
        }
        if (feeding_time !== undefined) {
            updates.push('feeding_time = ?');
            params.push(feeding_time);
        }
        if (is_fed !== undefined) {
            updates.push('is_fed = ?');
            params.push(is_fed ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '沒有提供修改的欄位' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await pool.execute(updateQuery, params);

        // 更新 reservations.fed_completed
        const [allTasks]: any = await pool.execute('SELECT is_fed FROM feeding_tasks WHERE reservation_id = ?', [resId]);
        const allFed = allTasks.every((t: any) => t.is_fed === 1 || t.is_fed === true);
        await pool.execute('UPDATE reservations SET fed_completed = ? WHERE id = ?', [allFed ? 1 : 0, resId]);

        // 寫入日誌
        const employeeId = req.user?.id || null;
        const employeeName = req.user?.name || '未知員工';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                employeeId,
                'UPDATE_FEEDING_TASK',
                `員工【${employeeName}】修改了餵食任務 ID: ${id}，內容：${food_info || '未修改'} (時間: ${feeding_time || '未修改'})`
            ]
        );
        return res.json({ success: true, message: '餵食任務修改成功' });
    } catch (error) {
        console.error('Error updating feeding task:', error);
        return res.status(500).json({ error: '修改餵食任務失敗' });
    }
};

// 檢查特定時段可用房型與美容師 (P0-3 & P0-4)
export const checkAvailability = async (req: AuthenticatedRequest, res: Response) => {
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
        return res.status(400).json({ error: '缺少 start_time 或 end_time 參數' });
    }

    try {
        const formatDateTime = (dt: string) => {
            let formatted = dt.replace('T', ' ');
            if (formatted.length === 16) formatted += ':00';
            return formatted;
        };
        const safeStart = formatDateTime(start_time as string);
        const safeEnd = formatDateTime(end_time as string);

        // 查詢此時段已被佔用的房間
        const [occupiedRooms]: any = await pool.execute(
            `SELECT DISTINCT room_id FROM reservations 
             WHERE status IN ('Confirmed', 'Completed', 'Pending') 
               AND room_id IS NOT NULL 
               AND start_time < ? 
               AND end_time > ?`,
            [safeEnd, safeStart]
        );

        // 查詢此時段已被佔用的美容師
        const [occupiedGroomers]: any = await pool.execute(
            `SELECT DISTINCT groomer_id FROM reservations 
             WHERE status IN ('Confirmed', 'Completed', 'Pending') 
               AND groomer_id IS NOT NULL 
               AND start_time < ? 
               AND end_time > ?`,
            [safeEnd, safeStart]
        );

        const occupiedRoomIds = occupiedRooms.map((r: any) => r.room_id);
        const occupiedGroomerIds = occupiedGroomers.map((g: any) => g.groomer_id);

        return res.json({
            occupiedRoomIds,
            occupiedGroomerIds
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        return res.status(500).json({ error: '檢查可用資源失敗' });
    }
};