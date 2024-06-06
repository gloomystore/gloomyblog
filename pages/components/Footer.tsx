import styles from '@/styles/module/Footer.module.scss'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Visitor, Visitor2 } from '@/type/index';
import { getDates } from '@/utils/common';
import axios from 'axios';
import API from '@/api/index'
import { useRouter } from 'next/router';

export default function Footer({statistics}:any) {
  const [isLoadIp, setIsLoadIp] = useState(false)
  const [ipaddr, setIpaddr] = useState(0)
  const [todayHit, setTodayHit] = useState(0)
  const [totalHit, setTotalHit] = useState(0)
  const [todayDate, yesterdayDate,fullDateTime] = getDates();
  useEffect(() => {
    const getIp = async() => {
      try {
        const res = await axios.get('https://blog.gloomy-store.com/getIp.php')
        if(res.status === 200) {
          setIpaddr(res.data)
        } else {
          throw new Error('getting ip is blocked')
        }
        setIsLoadIp(true)
      } catch(err) {
        console.log(err)
      }
    }
    getIp()
  }, [])
  useEffect(() => {
    if(!isLoadIp) return
    const updateVisitor = async() => {
      try {
        const data = {
          DATETIME:fullDateTime,
          DATE:todayDate,
          YESTERDAY:yesterdayDate,
          IPADDRESS: ipaddr,
        }
        console.log(data)
        const res = await axios.post<(Visitor | Visitor2)[]>(`/api/updateVisitor`,data)
        // console.log(res.data)
        const [todayObj, totalObj] = res.data;
        if ("TODAY" in todayObj) {
          const todayData = todayObj as Visitor;
          setTodayHit(todayData.TODAY);
        }
        if ("TOTAL" in totalObj) {
          const totalData = totalObj as Visitor2;
          setTotalHit(totalData.TOTAL);
        }
      } catch(err) {
        console.log(err)
      }
    }
    updateVisitor()
  }, [isLoadIp])

  const router = useRouter()
  const [isMain, setIsMain] = useState(router.pathname === '/')
  useEffect(() => {
    setIsMain(router.pathname === '/')
  }, [router.pathname])

  return (
    <footer className={`${styles["footer"]} ${isMain && 'mt-0'}`} id="contact">
    <div className={`${styles["footer-inner"]}`}>
      <article className={`${styles["footer-logo"]}`}>
        <Link className="img-box" href="/">
            <img src={'/images/logo2.png'} alt='logo' className='onlyPC' width={242} height={33} />
            <img src={'/images/logo3.png'} alt='logo' className='onlySP' width={70} height={63} />
        </Link>
      </article>
      <article className={`${styles["footer-desc"]}`}>
        <h5>글루미스토어 <em><span>today: {todayHit}</span><span>total: {totalHit}</span></em></h5>
        <p><a href="tel:01043431354">TEL : 010-4343-1354</a></p>
        <p><a href="mailto:serenity90s@naver.com">EMAIL : serenity90s@naver.com</a></p>
        <p>COPYRIGHT © 2019 YOUNG e Design CO., LTD. All Rights Reserved. Designed by YOUNG e Design</p>
      </article>
    </div>
  </footer>
  )
}