import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'pethotel-secret-key-12345';

// 登入 API
export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '請輸入帳號與密碼' });
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM employees WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        const employee = rows[0];
        if (!employee.is_active) {
            return res.status(403).json({ error: '此帳號已被停用' });
        }
        const isPasswordValid = await bcrypt.compare(password, employee.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        // 簽發 JWT Token
        const token = jwt.sign(
            {
                id: employee.id,
                username: employee.username,
                name: employee.name,
                role: employee.role
            },
            JWT_SECRET,
            { expiresIn: '8h' } // Token 有效期為 8 小時
        );

        // 寫入登入日誌 (audit_log)
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [employee.id, 'LOGIN', `員工【${employee.name}】登入系統`]
        );

        return res.json({
            success: true,
            message: '登入成功！',
            token,
            user: {
                id: employee.id,
                username: employee.username,
                name: employee.name,
                role: employee.role,
                avatar: employee.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: '系統登入發生異常' });
    }
};

// 建立員工帳號 API (限 Admin)
export const registerStaff = async (req: AuthenticatedRequest, res: Response) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: '請填寫所有必填欄位 (帳號、密碼、姓名)' });
    }

    try {
        // 檢查帳號是否已存在
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM employees WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: '此帳號已被註冊過囉！' });
        }

        // 對密碼進行雜湊
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 寫入資料庫
        const insertQuery = `
            INSERT INTO employees (username, password_hash, name, role)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.execute<ResultSetHeader>(insertQuery, [
            username,
            passwordHash,
            name,
            role || 'Staff'
        ]);

        // 記錄此操作到日誌中
        const adminId = req.user?.id || null;
        const adminName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [adminId, 'REGISTER_STAFF', `管理員【${adminName}】新增了員工帳號【${name} (${username})】`]
        );

        return res.status(201).json({
            success: true,
            message: '員工帳號建立成功！',
            employee_id: result.insertId
        });

    } catch (error) {
        console.error('Register staff error:', error);
        return res.status(500).json({ error: '建立員工帳號失敗' });
    }
};

// 修改個人密碼 API
export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const employeeId = req.user?.id;

    if (!employeeId) {
        return res.status(401).json({ error: '請登入系統以執行此操作' });
    }

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: '請提供舊密碼與新密碼' });
    }

    try {
        // 取得員工目前的密碼雜湊
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT password_hash, name FROM employees WHERE id = ?',
            [employeeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: '找不到該員工資料' });
        }

        const employee = rows[0];
        const isPasswordValid = await bcrypt.compare(oldPassword, employee.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ error: '舊密碼輸入錯誤' });
        }

        // 對新密碼進行雜湊
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 更新密碼
        await pool.execute(
            'UPDATE employees SET password_hash = ? WHERE id = ?',
            [newPasswordHash, employeeId]
        );

        // 記錄操作日誌
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [employeeId, 'CHANGE_PASSWORD', `員工【${employee.name}】修改了自己的密碼`]
        );

        return res.json({
            success: true,
            message: '密碼修改成功！'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: '修改密碼發生異常' });
    }
};

// 取得所有員工名單 (排除密碼，Admin 專用)
export const getEmployees = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, username, name, role, is_reservable, is_active, created_at FROM employees ORDER BY role DESC, name ASC'
        );
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 切換員工的可排班預約狀態 (Admin 專用)
export const toggleEmployeeReservable = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { is_reservable } = req.body;

    try {
        await pool.execute(
            'UPDATE employees SET is_reservable = ? WHERE id = ?',
            [is_reservable ? 1 : 0, id]
        );

        // 如果設定為啟用排班，自動同步建立同名的 groomer 資料以確保可被預約
        if (is_reservable) {
            const [empRows]: any = await pool.execute('SELECT name FROM employees WHERE id = ?', [id]);
            if (empRows.length > 0) {
                const empName = empRows[0].name;
                const [groomerRows]: any = await pool.execute('SELECT id FROM groomers WHERE name = ?', [empName]);
                if (groomerRows.length === 0) {
                    await pool.execute(
                        'INSERT INTO groomers (name, specialty, experience_years, rating, service_count, service_rate) VALUES (?, ?, ?, ?, ?, ?)',
                        [empName, '專業寵物照護、基礎洗沐', 1, 5.0, 0, 500]
                    );
                }
            }
        }

        // 記錄到日誌
        const adminId = req.user?.id || null;
        const adminName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                adminId,
                'TOGGLE_EMPLOYEE_RESERVABLE',
                `管理員【${adminName}】變更了員工 ID: ${id} 的排班預約狀態為【${is_reservable ? '啟用' : '停用'}】`
            ]
        );

        return res.json({ success: true, message: '排班狀態更新成功！' });
    } catch (error) {
        console.error('Error toggling reservable status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 取得特定員工的預約任務名冊 (用於管理者預覽監控)
export const getEmployeeTasks = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                res.id, 
                p.name AS pet_name, 
                r.room_number, 
                res.start_time, 
                res.end_time, 
                res.status,
                res.needs_feeding,
                res.needs_walking,
                res.needs_medication,
                res.needs_grooming,
                res.fed_completed,
                res.walk_completed,
                res.medication_completed,
                res.grooming_completed
            FROM reservations res
            JOIN pets p ON res.pet_id = p.id
            LEFT JOIN rooms r ON res.room_id = r.id
            WHERE res.groomer_id = ?
            ORDER BY res.start_time DESC;
        `;
        const [rows] = await pool.execute(query, [id]);
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 切換員工啟用/停用狀態 (Admin 專用)
export const toggleEmployeeActive = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        // 管理員不能停用自己
        if (req.user?.id === Number(id)) {
            return res.status(400).json({ error: '您不能停用自己的帳號' });
        }

        await pool.execute(
            'UPDATE employees SET is_active = ? WHERE id = ?',
            [is_active ? 1 : 0, id]
        );

        // 記錄到日誌
        const adminId = req.user?.id || null;
        const adminName = req.user?.name || '未知管理員';
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [
                adminId,
                'TOGGLE_EMPLOYEE_ACTIVE',
                `管理員【${adminName}】變更了員工 ID: ${id} 的啟用狀態為【${is_active ? '啟用' : '停用'}】`
            ]
        );

        return res.json({ success: true, message: '員工帳號狀態更新成功！' });
    } catch (error) {
        console.error('Error toggling active status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 更新登入者個人檔案 (P1-3)
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    const { name, username, avatar, oldPassword, newPassword } = req.body;
    const employeeId = req.user?.id;

    if (!employeeId) {
        return res.status(401).json({ error: '請登入系統以執行此操作' });
    }

    if (!name || !username) {
        return res.status(400).json({ error: '姓名與帳號為必填欄位' });
    }

    try {
        // 1. 檢查帳號是否被其他人佔用
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM employees WHERE username = ? AND id != ?',
            [username, employeeId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: '此帳號已被其他員工使用囉！' });
        }

        // 2. 取得原員工資料 (名字與舊密碼雜湊)
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT name, password_hash, role FROM employees WHERE id = ?',
            [employeeId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: '找不到該員工資料' });
        }
        const employee = rows[0];
        const oldName = employee.name;

        let passwordHash = employee.password_hash;

        // 3. 如果有輸入新密碼，進行密碼變更校驗
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: '修改密碼請提供舊密碼以進行驗證' });
            }
            const isPasswordValid = await bcrypt.compare(oldPassword, employee.password_hash);
            if (!isPasswordValid) {
                return res.status(400).json({ error: '舊密碼輸入錯誤' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: '新密碼長度必須至少為 6 個字元' });
            }
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(newPassword, salt);
        }

        // 4. 更新 employees 表
        await pool.execute(
            'UPDATE employees SET name = ?, username = ?, avatar = ?, password_hash = ? WHERE id = ?',
            [name, username, avatar || null, passwordHash, employeeId]
        );

        // 5. 同步更新 groomers 表中的美容師名稱 (若是名字有變更且有同名 groomer)
        if (name !== oldName) {
            await pool.execute(
                'UPDATE groomers SET name = ? WHERE name = ?',
                [name, oldName]
            );
        }

        // 6. 記錄操作日誌
        await pool.execute(
            'INSERT INTO audit_logs (employee_id, action, details) VALUES (?, ?, ?)',
            [employeeId, 'UPDATE_PROFILE', `員工【${name}】更新了個人檔案及帳號細節`]
        );

        // 7. 簽發新的 JWT Token
        const token = jwt.sign(
            {
                id: employeeId,
                username,
                name,
                role: employee.role
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            message: '個人檔案更新成功！',
            token,
            user: {
                id: employeeId,
                username,
                name,
                role: employee.role,
                avatar: avatar || null
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: '更新個人檔案發生異常' });
    }
};


