
'use client'
import styles from '@/styles/module/NavBar.module.scss'
// import {useRouter} from 'next/router'
import { useEffect, useState, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { IsAdminAtom, LoadAtom, MyInfoAtom, ProfileModalActiveAtom, ProfileModalAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import Link from 'next/link'
import Image from 'next/image';

export default function ProfileModal() {

  /** redux */
  const [scrollBlock, setScrollBlock] = useRecoilState(ScrollBlockAtom);

  const [profileModal] = useRecoilState(ProfileModalAtom)
  const [profileModalActive, setProfileModalActive] = useRecoilState(ProfileModalActiveAtom)
  const [isAdmin] = useRecoilState(IsAdminAtom)
  const [stateIsAdmin, setStatesAdmin] = useState(false)

  // isAdmin을 hydration 없이 csr로 적용
  useEffect(() => {
    setStatesAdmin(isAdmin)
  }, [isAdmin])

  // 모달이 뜰때마다 스크롤을 막음
  useEffect(() => {
    if(profileModalActive) setScrollBlock(true)
    else setScrollBlock(false)
  }, [profileModalActive])

  return (
    <article className={profileModalActive ? 'modal active' : 'modal'}>
      <div className='modal-dimmed' onClick={() => setProfileModalActive(false)}></div>
      <div className='modal-content modal-profile'>
        <div className='photo-zone'>
          <button>
            <ProfileImage user_id={profileModal?.BOR_mem_id} alt={profileModal.BOR_mem_name} />
          </button>
        </div>
        <div className='script-zone'>
          <h4>이름: <span>{stateIsAdmin ? <b>운영자</b> : <b></b>}{profileModal.BOR_mem_name}</span></h4>
          <p>메일: {profileModal.BOR_mem_email}</p>
          <p>가입일: {profileModal.BOR_mem_regi_day}</p>
          <div className='modal-button'>
            <button onClick={() => setProfileModalActive(false)}>&#x00d7;</button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProfileImage ({ 
  user_id, 
  alt, 
  size = {
    width: 210,
    height: 210
  } , 
  className }: {user_id:string, alt:string, size?: { width: number, height: number} , className?:string}) {

  const [imgSrc, setImgSrc] = useState(user_id ? `/images/file/members/${user_id}/profile.webp` : `/images/file/members/default-user.webp`);
  const [noHover, setNoHover] = useState(false)
  useEffect(() => {
    if(user_id) {
      setNoHover(false)
      setImgSrc(`/images/file/members/${user_id}/profile.webp`)
    }
    else {
      setNoHover(true)
      setImgSrc(`/images/file/members/default-user.webp`)
    }
  }, [user_id])

  const onError = useCallback(() => {
    setNoHover(true)
    setImgSrc('/images/file/members/default-user.webp')
  }, [user_id])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={`${className && className} ${noHover && 'no-hover'}`}
      onError={() => onError()}
      width={size.width}
      height={size.height}
      fetchPriority={'low'}
    />
  );
};