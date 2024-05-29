'use client'
import { RecoilRoot, atom } from 'recoil'

export const LoadAtom = atom({
  key: 'load',
  default: false
})

export const ScrollBlockAtom = atom({
  key: 'scrollBlock',
  default: false
})

export default function RecoidContextProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>
}