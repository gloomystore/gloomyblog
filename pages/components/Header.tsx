'use client'
import { useState, useCallback } from 'react'
import styles from '@/styles/module/Header.module.scss'
import Link from 'next/link'
import { useRecoilState } from 'recoil'
import { ProfileModalActiveAtom, ProfileModalAtom } from '@/store/ModalAtom'
import axios from 'axios'

export default function Header() {
  // modal
  // const [activeModal, setActiveModal] = useState(false)
  // const closeModal = useCallback(() => {
  //   setActiveModal(false)
  // }, [activeModal])

  const [profileModal, setProfileModal] = useRecoilState(ProfileModalAtom)
  const [profileModalActive, setProfileModalActive] = useRecoilState(ProfileModalActiveAtom)
  const profileView = useCallback(async(id:string) => {
    try {
      const data = {id}
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/common/getProfile`, data)
      if(res.status === 200) {
        setProfileModal(res.data)
        setProfileModalActive(true)
      }
    } catch(err) {
      console.log(err)
    }
  }, [profileModal, profileModalActive])



  
  
  return (
    <header className={styles['gl-header']}>
      <div className={styles['gl-imgbox']}>
        <Link href='/' className={styles['gl-imgbox-radius']}>
          <h2>Gloomy Store</h2>
        </Link>
      </div>
      <aside className={styles['gl-nav-side']}>
        <div className='d-flex justify-between'>
          <ul>
            <li className='active'>
              <Link
                href='/'
                title='home page'
              >
                <span className='t-purple'>H</span>ome
              </Link>
            </li>
            <li>
              <Link
                href='/profile'
                title='profile'
                className='blinkRed'
              >
                pr<span className='t-red'>o</span>file
              </Link>
            </li>
            <li className='active'>
              <Link
                href='/board/52/page/1'
                title='dev'
              >
                <span className='t-purple'>d</span>ev
              </Link>
            </li>
            <li>
              <Link
                href='/board/214/page/1'
                title='dayz'
              >
                d<span className='t-green'>a</span>yz
              </Link>
            </li>
            <li>
              <Link
                href='/comment/1'
                title='comment'
              >
                방명<span className='t-sky'>록</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
      <div className='profile'>
        <div className='profile-img'>
          <a
            href='#!'
            title='go to profile'
            onClick={(e) => profileView((process.env.NEXT_PUBLIC_ADMIN_ID as string))}
          >
            <img
              src='/images/admin.webp'
              alt='profile'
            />
          </a>
        </div>
        <div className='profile-script'>
          <h2>글루미스토어</h2>
          <p>프론트엔드 개발 블로그입니다. Nextjs 14로 개발되었습니다.</p>
        </div>
      </div>
    </header>
  )
}
