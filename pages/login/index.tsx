import { useRef, useState } from 'react'
import styles from '@/styles/module/Login.module.scss'
import { useRouter } from 'next/router';
import { encryptParam } from '@/utils/common';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { IsAdminAtom, MyInfoAtom } from '@/store/CommonAtom';

export default function Login () {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null);
  const [isAdmin, setIsAdmin] = useRecoilState(IsAdminAtom)
  const [myInfo, setMyInfo] = useRecoilState(MyInfoAtom)

  const [publicKey] = useState(`-----BEGIN PUBLIC KEY-----
  MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCDAKfF0ZtKtjlNDFaJjBRxE5Pp
  qr3MXsRBI+kyeiapZkJB7RWR9uQ3/STD3X24muSsA4bpVABKm03vNtAGYSvsY9FY
  VyeaJsf0mv6oKXMP/jdkooVRsQDAwPMAtIbiA7qukBJ24xxJ0fxOcJxSC0pH++y7
  tG2Xec9HxQVCEMwy4wIDAQAB
  -----END PUBLIC KEY-----`)

  const logingogo = async(event?: React.KeyboardEvent | React.MouseEvent) => {
    try {
      event?.preventDefault();
      if (!formRef.current) return;

      const idInput = formRef.current.login_mem_id;
      const passInput = formRef.current.login_mem_pass;

      if (!idInput.value) {
        alert('아이디를 입력해 주세요.');
        idInput.focus();
        return;
      } else if (!passInput.value) {
        alert('비밀번호를 입력해 주세요.');
        passInput.focus();
        return;
      }
      const data = {
        id: idInput.value,
        pw: passInput.value,
      }
      const param = {
        encryptedInfo: encryptParam(data, publicKey)
      }
      const res = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/login', param)
      if(res?.data?.jwt) {
        localStorage.setItem('accessToken', res?.data?.jwt)
        localStorage.setItem('isAdmin', res?.data?.isAdmin)
        console.log(res?.data?.jwt)
        console.log(atob(res?.data?.isAdmin))
        setMyInfo(res?.data?.jwt)
        setIsAdmin(res?.data?.isAdmin === 'true')
        router.push('/')
      }
    } catch(err:any) {
      console.log(err)
      if(err?.response?.data?.message) {
        alert(err?.response?.data?.message)
      }
    }
  };

  return (
    <main className={styles['login-main']}>
      <div className={styles['black']}></div>
      <h1 className='invisible'>로그인</h1>
      <div className={styles['center']}>
        <div className={styles['close_btn']}>
          <button title='다시 돌아가기' onClick={() => router.back()}>X</button>
        </div>
        <h2 className={styles['title']}>Login</h2>

        <form name='login_form' ref={formRef}>
          <p>
            <label htmlFor='id'>아이디</label>
            <input
              type='text'
              id='id'
              placeholder='아이디를 입력해 주세요.'
              name='login_mem_id'
              onKeyDown={(event) => event.key === 'Enter' && logingogo(event)}
            />
          </p>
          <p>
            <label htmlFor='password'>비밀번호</label>
            <input
              type='password'
              id='password'
              placeholder='비밀번호 입력해 주세요.'
              name='login_mem_pass'
              onKeyDown={(event) => event.key === 'Enter' && logingogo(event)}
            />
          </p>
          <div className={styles['login_btns']}>
            <button type='button' id='login_submit' onClick={logingogo}>
              로그인
            </button>
            <button type='button' id='go_join' onClick={() => router.push('/join')}>
              회원가입
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};