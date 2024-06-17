import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import RecoidContextProvider, { LoadAtom, MyTokenAtom } from "@/store/CommonAtom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function App({ Component, pageProps }: AppProps) {
  return <RecoidContextProvider>
      <AuthChecker />
      <ProfileModal />
      <NavBar />
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
      <Footer />
    </RecoidContextProvider>
}

import { IsAdminAtom, MyInfoAtom } from "@/store/CommonAtom";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import ProfileModal from "./components/ProfileModal";
import Cookies from 'js-cookie'
import AppLayout from "./AppLayout";

const AuthChecker = () => {
  const router = useRouter()
  const [isHeaderInfoAttached, setIsHeaderInfoAttached] = useState(false)
  const [isAdmin, setIsAdmin] = useRecoilState(IsAdminAtom)
  const [myInfo, setMyInfo] = useRecoilState(MyInfoAtom)
  const [myToken, setMyToken] = useRecoilState(MyTokenAtom)
  const [load, setLoad] = useRecoilState(LoadAtom)
  useEffect(() => {
    try {
      if (Cookies.get('accessToken') && Cookies.get('myInfo')) {
        const infoString = Cookies.get('myInfo')
        const info = atob(atob((infoString as string)))
        setMyInfo(info)
        setMyToken(Cookies.get('accessToken'))
        Cookies.set('isPerson', 'true', { expires: 5 })
      } else {
        setMyInfo(null)
        setMyToken(null)
      }
    } catch (err) {
      setMyInfo(null)
      setMyToken(null)
    }
  }, [])
  const setClientHeaders = useCallback(() => {
    axios.interceptors.request.use((req) => {
      const token = Cookies?.get('accessToken')
      if (token) { req.headers.Authorization = token }
      return new Promise((resolve) => resolve(req))
    }, (error) => {
      return Promise.reject(error)
    })
    axios.interceptors.response.use((res) => {
      if (res.headers.authorization) {
        // if (!myInfo) return Promise.reject('error')
        // localStorage.setItem('accessToken', res.headers.authorization)
        // setMyInfo(res.headers.authorization)
      }
      return new Promise((resolve) => resolve(res))
    }, (error) => {
      if (error.__CANCEL__) return

      const response = error.response
      let message = response?.data?.message
      if (response?.status >= 500) {
        // 500번대
        message = '서버 확인 불가'
      } else {
        // 400번대
        if (response?.status === 404) {
          message = '페이지 확인 불가'
          // router.push('/not-found')
        } else if (response?.status === 405) {
          message = '유효한 로그인이 아닙니다'
          setIsAdmin(false)
          setMyInfo(null)
          localStorage.removeItem('isAdmin')
          localStorage.removeItem('myInfo')
          localStorage.removeItem('accessToken')
          router.push('/')
        }
      }
      return Promise.reject(error)
    })
  }, [isHeaderInfoAttached, isAdmin, myInfo])

  
  useEffect(() => {
    setClientHeaders()
    setLoad(true)
  }, []);

  return null;
};
