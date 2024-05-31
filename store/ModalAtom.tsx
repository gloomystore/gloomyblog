'use client'
import { RecoilRoot, atom } from 'recoil'

export const ProfileModalAtom = atom({
  key: 'ProfileModalAtom',
  default: {
    BOR_mem_idx: '',
    BOR_mem_id: '',
    BOR_mem_name: '',
    BOR_mem_email: '',
    BOR_mem_regi_day: ''
  }
})

export const ProfileModalActiveAtom = atom({
  key: 'ProfileModalActiveAtom',
  default: false
})

export default function RecoidContextProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>
}