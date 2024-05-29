import pool from '@/api/db/mysql'
import styles from '@/styles/module/Footer.module.scss'
import { RowDataPacket } from 'mysql2'
import Image from 'next/image'
import Link from 'next/link';

// {todayHit,totalHit}
type Visitor = {
  IDX: number;
  TODAY: number;
  TODAY_HIT: number;
  REGDATE: number;
};
type Visitor2 = {
  IDX: number;
  TOTAL: number;
  TOTAL_HIT: number;
  REGDATE: number;
};
type Props = {
  statistics: [Visitor, Visitor2];
};


function getDates(){
  // 1. 현재 시간(Locale)
  const curr = new Date();

  // 2. UTC 시간 계산
  const utc = 
        curr.getTime() + 
        (curr.getTimezoneOffset() * 60 * 1000);

  // 3. UTC to KST (UTC + 9시간)
  const KR_TIME_DIFF = 9 * 60 * 60 * 1000;

  const today = new Date(utc + (KR_TIME_DIFF)); // 오늘
  const year = today.getFullYear();
  let month = (today.getMonth()+1).toString();
  let date = today.getDate().toString();
  
  if(month.length === 1) month = '0'+ month;
  if(date.length === 1) date = '0'+ date;
  const fullDate = `${year}-${month}-${date}`
  
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const yesterdayYear = yesterday.getFullYear();
  let yesterdayMonth = (yesterday.getMonth()+1).toString();
  let yesterdayDate = yesterday.getDate().toString()
  
  if(yesterdayMonth.length === 1) yesterdayMonth = '0'+ yesterdayMonth;
  if(yesterdayDate.length === 1) yesterdayDate = '0'+ yesterdayDate;
  const fullYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDate}`

  // 시간 구하기
  let hour = today.getHours().toString()
  let minute = today.getMinutes().toString()
  let second = today.getSeconds().toString()
  if(hour.length === 1) hour = '0'+ hour;
  if(minute.length === 1) minute = '0'+ minute;
  if(second.length === 1) second = '0'+ second;
  const fullDateTime = `${fullDate} ${hour}:${minute}:${second}`
  
  return [fullDate, fullYesterday, fullDateTime]
}

export const getStatistics = async() => {
  let statistics:[Visitor, Visitor2] = [
    {
      IDX: 0,
      TODAY: 0,
      TODAY_HIT: 0,
      REGDATE: 0,
    },
    {
      IDX: 0,
      TOTAL: 0,
      TOTAL_HIT: 0,
      REGDATE: 0,
    }
  ]
  try {
    const [todayDate, yesterdayDate] = getDates();

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

    const res = [...rows, ...rows2]
    if(
      res[0].IDX
      && res[0].TODAY
      && res[0].TODAY_HIT
      && res[0].REGDATE
      && res[1].IDX
      && res[1].TOTAL
      && res[1].TOTAL_HIT
      && res[1].REGDATE
    ) (statistics as any) = [...rows, ...rows2]
    console.log('/////////////////')
    console.log(statistics)
    console.log('/////////////////')
    return { props: { statistics }};
  } catch (error) {
    console.error(error);
    return { props: { statistics }};
  }
}

// const [todayDate, yesterdayDate,fullDateTime] = getDates();
// const data = {
//   DATETIME:fullDateTime,
//   DATE:todayDate,
//   YESTERDAY:yesterdayDate,
//   IPADDRESS:ip,
// }
// const updateVisitor = axios.post<(Visitor | Visitor2)[]>(`/api/updateVisitor`,data)
// .then(res=>{
//   // console.log(res.data)
//   const [todayObj, totalObj] = res.data;
//   if ("TODAY" in todayObj) {
//     const todayData = todayObj as Visitor;
//     setTodayHit(todayData.TODAY);
//   }
//   if ("TOTAL" in totalObj) {
//     const totalData = totalObj as Visitor2;
//     setTotalHit(totalData.TOTAL);
//   }
//   hljs.highlightAll();
//   setIsContentLoad(false)
//   setTimeout(()=>{
//     setIsLoad(false)
//   },1500)
// }).catch(er=> console.log(er))

export const  Footer = async() => {
  const props:Props = (await getStatistics()).props
  return (
    <footer className={`${styles["footer"]}`} id="contact">
    <div className={`${styles["footer-inner"]}`}>
      <article className={`${styles["footer-logo"]}`}>
        <Link className="img-box" href="/">
            <Image src={'/images/logo2.png'} alt='logo' className='onlyPC' width={242} height={33} />
            <Image src={'/public/images/logo3.png'} alt='logo' className='onlySP' width={92} height={82} />
        </Link>
      </article>
      <article className={`${styles["footer-desc"]}`}>
        <h5>글루미스토어 <em><span>today: {props.statistics[0].TODAY_HIT}</span><span>total: {props.statistics[1].TOTAL_HIT}</span></em></h5>
        <p><a href="tel:01043431354">TEL : 010-4343-1354</a></p>
        <p><a href="mailto:serenity90s@naver.com">EMAIL : serenity90s@naver.com</a></p>
        <p>COPYRIGHT © 2019 YOUNG e Design CO., LTD. All Rights Reserved. Designed by YOUNG e Design</p>
      </article>
    </div>
  </footer>
  )
}
