import { NextApiRequest, NextApiResponse } from 'next';
import pool from './db/mysql';
import { RowDataPacket } from 'mysql2';

export default async function updateVisitor(req: NextApiRequest, res: NextApiResponse) {
  try {
    const forwarded = req.headers["x-forwarded-for"] as string
    // const IPADDRESS = (forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress)?.replace(/\:\:ffff:/i,'')
    const IPADDRESS = req.body.IPADDRESS;
    const DATETIME = req.body.DATETIME;
    const DATE = req.body.DATE;
    const YESTERDAY = req.body.YESTERDAY;


    const insertVisitor = await pool.query<RowDataPacket[]>(`INSERT INTO visitor (IPADDRESS, DATETIME, DATE) VALUES ('${IPADDRESS}', '${DATETIME}', '${DATE}')`);

    /** update today table */
    const [[todayArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT COUNT( DISTINCT IPADDRESS ) as count FROM visitor WHERE DATE='${DATE}'`);
    const [[todayHitArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM visitor WHERE DATE='${DATE}'`);
    const updateToday = await pool.query<RowDataPacket[]>(`UPDATE visitor_today SET TODAY = '${todayArrayCount.count}', TODAY_HIT = '${todayHitArrayCount.count}' WHERE REGDATE='${DATE}'`)
    /** update total table */
    const [[totalArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT TODAY FROM visitor_today WHERE REGDATE='${DATE}'`);
    const [[totalHitArrayCount]] = await pool.query<RowDataPacket[]>(`SELECT TODAY_HIT FROM visitor_today WHERE REGDATE='${DATE}'`);
    const [[totalArrayCountYesterday]] = await pool.query<RowDataPacket[]>(`SELECT TOTAL FROM visitor_total WHERE REGDATE='${YESTERDAY}'`);
    const [[totalHitArrayCountYesterday]] = await pool.query<RowDataPacket[]>(`SELECT TOTAL_HIT FROM visitor_total WHERE REGDATE='${YESTERDAY}'`);

    const TOTAL = totalArrayCount.TODAY+totalArrayCountYesterday.TOTAL
    const TOTAL_HIT = totalHitArrayCount.TODAY_HIT+totalHitArrayCountYesterday.TOTAL_HIT
    
    const updateTotal = await pool.query<RowDataPacket[]>(`UPDATE visitor_total SET TOTAL = '${TOTAL}', TOTAL_HIT = '${TOTAL_HIT}' WHERE REGDATE='${DATE}'`)

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM visitor_today WHERE REGDATE='${DATE}'`);
    const [rows2] = await pool.query<RowDataPacket[]>(`SELECT * FROM visitor_total WHERE REGDATE='${DATE}'`);
    // const count = rows;
    return res.status(200).json([...rows,...rows2]);
  } catch (error) {
    console.error(error);
    res.status(200).json([ { IDX: 0, TODAY: 'error', TODAY_HIT: 'error', REGDATE: '2000-00-00' }, { IDX: 0, TODAY: 'error', TODAY_HIT: 'error', REGDATE: '2000-00-00' } ]);
    // res.status(500).json({ error });
  }
}