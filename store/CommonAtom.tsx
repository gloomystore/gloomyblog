'use client'
import { RecoilRoot, atom } from 'recoil'

export const LoadAtom = atom({
  key: 'LoadAtom',
  default: false
})

export const ScrollBlockAtom = atom({
  key: 'ScrollBlockAtom',
  default: false
})

export const IsAdminAtom = atom({
  key: 'IsAdminAtom',
  default: false
})

export const MyInfoAtom = atom({
  key: 'MyInfoAtom',
  default: false
})

export default function RecoidContextProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>
}