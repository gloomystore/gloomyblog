import HeadComponent from '@/components/HeadComponent';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function NotFound() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(5)
  const secondsRef = useRef<number>(seconds); // useRef로 최신 상태 유지
  useEffect(() => {
    secondsRef.current = seconds; // 상태가 변경될 때마다 useRef 업데이트
  }, [seconds]);
  useEffect(() => {
    let interval;
    interval = setInterval(() => {
      if(secondsRef.current > 0) {
        setSeconds(prev => --prev)
      } else {
        console.log('홈페이지로 이동합니다')
        router.push('/')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <HeadComponent
        title={'글루미스토어'}
        description={'not found - 원하시는 페이지를 찾지 못했습니다.'}
        keywords={'javascript, ES6, React, Vue, Nextjs, typescript, 투표'}
        robots={false}
      />
      <div className='wrap'>
        <header className='img-box header mb-10'>
          <div className='img-box--words' style={{margin: 'auto', width:'100%',maxWidth:600, padding:20, textAlign: 'center'}}>
            <Image src={require('/public/images/404.webp')} width='375' height='375' alt='profile' priority />
          </div>
        </header>
        <main className='mt-0'>
          <p style={{ textAlign: 'center' }}>
            { seconds } 초 이후에 홈페이지로 이동합니다.
          </p>
        </main>
      </div>
    </>
  )
}
