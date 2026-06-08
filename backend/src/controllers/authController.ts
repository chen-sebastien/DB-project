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
                role: employee.role
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
