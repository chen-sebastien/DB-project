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
            SELECT id FROM Reservations 
            WHERE 
                status != 'CANCELLED' AND
                (
                    (room_id IS NOT NULL AND room_id = ?) OR 
                    (staff_id IS NOT NULL AND staff_id = ?)
                ) AND 
                start_datetime < ? AND 
                end_datetime > ?
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

        const insertQuery = `
            INSERT INTO Reservations (pet_id, room_id, staff_id, start_datetime, end_datetime, status)
            VALUES (?, ?, ?, ?, ?, 'CONFIRMED');
        `;
        
        const [insertResult] = await pool.execute<ResultSetHeader>(insertQuery, [
            pet_id,
            room_id || null,
            staff_id || null,
            start_datetime,
            end_datetime
        ]);

        return res.status(201).json({ 
            message: 'Reservation created successfully',
            reservation_id: insertResult.insertId 
        });

    } catch (error) {
        console.error('Error creating reservation:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getReservations = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM Reservations ORDER BY start_datetime DESC');
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
