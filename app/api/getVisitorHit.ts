import { NextApiRequest, NextApiResponse } from 'next';
import pool from './db/mysql';
import { RowDataPacket } from 'mysql2';

export default async function getVisitorHit(req: NextApiRequest, res: NextApiResponse) {
  try {
    const todayDate: string = req.query.todayDate as string;
    const yesterdayDate: string = req.query.yesterdayDate as string;
    const [[todayArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM visitor_today WHERE REGDATE='${todayDate}'`);
    const [[totalArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM visitor_total WHERE REGDATE='${todayDate}'`);

    if (todayArrayCount.count === 0 && todayDate) {
      const insertToday = await pool.query<RowDataPacket[]>(`INSERT INTO visitor_today (TODAY, TODAY_HIT, REGDATE) VALUES (1, 1, '${todayDate}')`);
    }

    if (totalArrayCount.count === 0 && todayDate) {
      const [[lastTotalRow]] = await pool.query<RowDataPacket[]>(`SELECT * FROM visitor_total ORDER BY IDX DESC LIMIT 1`);
      let totalValue = 1;
      if (lastTotalRow) {
        totalValue = lastTotalRow.TOTAL + 1;
      }
      const insertTotal = await pool.query<RowDataPacket[]>(`INSERT INTO visitor_total (TOTAL, TOTAL_HIT, REGDATE) VALUES (${totalValue}, 1, '${todayDate}')`);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM visitor_today WHERE REGDATE='${todayDate}'`);
    const [rows2] = await pool.query<RowDataPacket[]>(`SELECT * FROM visitor_total WHERE REGDATE='${todayDate}'`);
    res.status(200).json([...rows, ...rows2]);
  } catch (error) {
    console.error(error);
    res.status(200).json([{ IDX: 0, TODAY: 'error', TODAY_HIT: 'error', REGDATE: '2000-00-00' }, { IDX: 0, TODAY: 'error', TODAY_HIT: 'error', REGDATE: '2000-00-00' }]);
  }
}