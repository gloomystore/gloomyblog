import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import RecoidContextProvider from "@/store/CommonAtom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function App({ Component, pageProps }: AppProps) {
  return <RecoidContextProvider>
      <AuthChecker />
      <NavBar />
        <Component {...pageProps} />
      <Footer />
    </RecoidContextProvider>
}

import { IsAdminAtom, MyInfoAtom } from "@/store/CommonAtom";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";


const AuthChecker = () => {
  const router = useRouter()
  const [isHeaderInfoAttached, setIsHeaderInfoAttached] = useState(false)
  const [isAdmin, setIsAdmin] = useRecoilState(IsAdminAtom)
  const [myInfo, setMyInfo] = useRecoilState(MyInfoAtom)
  const setClientHeaders = useCallback(() => {
    axios.interceptors.request.use((req) => {
      const token = localStorage?.getItem('Authorization')
      if (token) { req.headers.Authorization = token }
      return new Promise((resolve) => resolve(req))
    }, (error) => {
      return Promise.reject(error)
    })
    axios.interceptors.response.use((res) => {
      if (res.headers.authorization) {
        if (!myInfo) return Promise.reject('error')
        localStorage.setItem('Authorization', res.headers.authorization)
        setMyInfo(res.headers.authorization)
      }
      return new Promise((resolve) => resolve(res))
    }, (error) => {
      if (error.__CANCEL__) return

      const response = error.response
      let message = response?.data?.message
      if (response?.status >= 500) {
        // 500번대
        message = '로그인 확인 불가'
      } else {
        // 400번대
        if (response?.status === 404) {
          message = '로그인 확인 불가'
          router.push('/not-found')
        } else if (response?.status === 405) {
          message = '유효한 로그인이 아닙니다'
          router.push('/')
        }
      }
      return Promise.reject(error)
    })
  }, [isHeaderInfoAttached, isAdmin, myInfo])

  
  useEffect(() => {
    const res = setClientHeaders()
    console.log(res)
  }, []);

  return null;
};