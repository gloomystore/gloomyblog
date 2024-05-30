'use client'
import { useState, useCallback } from 'react'
import styles from '@/styles/module/Header.module.scss'

export default function Header() {
  // modal
  const [activeModal, setActiveModal] = useState(false)
  const closeModal = useCallback(() => {
    setActiveModal(false)
  }, [activeModal])
  const [profileId, setProfileId] = useState(0)
  const profileView = useCallback((id:string) => {

  }, [profileId])
  return (
    <header className={styles['gl-header']}>
      <div className={styles['gl-imgbox']}>
        <a href='/' className={styles['gl-imgbox-radius']}>
          <h2>Gloomy Store</h2>
        </a>
      </div>
      <aside className={styles['gl-nav-side']}>
        <div className='d-flex justify-between'>
          <ul>
            <li>
              <a
                href='#!'
                title='profile'
                className='blinkRed'
                onClick={() => alert('준비중입니다.')}
              >
                pr<span className='t-red'>o</span>file
              </a>
            </li>
            <li className='active'>
              <a
                href='/board/index.php?module_srl=module_srl&view_all=1'
                title='blog'
              >
                <span className='t-purple'>b</span>log
              </a>
            </li>
            <li>
              <a
                href='/board/index.php?module_srl=52&view_all=0'
                title='dev'
              >
                de<span className='t-green'>v</span>
              </a>
            </li>
            <li>
              <a
                href='/board/index.php?module_srl=216&view_all=0'
                title='dayz'
              >
                d<span className='t-sky'>a</span>yz
              </a>
            </li>
          </ul>
        </div>
      </aside>
      <div className='profile'>
        <div className='profile-img'>
          <a
            href='#!'
            title='go to profile'
            onClick={(e) => profileView('uptownboy7')}
          >
            <img
              src='/images/members/uptownboy7/profile.jpg'
              alt='profile'
            />
          </a>
        </div>
        <div className='profile-script'>
          <h2>글루미스토어</h2>
          <p>프론트엔드 개발 블로그입니다. php로 개발되었습니다.</p>
        </div>
      </div>
    </header>
  )
}
