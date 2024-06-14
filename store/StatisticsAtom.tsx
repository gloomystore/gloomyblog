'use client'
import { RecoilRoot, atom } from 'recoil'

export const TodayHitAtom = atom({
  key: 'TodayHitAtom',
  default: 0
})

export const TotalHitAtom = atom({
  key: 'TotalHitAtom',
  default: 0
})

export default function RecoidContextProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>
}