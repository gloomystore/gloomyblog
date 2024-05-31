
'use client'
import styles from '@/styles/module/NavBar.module.scss'
// import {useRouter} from 'next/router'
import { useEffect, useState, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { IsAdminAtom, LoadAtom, MyInfoAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import Link from 'next/link'

export default function NavBar() {
  // const router = useRouter()
  const [initialLoaded,setInitialLoaded] = useState(false)
  const [isSubmenu,setIsSubmenu] = useState(false)
  const [navActive,setNavActive] = useState(false)
  const [navDarker,setNavDarker] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const handleSubmenu = useCallback(() => {
    setIsSubmenu(!isSubmenu)
  }, [isSubmenu])

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY === 0) {
      // 스크롤이 최상단에 있는 경우
      setNavDarker(true);
    } else if (currentScrollY > lastScrollY) {
      // 스크롤이 아래로 내려가는 경우
      setNavDarker(false);
    } else {
      // 스크롤이 위로 올라가는 경우
      setNavDarker(true);
    }
    setIsSubmenu(false)
    setLastScrollY(currentScrollY);
  }, [lastScrollY, isSubmenu])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);
  function handleNav(){
    setNavActive(!navActive)
  }

  const [myInfo, setMyInfo] = useRecoilState(MyInfoAtom)
  const [isAdmin, setIsAdmin] = useRecoilState(IsAdminAtom)
  // isAdmin, myOnfo를 hydration 없이 csr로 적용
  const [isLogin, setIsLogin] = useState(false)
  const [stateIsAdmin, setStatesAdmin] = useState(false)
  useEffect(() => {
    setStatesAdmin(isAdmin)
  }, [isAdmin])
  useEffect(() => {
    setIsLogin(!!myInfo)
  }, [myInfo])

  /** redux */
  const [scrollBlock, setScrollBlock] = useRecoilState(ScrollBlockAtom);
  const [load, setLoad] = useRecoilState(LoadAtom);
  const [scrollStyle,setScrollStyle] = useState(` `)

  useEffect(() => {
    if(!initialLoaded) return
    setScrollBlock(navActive)
    if(!navActive) setIsSubmenu(navActive)
  }, [navActive, initialLoaded])

  useEffect(() => {
    console.log('scrollBlock', scrollBlock)
    // if(!load) return
    if(scrollBlock){
      setScrollStyle(`
      html {
        overflow-y: hidden;
        background: url('/images/bg/galaxy.webp');
      }
      `)
    } else {
      setScrollStyle(``)
    }
  }, [scrollBlock])
  /** //redux */

  useEffect(() => {
    setInitialLoaded(true)
  }, [])

  const logout = useCallback(() => {
    setIsAdmin(null)
    setMyInfo(null)
  }, [myInfo, isAdmin])

  return (
    
      initialLoaded && (
        <>
          <nav className={`${styles['nav']}
          ${navActive && styles['active']}
          ${navDarker && styles['darker']}
          `}>
            <h2 className={`${styles['nav-logo']}`}>
              <Link href='/' title='홈페이지로 이동' className={`${styles['navv']} img-box`}>
                {/* <Image src={require('/public/images/logo2.png')} alt='logo' className='onlyPC' />
                <Image src={require('/public/images/logo3.png')} alt='logo' className='onlySP' /> */}
                <img src='/images/logo2.png' alt='logo' className='onlyPC' />
                <img src='/images/logo3.png' alt='logo' className='onlySP' />
              </Link>
            </h2>
            <ul className={`${styles['nav-list']} onlyPC`}>
              <li>
                <Link href='/board/52/page/1#title'>개발일지</Link>
              </li>
              <li>
                <Link href='/board/214/page/1#title'>일상</Link>
              </li>
              <li>
                <Link href='https://www.gloomy-store.com' target='_blnk'>Portfolio</Link>
              </li>
              <li>
                <Link href=':'>I like it</Link>
              </li>
              {
                !isLogin && <li className={styles['join']}>
                <div>
                  <Link href='/login'>로그인</Link>
                  <Link href='/join'>회원가입</Link>
                </div>
              </li>
              }
              {
                isLogin && <li className={`${styles['login']} ${isSubmenu && styles['opened']}`}>
                <button className={styles['profile']} onClick={handleSubmenu}>
                  <img src='/images/members/uptownboy7/profile.jpg' alt='profile' />
                </button>
                <div className={styles['submenu']}>
                  <Link href=':'>회원정보 변경</Link>
                  <Link href=':'>쪽지함</Link>
                  <button onClick={logout}>로그아웃</button>
                  {
                    stateIsAdmin && <Link href=':'>글쓰기</Link>
                  }
                </div>
              </li>
              }
            </ul>
            <div className={`${styles['nav-inner']} onlySP`}>
              <button className={navActive ? `${styles['nav-hamburger']} ${styles['active']} onlySP` : `${styles['nav-hamburger']} onlySP`} onClick={handleNav} title='메뉴 열기/닫기'>
                <span></span>
                <span></span>
                <span></span>
              </button>
              <article className={navActive ? `${styles['nav-menu']} ${styles['active']}` : `${styles['nav-menu']}`}>
                <ul className={`${styles['nav-list-mobile']}`}>
                  <li>
                    <Link href='/board/52/page/1#title'>개발일지</Link>
                  </li>
                  <li>
                    <Link href='/board/214/page/1#title'>일상</Link>
                  </li>
                  <li>
                    <Link href='https://www.gloomy-store.com'>Portfolio</Link>
                  </li>
                  <li>
                    <Link href=':'>I like it</Link>
                  </li>
                  {
                    !isLogin && <li className={styles['join']}>
                    <div>
                      <Link href='/login'>로그인</Link>
                      <Link href='/join'>회원가입</Link>
                    </div>
                  </li>
                  }
                  {
                    isLogin && <li className={`${styles['login']} ${isSubmenu && styles['opened']}`}>
                    <button className={styles['profile']} onClick={handleSubmenu}>
                      <img src='/images/members/uptownboy7/profile.jpg' alt='profile' />
                    </button>
                    <div className={styles['submenu']}>
                      <Link href=':'>회원정보 변경</Link>
                      <Link href=':'>쪽지함</Link>
                      {
                        stateIsAdmin && <Link href=':'>글쓰기</Link>
                      }
                    </div>
                  </li>
                  }
                </ul>
              </article>
            </div>
          </nav>
          {
            scrollBlock &&
            <style>
              {scrollStyle}
            </style>
          }
          
        </>
      )
    
  )
}
