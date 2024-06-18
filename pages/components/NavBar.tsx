
'use client'
import styles from '@/styles/module/NavBar.module.scss'
// import {useRouter} from 'next/router'
import { useEffect, useState, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { LoadAtom, MyInfoAtom, MyTokenAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import Link from 'next/link'
import { useRouter } from 'next/router';
import Cookie from 'js-cookie'
import Image from 'next/image';

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
  const [myToken, setMyToken] = useRecoilState(MyTokenAtom)

  // isAdmin, myOnfo를 hydration 없이 csr로 적용
  const [isLogin, setIsLogin] = useState(false)
  const [isAdmin, setAdmin] = useState(false)
  useEffect(() => {
    if(myInfo) {
      setAdmin(myInfo.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID)
    }
  }, [myInfo])
  useEffect(() => {
    setIsLogin(!!myToken)
  }, [myToken])

  /** redux */
  const [scrollBlock, setScrollBlock] = useRecoilState(ScrollBlockAtom);
  // const [load, setLoad] = useRecoilState(LoadAtom);
  const [scrollStyle,setScrollStyle] = useState(` `)

  // 페이지가 변경되면 모바일 nav메뉴가 닫힘
  const router = useRouter()
  useEffect(() => {
    setNavActive(false)
    setScrollStyle(``)
  }, [router.asPath])
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
    Cookie.remove('myInfo')
    Cookie.remove('accessToken')
    setMyInfo(null)
    setMyToken(null)

    // nav 닫기
    setNavActive(false)
    router.reload()
  }, [myInfo, isAdmin])

  return (
    
      initialLoaded ? (
        <>
          <nav className={`${styles['nav']}
          ${navActive && styles['active']}
          ${navDarker && styles['darker']}
          `}>
            <h2 className={`${styles['nav-logo']}`}>
              <Link href='/' title='홈페이지로 이동' className={` img-box`}>
                {/* <Image src={require('/public/images/logo2.webp')} alt='logo' className='onlyPC' />
                <Image src={require('/public/images/logo3.webp')} alt='logo' className='onlySP' /> */}
                <Image 
                  src='/images/logo2.webp' 
                  alt='logo' 
                  className='onlyPC' 
                  width={200}
                  height={33}
                />
                <Image 
                  src='/images/logo3.webp' 
                  alt='logo' 
                  className='onlySP' 
                  width={40}
                  height={36}
                />
              </Link>
            </h2>
            <ul className={`${styles['nav-list']} onlyPC`}>
              <li>
                <Link href='/profile' title='프로필'>Profile</Link>
              </li>
              <li>
                <Link href='/board/52/page/1#title' title='개발일지'>개발일지</Link>
              </li>
              <li>
                <Link href='/board/214/page/1#title' title='일상'>일상</Link>
              </li>
              {/* <li>
                <Link href='https://www.gloomy-store.com' target='_blank' rel='noreferrer noopener'>Portfolio</Link>
              </li> */}
              <li>
                <Link href='/comment/1' title='방명록'>방명록</Link>
              </li>
              {
                !isLogin && <li className={styles['join']}>
                <div>
                  <Link href='/login' title='로그인'>로그인</Link>
                  <Link href='/join'title='회원가입'>회원가입</Link>
                </div>
              </li>
              }
              {
                isLogin && <li className={`${styles['login']} ${isSubmenu && styles['opened']}`}>
                <button className={styles['profile']} onClick={handleSubmenu}>
                <Image 
                  src={`/images/file/members/${myInfo?.split('|')[1]}/profile.webp`} 
                  alt='profile' 
                  width={36}
                  height={36}
                />
                </button>
                <div className={styles['submenu']}>
                  <Link href='#!' title='회원정보 변경'>회원정보 변경</Link>
                  <Link href='#!'title='쪽지함'>쪽지함</Link>
                  <button onClick={logout}title='로그아웃'>로그아웃</button>
                  {
                    isAdmin && <Link href='/write'>글쓰기</Link>
                  }
                </div>
              </li>
              }
            </ul>
            <div className={`${styles['nav-inner']} onlySP`}>
              <button className={navActive ? `${styles['nav-hamburger']} ${styles['active']} onlySP` : `${styles['nav-hamburger']} onlySP`} onClick={handleNav} title={navActive ? '메뉴 닫기' : '메뉴 열기'}>
                <span></span>
                <span></span>
                <span></span>
              </button>
              <article className={navActive ? `${styles['nav-menu']} ${styles['active']}` : `${styles['nav-menu']}`}>
                <ul className={`${styles['nav-list-mobile']}`}>
                  <li>
                    <Link href='/profile' title='프로필'>Profile</Link>
                  </li>
                  <li>
                    <Link href='/board/52/page/1#title' title='개발일지'>개발일지</Link>
                  </li>
                  <li>
                    <Link href='/board/214/page/1#title' title='일상'>일상</Link>
                  </li>
                  {/* <li>
                    <Link href='https://www.gloomy-store.com' target='_blank' rel='noopener' title=''>Portfolio</Link>
                  </li> */}
                  <li>
                    <Link href='/comment/1' title='방명록'>방명록</Link>
                  </li>
                  {
                    !isLogin && <li className={styles['join']}>
                    <div>
                      <Link href='/login' title='로그인'>로그인</Link>
                      <Link href='/join' title='회원가입'>회원가입</Link>
                    </div>
                  </li>
                  }
                  {
                    isLogin && <li className={`${styles['login']} ${isSubmenu && styles['opened']}`}>
                    <button className={styles['profile']} onClick={handleSubmenu}>
                      <Image 
                        src={`/images/file/members/${myInfo?.split('|')[1]}/profile.webp`} 
                        alt='profile' 
                        width={36}
                        height={36}
                      />
                    </button>
                    <div className={styles['submenu']}>
                      <Link href='#!' title='회원정보 변경'>회원정보 변경</Link>
                      <Link href='#!' title='쪽지함'>쪽지함</Link>
                      <button onClick={logout} title='로그아웃'>로그아웃</button>
                      {
                        isAdmin && <Link href='/write'>글쓰기</Link>
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
      :
      <></>
    
  )
}
