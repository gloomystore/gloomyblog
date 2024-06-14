import { useState } from 'react';
import styles from '@/styles/module/Login.module.scss';
import { useRouter } from 'next/router';
import { encryptParam } from '@/utils/common';
import axios from 'axios';
import { headers } from 'next/headers';
import Image from 'next/image';

export default function Join() {
  const router = useRouter();
  const [inputName, setInputName] = useState('');
  const [inputId, setInputId] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputPasswordCheck, setInputPasswordCheck] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [publicKey] = useState(`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCDAKfF0ZtKtjlNDFaJjBRxE5Pp
qr3MXsRBI+kyeiapZkJB7RWR9uQ3/STD3X24muSsA4bpVABKm03vNtAGYSvsY9FY
VyeaJsf0mv6oKXMP/jdkooVRsQDAwPMAtIbiA7qukBJ24xxJ0fxOcJxSC0pH++y7
tG2Xec9HxQVCEMwy4wIDAQAB
-----END PUBLIC KEY-----`);

  const handleSubmit = async () => {
    if (!inputId) {
      alert('아이디를 입력해 주세요.');
      return;
    } else if (!inputName) {
      alert('이름을 입력해 주세요.');
      return;
    } else if (!inputEmail) {
      alert('이메일을 입력해 주세요.');
      return;
    } else if (!inputPassword) {
      alert('비밀번호를 입력해 주세요.');
      return;
    } else if (!inputPasswordCheck) {
      alert('비밀번호 확인을 입력해 주세요.');
      return;
    } else if (!file) {
      alert('프로필 사진을 업로드해 주세요.');
      return;
    }

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !validExtensions.includes(fileExtension) || file.size > 5 * 1024 * 1024) {
      alert('파일 형식이 jpg, png, webp 중 하나여야 하며, 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      let ip = 'unknown'
      const ipRes = await axios.get('https://blog.gloomy-store.com/getIp.php');
      if (ipRes.status === 200) {
        ip = ipRes.data
      }

      const data = {
        id: inputId,
        pw: inputPassword,
      };
      const encryptedInfo = encryptParam(data, publicKey);
      console.log(encryptedInfo)
      const formdata = new FormData();
      formdata.set('encryptedInfo', encryptedInfo);
      formdata.set('BOR_mem_name', inputName);
      formdata.set('BOR_mem_email', inputEmail);
      formdata.set('BOR_mem_pf', fileExtension);
      formdata.set('mem_profile', file);
      formdata.set('ipaddress', ip);
      console.log(formdata.get('encryptedInfo'))
      const res = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/join', formdata, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(res.data);
      if(res.status === 200) {
        alert('회원 가입에 성공했습니다.')
        router.push('/')
      }
    } catch(err:any) {
      console.log(err)
      if(err?.response?.data?.message) {
        alert(err?.response?.data?.message)
      }
    }
  };

  const handleReset = () => {
    setInputId('');
    setInputName('');
    setInputEmail('');
    setInputPassword('');
    setInputPasswordCheck('');
    setFile(null);
  };

  return (
    <main className={styles['login-main']}>
      <div className={styles['black']}></div>
      <div className={`${styles['center']} ${styles['join']}`}>
        <div className={styles['close_btn']}>
          <button title='다시 돌아가기' onClick={() => router.back()}>X</button>
        </div>
        <h2 className={styles['title']}>Join Me</h2>
        <form name='join_form'>
          <p>
            <label htmlFor='id'>아이디</label>
            <input type='text' id='id' placeholder='아이디를 입력해 주세요.' value={inputId} onChange={(e) => setInputId(e.target.value)} />
          </p>
          <p>
            <label htmlFor='name'>이름</label>
            <input type='text' id='name' placeholder='이름을 입력해 주세요.' value={inputName} onChange={(e) => setInputName(e.target.value)} />
          </p>
          <p>
            <label htmlFor='mail'>이메일</label>
            <input type='text' id='mail' placeholder='이메일을 입력해 주세요.' value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} />
          </p>
          <p className={styles['info']}>
            <label htmlFor='password'>비밀번호</label>
            <input type='password' id='password' placeholder='비밀번호를 입력해 주세요.' value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} />
            <button type='button' onClick={() => alert('비밀번호는 hash화 되어 저도 알 수 없습니다!')} title='비밀번호는 hash화 되어 저도 알 수 없습니다!'>
              <Image 
                src='/images/icon/info.png' 
                alt='비밀번호는 hash화 되어 저도 알 수 없습니다!' 
                title='비밀번호는 hash화 되어 저도 알 수 없습니다!' 
                width={27}
                height={27}
              />
            </button>
          </p>
          <p>
            <label htmlFor='password_check' className={styles['password_check']}>비밀번호 확인</label>
            <input type='password' id='password_check' placeholder='비밀번호 확인을 입력해 주세요.' value={inputPasswordCheck} onChange={(e) => setInputPasswordCheck(e.target.value)} />
          </p>
          <p>
            <label htmlFor='profile'>프로필</label>
            <input type='file' id='profile' onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label htmlFor='profile' className={styles['file_directory']}>업로드</label>
          </p>
          <div className={styles['login_btns']}>
            <button id='submitee' type='button' onClick={handleSubmit}>제출</button>
            <button id='reset' type='button' onClick={handleReset}>리셋</button>
          </div>
        </form>
      </div>
    </main>
  );
}