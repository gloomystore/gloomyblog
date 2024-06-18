import styles from '@/styles/module/Footer.module.scss'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Visitor, Visitor2 } from '@/type/index'
import { getDates } from '@/utils/common'
import axios from 'axios'
// import API from '@/api/index'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useRecoilState } from 'recoil'
import { TodayHitAtom, TotalHitAtom } from '@/store/StatisticsAtom'
import Cookies from 'js-cookie'

export default function Footer({statistics}:any) {
  const [isLoadIp, setIsLoadIp] = useState(false)
  const [ipaddr, setIpaddr] = useState('')
  const [todayHit, setTodayHit] = useRecoilState(TodayHitAtom)
  const [totalHit, setTotalHit] = useRecoilState(TotalHitAtom)
  const [todayDate, yesterdayDate, fullDateTime] = getDates()

  const getVisitor = async () => {
    try {
      const todayDateFromCookie = Cookies.get('today')
      const res = await axios.get(`/api/getVisitorHit?todayDate=${todayDateFromCookie}`)
      const data = res.data
      console.log('Today visitor data:', data)
      // 여기서 state 업데이트 로직을 추가할 수 있음
      const [todayObj, totalObj] = res.data
        if ('TODAY' in todayObj) {
          const todayData = todayObj as Visitor
          setTodayHit(todayData.TODAY)
        }
        if ('TOTAL' in totalObj) {
          const totalData = totalObj as Visitor2
          setTotalHit(totalData.TOTAL)
        }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    // 쿠키에 today 값이 이미 존재하는지 확인
    const todayCookie = Cookies.get('today')

    if (todayCookie) {
      // 이미 쿠키가 있으면 updateVisitor 함수 실행하지 않음
      console.log('Today cookie exists:', todayCookie)
      getVisitor()
      return
    }

    const getIp = async () => {
      try {
        const res = await axios.get('https://blog.gloomy-store.com/getIp.php')
        if (res.status === 200) {
          setIpaddr(res.data)
        } else {
          throw new Error('Getting IP is blocked')
        }
        setIsLoadIp(true)
      } catch (err) {
        console.log(err)
      }
    }

    getIp()
  }, [])

  useEffect(() => {
    if (!isLoadIp) return

    const updateVisitor = async () => {
      try {
        const data = {
          DATETIME: fullDateTime,
          DATE: todayDate,
          YESTERDAY: yesterdayDate,
          IPADDRESS: ipaddr,
        }
        console.log(data)
        const res = await axios.post<(Visitor | Visitor2)[]>(`/api/updateVisitor`, data)
        // console.log(res.data)
        const [todayObj, totalObj] = res.data
        if ('TODAY' in todayObj) {
          const todayData = todayObj as Visitor
          setTodayHit(todayData.TODAY)
        }
        if ('TOTAL' in totalObj) {
          const totalData = totalObj as Visitor2
          setTotalHit(totalData.TOTAL)
        }

        // 쿠키에 today 값을 저장 (만료 기간은 하루로 설정)
        Cookies.set('today', todayDate, { expires: 1 })
      } catch (err) {
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
    <footer className={`${styles['footer']} ${isMain && 'mt-0'}`} id='contact'>
      <div className={`${styles['footer-inner']}`}>
        <article className={`${styles['footer-logo']}`}>
          <Link className='img-box' href='/'>
              <Image src={'/images/logo2.png'} alt='logo' className='onlyPC' width={160} height={22} />
              <Image src={'/images/logo3.png'} alt='logo' className='onlySP' width={55} height={49} />
          </Link>
        </article>
        <article className={`${styles['footer-desc']}`}>
          <h2>글루미스토어 <em><span>today: {todayHit}</span><span>total: {totalHit}</span></em></h2>
          <p><a href='tel:01043431354'>TEL : 010-4343-1354</a></p>
          <p><a href='mailto:serenity90s@naver.com'>EMAIL : serenity90s@naver.com</a></p>
          <p>COPYRIGHT © 2019 YOUNG e Design CO., LTD. All Rights Reserved. Designed by YOUNG e Design</p>
        </article>
      </div>
    </footer>
  )
}