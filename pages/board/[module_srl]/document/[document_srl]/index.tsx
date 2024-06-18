
// style
import styles from '@/styles/module/Board.module.scss'

// module
import HeadComponent from '@/pages/components/HeadComponent'

import Header from '@/pages/components/Header'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { ParsedUrlQuery } from 'querystring'
import pool from '@/pages/api/db/mysql'
import { RowDataPacket } from 'mysql2'
import { removeTags } from '@/utils/common'
import Link from 'next/link'
import nextCookies from 'next-cookies'
// import jwt from 'jsonwebtoken'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRecoilState } from 'recoil'
import axios from 'axios'
import moment from 'moment'
import { LoadAtom, MyInfoAtom, ProfileModalActiveAtom, ProfileModalAtom } from '@/store/CommonAtom'
import MiniProfileImage from '@/components/MiniProfile'
import Image from 'next/image'
import { useRouter } from 'next/router'

type Props = {
  props : any
}


export const getServerSideProps: GetServerSideProps<Props> = async (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  try {
    const document_srl = parseInt(ctx?.params?.document_srl as string)
    const module_srl = parseInt(ctx?.params?.module_srl as string)

    const cookies = nextCookies(ctx)
    const token = cookies.accessToken
    let isAdmin = false
    let myInfo = null
    if (token) {
      try {
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET ?? ''
        // const decoded = jwt.verify(token, secret)
        const cookieMyInfo = cookies.myInfo ?? null
        myInfo = cookieMyInfo ? atob(atob(cookieMyInfo)) : null // 디코딩된 사용자 정보
        isAdmin = myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID
      } catch (error) {
        console.error('JWT 검증 실패:', error)
      }
    }

    // 현재 글 가져오기
    const [documentRows] = await pool.query<RowDataPacket[]>(`
      SELECT blamed_count,
        category_srl,
        module_srl,
        comment_count,
        comment_status,
        content,
        document_srl,
        email_address,
        last_update,
        member_srl,
        readed_count,
        regdate,
        status,
        tags,
        thumb,
        title,
        uploaded_count,
        user_id,
        user_name,
        voted_count
      FROM xe_documents
      WHERE document_srl = ?
    `, [document_srl])

    if (documentRows.length === 0) {
      return {
        notFound: true,
      }
    }

    const row:any = documentRows.map(e => ({
      ...e,
      summary: removeTags(e.content).slice(0, 100),
      tags: JSON.parse(e.tags)
    }))[0] // 현재 글의 첫 번째(유일한) 행 가져오기

    const commentsPageSize = 30
    const page = 1
    const offset = (page - 1) * commentsPageSize

    // comments를 가져옵니다.
    // 전체 댓글 수를 가져오는 쿼리
    const [totalCommentsResult] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS totalComments
      FROM xe_comments
      WHERE document_srl = ${document_srl} AND status <> -1
    `)

    // comments의 페이지 수를 계산합니다.
    const totalCommentsPages = Math.ceil(totalCommentsResult?.[0]?.totalComments/commentsPageSize)

    // const commentOffset = (totalCommentsPages - 1) * commentsPageSize

    // comments를 가져옵니다.
    // 댓글을 가져오는 쿼리
    const [commentsRows] = await pool.query<RowDataPacket[]>(`
      WITH RECURSIVE CommentTree AS (
        -- 최상위 댓글을 가져옵니다.
        SELECT
          comment_srl,
          module_srl,
          document_srl,
          parent_srl,
          is_secret,
          content,
          voted_count,
          blamed_count,
          notify_message,
          password,
          user_id,
          user_name,
          member_srl,
          email_address,
          homepage,
          uploaded_count,
          regdate,
          last_update,
          ipaddress,
          list_order,
          status,
          0 AS depth, -- depth 0은 최상위 댓글
          comment_srl AS top_comment_srl -- 최상위 댓글의 comment_srl
        FROM xe_comments
        WHERE document_srl = ${document_srl} AND parent_srl = 0 AND status <> -1
        
        UNION ALL
        
        -- 답글들을 가져옵니다.
        SELECT
          c.comment_srl,
          c.module_srl,
          c.document_srl,
          c.parent_srl,
          c.is_secret,
          c.content,
          c.voted_count,
          c.blamed_count,
          c.notify_message,
          c.password,
          c.user_id,
          c.user_name,
          c.member_srl,
          c.email_address,
          c.homepage,
          c.uploaded_count,
          c.regdate,
          c.last_update,
          c.ipaddress,
          c.list_order,
          c.status,
          ct.depth + 1 AS depth, -- depth는 부모의 depth + 1
          ct.top_comment_srl -- 최상위 댓글의 comment_srl을 유지합니다.
        FROM xe_comments c
        INNER JOIN CommentTree ct ON c.parent_srl = ct.comment_srl
        WHERE c.status <> -1 -- 재귀적으로 가져오는 부분에 status 조건 추가
      )
      
      -- 최종적으로 페이징 처리 및 정렬
      SELECT
        *
      FROM (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY top_comment_srl ORDER BY depth, regdate) AS row_num -- 각 최상위 댓글 그룹 내에서 순번을 매깁니다.
        FROM CommentTree
      ) sub
      ORDER BY top_comment_srl, row_num -- 최상위 댓글 그룹별로 정렬합니다.
      LIMIT ${commentsPageSize} OFFSET ${offset}
    `)

    // comments를 처리합니다.
  const comments = commentsRows.map((comment: any) => {
    let displayedContent

    // 삭제된 댓글
    if (comment.status === 0 || comment.status === -1) {
      displayedContent = '삭제된 댓글 입니다.'
    } 
    // 비밀 댓글 처리
    else if (comment.is_secret === 1) {
      if (isAdmin) {
        // 운영자는 비밀 댓글 내용을 볼 수 있습니다.
        displayedContent = comment.content
      } else {
        // 일반 사용자는 비밀 댓글 내용을 볼 수 없습니다.
        displayedContent = '비밀댓글 입니다.'
      }
    } 
    // 일반 댓글
    else {
      displayedContent = comment.content
    }

    return {
      comment_srl: comment.comment_srl,
      module_srl: comment.module_srl,
      document_srl: comment.document_srl,
      parent_srl: comment.parent_srl,
      is_secret: comment.is_secret,
      content: displayedContent, // 처리된 내용을 할당합니다.
      voted_count: comment.voted_count,
      blamed_count: comment.blamed_count,
      notify_message: comment.notify_message,
      // password: comment.password,
      user_id: comment.user_id,
      user_name: comment.user_name,
      member_srl: comment.member_srl,
      email_address: comment.email_address,
      homepage: comment.homepage,
      uploaded_count: comment.uploaded_count,
      regdate: comment.regdate,
      last_update: comment.last_update,
      ipaddress: comment.ipaddress,
      list_order: comment.list_order,
      status: comment.status,
    }
  })


    const commentsData = {
      content: comments,
      page: {
        currentPage: totalCommentsPages,
        totalContents: totalCommentsResult?.[0]?.totalComments,
        totalPages: totalCommentsPages,
      },
    }

    const this_regdate = row.regdate
    const filteredModule = module_srl === -1 ? [214, 52] : module_srl

    // 이전 글 가져오기 (최대 2개)
    const [beforeRows] = await pool.query<RowDataPacket[]>(`
      SELECT *
      FROM (
        SELECT *
        FROM xe_documents
        WHERE status = 'PUBLIC' AND module_srl  IN (?) AND regdate > ?
        ORDER BY regdate
        LIMIT 2
      ) AS tmp
      ORDER BY regdate DESC
    `, [filteredModule, this_regdate])

    const beforePosts = beforeRows.map(row => ({
      ...row,
      summary: removeTags(row.content).length > 100 ? removeTags(row.content).substring(0, 100) + '...' : removeTags(row.content),
      content: '',
    }))

    // 다음 글 가져오기 (최대 2개)
    const [afterRows] = await pool.query<RowDataPacket[]>(`
      SELECT *
      FROM xe_documents
      WHERE status = 'PUBLIC' AND module_srl IN (?) AND regdate < ?
      ORDER BY regdate DESC
      LIMIT 2
    `, [filteredModule, this_regdate])

    const afterPosts = afterRows.map(row => ({
      ...row,
      summary: removeTags(row.content).length > 100 ? removeTags(row.content).substring(0, 100) + '...' : removeTags(row.content),
      content: '',
    }))

    // otherPost 배열 구성: 이전 글 0~2개, 현재 글, 다음 글 0~2개
    const otherPost = [...beforePosts, row, ...afterPosts]

    return {
      props: {
        documents: JSON.parse(JSON.stringify(row)),
        otherPost: JSON.parse(JSON.stringify(otherPost)),
        comments: JSON.parse(JSON.stringify(commentsData)),
        document_srl,
        module_srl,
      },
    } as GetServerSidePropsResult<any>
  } catch (err) {
    console.log(err)
    return {
      props: {
        documents: {},
        otherPost: [],
        comments: {
          content: [],
          page: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
            module_srl: -1,
            document_srl: -1,
          },
        },
      },
    }
  }
}

export default function Document({
  documents = {},
  otherPost = [],
  comments = {},
  document_srl = 0,
  module_srl = -1,
}:{documents: any, otherPost: any[], comments: any, document_srl: any, module_srl: any}) {
  const [myInfo, setMyInfo]:[(string | null), Function] = useRecoilState(MyInfoAtom)
  const [load, setLoad] = useRecoilState(LoadAtom)
  const [hydrated, setHydrated] = useState(false)
  const [commentsState, setCommentsState] = useState(comments)
  const [currentCommentPage, setCurrentCommentPage] = useState(1)
  const [commentPaging, setCommentPaging]:[number[], Function] = useState([1])
  const [commentPageRandomKey, setCommentPageRandomKey] = useState(0)
  useEffect(() => {
    if (comments.page.totalPages > 0) {
      const totalPages = comments.page.totalPages
      let startPage = Math.max(1, currentCommentPage - 3)
      let endPage = Math.min(totalPages, currentCommentPage + 3)
  
      if (currentCommentPage <= 4) {
        startPage = 1
        endPage = Math.min(10, totalPages)
      } else if (currentCommentPage > totalPages - 6) {
        startPage = Math.max(totalPages - 9, 1)
        endPage = totalPages
      }
  
      const newPaging = []
      for (let i = startPage; i <= endPage; i++) {
        newPaging.push(i)
      }
      setCommentPaging(newPaging)
    }
  }, [comments, currentCommentPage])
  const changeCommentPage = useCallback((page:number) => {
    if(!hydrated) setHydrated(true)
    console.log(page)
    setCurrentCommentPage(page)
    setCommentPageRandomKey(Math.random())
  }, [hydrated, commentPageRandomKey, currentCommentPage])

  const clickCommentPage = useCallback((page:number) => {
    if(!commentTitleRef.current) return
    changeCommentPage(page)
    commentTitleRef.current.scrollIntoView()
  }, [])

  const commentTitleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    getCommentData(currentCommentPage)
  }, [commentPageRandomKey, currentCommentPage])
  const getCommentData = useCallback(async(page:number) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/${page}`)
      if(res.status === 200) {
        console.log(res.data)
        setCommentsState(res.data)
      } else throw new Error('network failed')
    } catch(err) {
      console.log(err)
      setCommentsState(comments)
    }
  }, [])

  // 답글
  const initialRepData = useMemo(() => ({
    active: false,
    module_srl: 0,
    document_srl: 0,
    parent_srl: -1,
    user_name: myInfo ? decodeURIComponent(myInfo.split('|')[2]): '',
    user_id: myInfo ? myInfo.split('|')[1] : '',
    member_srl: myInfo ? parseInt(myInfo.split('|')[0]) : 0,
    email_address: myInfo ? myInfo.split('|')[4] : '',
    content: '',
    is_secret: false,
    voted_count: 0,
    blamed_count: 0,
    notify_message: '',
    password: '',
    homepage: '',
    uploaded_count: '',
    last_update: '',
    regdate: '',
    ipaddress: '',
    list_order: '',
    status: 1,
  }), [myInfo])
  const [replyData, setReplyData] = useState(initialRepData)

  const onSetReplyData = useCallback((module_srl: number, document_srl: number, parent_srl: number) => {
    // 답글이 열려있는데, 또 누를 경우 닫힘
    if(replyData.parent_srl === parent_srl) {
      setReplyData(initialRepData)
    } else {
      const data = {
        ...initialRepData,
        active: true, 
        module_srl,
        document_srl,
        parent_srl
      }
      setReplyData(data)
    }
  }, [replyData])

  // 답글 텍스트 입력
  const changeReplyTextValue = useCallback((text:string) => {
    const data = {...replyData}
    data.content = text
    setReplyData(data)
  }, [replyData])

  const [replyId, setReplyId] = useState('')
  const [replyPw, setReplyPw] = useState('')

  // input에 아이디 비번 바꿀 경우
  useEffect(() => {
    const data = {...replyData}
    data.user_name = replyId
    data.password = replyPw
    setReplyData(data)
  }, [replyId, replyPw])

  // 내가 로그인한 상태라면
  useEffect(() => {
    const data = {
      ...replyData,
      user_name: myInfo ? decodeURIComponent(myInfo.split('|')[2]): '',
      user_id: myInfo ? myInfo.split('|')[1] : '',
      member_srl: myInfo ? parseInt(myInfo.split('|')[0]) : 0,
      email_address: myInfo ? myInfo.split('|')[4] : '',
    }
    setReplyData(data)
  }, [myInfo])

  // 비밀답글 버튼
  const changeReplySecret = useCallback((comment_srl:number, is_secret:boolean) => {
    const data = {...replyData, parent_srl: comment_srl, is_secret}
    setReplyData(data)
  }, [replyData, replyData.active])

  // 답글 작성
  const submitReply = useCallback(async() => {
    try {
      const data = { ...replyData }
      if(!myInfo && (!data.user_name || !data.password)) return alert('아이디와 비밀번호를 채워주세요')
      const ip = await axios.get('https://blog.gloomy-store.com/getIp.php')
      data.ipaddress = ip.data
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/push`, data)
      if(res.status === 200 || res.status === 201) {
        console.log(res.data)
        setReplyData(initialRepData)
        changeCommentPage(1)
      } else throw new Error('network failed')
    } catch (err) {
      console.log(err)
      alert('실패 했습니다.')
    }
  }, [myInfo, replyData])

  // 댓글
  const initialCommentData = useMemo(() => ({
    active: false,
    module_srl: 0,
    document_srl: 0,
    parent_srl: 0,
    user_name: myInfo ? decodeURIComponent(myInfo.split('|')[2]): '',
    user_id: myInfo ? myInfo.split('|')[1] : '',
    content: '',
    is_secret: false,
    voted_count: 0,
    blamed_count: 0,
    notify_message: false,
    password: '',
    member_srl: myInfo ? parseInt(myInfo.split('|')[0]) : 0,
    email_address: myInfo ? myInfo.split('|')[4] : '',
    homepage: '',
    last_update: '',
    ipaddress: '',
    status: 1,
    parent_member_idx: 0, // 해당 회원한테 답글 달 경우, 그 회원의 idx
    head: 0, // 최고의 parent_srl
    arrange: 0, // best 댓글같은 특수한거 만들지 않는 이상 0
  }), [myInfo])
  const [commentData, setCommentData] = useState(initialCommentData)

  // 댓글 텍스트 입력
  const changeCommentValue = useCallback((text:string) => {
    const data = {...commentData}
    data.content = text
    setCommentData(data)
  }, [commentData])
  const [commentId, setCommentId] = useState('')
  const [commentPw, setCommentPw] = useState('')

  // input에 아이디 비번 바꿀 경우
  useEffect(() => {
    const data = {...commentData}
    data.user_name = commentId
    data.password = commentPw
    setCommentData(data)
  }, [commentId, commentPw])
  useEffect(() => {
    const data = {
      ...commentData,
      user_name: myInfo ? decodeURIComponent(myInfo.split('|')[2]): '',
      user_id: myInfo ? myInfo.split('|')[1] : '',
      member_srl: myInfo ? parseInt(myInfo.split('|')[0]) : 0,
      email_address: myInfo ? myInfo.split('|')[4] : '',
    }
    setCommentData(data)
    setCommentId(data.user_name)
  }, [myInfo])

  // 비밀댓글 버튼
  const changeCommentSecret = useCallback((is_secret:boolean) => {
    const data = {...commentData, is_secret}
    setCommentData(data)
  }, [commentData, commentData.active])

  // 댓글 작성
  const submitComment = useCallback(async() => {
    console.log(commentData)
    try {
      const data = { ...commentData }
      if(!myInfo && (!data.user_name || !data.password)) return alert('아이디와 비밀번호를 채워주세요')
      const ip = await axios.get('https://blog.gloomy-store.com/getIp.php')
      data.ipaddress = ip.data
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/push`, data)
      if(res.status === 200 || res.status === 201) {
        console.log(res.data)
        changeCommentPage(1)
        setCommentData(initialCommentData)
      } else throw new Error('network failed')
    } catch (err) {
      console.log(err)
      alert('실패 했습니다.')
    }
  }, [myInfo, commentData])

  // 댓글 삭제
  const onDeleteComment = useCallback(async(comment_srl:number) => {
    try {
      if(!myInfo) {
        // 로그아웃한 댓글
        const Prompt = prompt('비밀번호를 입력해주세요')
        if(Prompt) {
          const data = {
            comment_srl,
            id: '',
            password: Prompt
          }
          const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/delete`, {
            data,
            withCredentials: true,
          })
          if(res.status === 200 || res.status === 201) {
            alert('삭제에 성공 했습니다.')
            getCommentData(currentCommentPage)
          }
        }
      } else {
        // 내 댓글
        const Confirm = confirm('삭제 하시겠습니까?')
        if(Confirm) {
          const data = {
            comment_srl,
            id: myInfo.split('|')[1],
            password: ''
          }
          const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/delete`, {
            data,
            withCredentials: true,
          })
          if(res.status === 200 || res.status === 201) {
            alert('삭제에 성공 했습니다.')
            getCommentData(currentCommentPage)
          }
        }
      }
    } catch(err) {
      console.log(err)
      alert('실패했습니다.')
    }
  }, [myInfo])

  const onCompletelyDeleteComment = useCallback(async(comment:any) => {
    try {
      const Confirm = confirm('정말로 완전 삭제 하시겠습니까?')
      if(!Confirm) return
      if(myInfo?.split('|')[1] !== process.env.NEXT_PUBLIC_ADMIN_ID) throw new Error(`You're not admin! Your ID is ${myInfo?.split('|')[1]} and myInfo is ${myInfo}`)
      const data = {
        comment_srl: comment.comment_srl,
      }
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/delete/force`, {
        data,
        withCredentials: true,
      })
      if(res.data === true) {
        alert('성공')
        setCommentPageRandomKey(Math.random())
        getCommentData(currentCommentPage)
      } else throw new Error(`Failed`)
    } catch(err) {
      console.log(err)
      alert('실패')
    }
  }, [myInfo])

  // 댓글 수정
  // 수정할 댓글
  const initialEditingCommentData = useMemo(() => ({
    active: false,
    module_srl: -1,
    document_srl: -1,
    parent_srl: -1,
    comment_srl: -1,
    user_name: myInfo ? decodeURIComponent(myInfo.split('|')[2]): '',
    user_id: myInfo ? myInfo.split('|')[1] : '',
    content: '',
    new_content: '',
    is_secret: false,
    voted_count: 0,
    blamed_count: 0,
    notify_message: false,
    password: '',
    member_srl: myInfo ? parseInt(myInfo.split('|')[0]) : 0,
    email_address: myInfo ? myInfo.split('|')[4] : '',
    homepage: '',
    ipaddress: '',
    status: 1,
    parent_member_idx: 0, // 해당 회원한테 답글 달 경우, 그 회원의 idx
    head: 0, // 최고의 parent_srl
    arrange: 0, // best 댓글같은 특수한거 만들지 않는 이상 0
  }), [myInfo])
  const [editingComment, setEditingComment] = useState(initialEditingCommentData)
  const onEditComment = useCallback(async(comment:any) => {
    try {
      if(!myInfo) {
        // 로그아웃한 댓글
        const Prompt = prompt('비밀번호를 입력해주세요')
        if(Prompt !== null) {
          const data = {
            comment_srl: comment.comment_srl,
            id: '',
            password: Prompt
          }
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/edit`, data)
          if(res.data === true) {
            setEditingComment({...comment, new_content: comment.content, active: true, password: Prompt})
          }
        }
      } else {
        // 내 댓글
        setEditingComment({...comment, new_content: comment.content, active: true})
      }
    } catch(err) {
      console.log(err)
      alert('실패했습니다.')
    }
  }, [myInfo, editingComment])
  const onEditCommentComplete = useCallback(async() => {
    try {
      // 내 댓글
      const data = {...editingComment}
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${module_srl}/document/${document_srl}/comment/edit`, data)
      if(res.status === 200 || res.status === 201) {
        alert('수정을 성공 했습니다.')
        changeCommentPage(currentCommentPage)
      }
      setEditingComment(initialEditingCommentData)
    } catch(err) {
      console.log(err)
      alert('실패했습니다.')
      setEditingComment(initialEditingCommentData)
    }
  }, [myInfo, editingComment])

  const changeEditingCommentTextValue = useCallback((text:string) => {
    const data = {...editingComment}
    data.new_content = text
    setEditingComment(data)
  }, [editingComment])

  // 수정 취소
  const onEditCommentCancel = useCallback(async() => {
    setEditingComment(initialEditingCommentData)
  }, [editingComment])
  
  // modal
  const [profileModal, setProfileModal] = useRecoilState(ProfileModalAtom)
  const [profileModalActive, setProfileModalActive] = useRecoilState(ProfileModalActiveAtom)
  const profileView = useCallback(async(id?:(string | undefined), name?:string) => {
    try {
      if(!id && name) {
        setProfileModal({
          BOR_mem_idx: '',
          BOR_mem_id: '',
          BOR_mem_name: name,
          BOR_mem_email: '',
          BOR_mem_regi_day: ''
        })
        setProfileModalActive(true)
      }
      const data = { id }
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/common/getProfile`, data)
      if(res.status === 200) {
        setProfileModal(res.data)
        setProfileModalActive(true)
      }
    } catch(err) {
      console.log(err)
    }
  }, [profileModal, profileModalActive])

  const router = useRouter()

  return (
    <>
      <HeadComponent
        title={'글루미스토어 - ' + documents.title}
        description={documents.summary}
        keywords={`${documents.tags.length ? documents.tags.join(', ') : ''} ${documents?.title?.replace(/\s/gi, ', ')} ${documents?.summary?.replace(/\s/gi, ', ')}`}
        
      />
      
      <div className='gl-wrap'>
        <div className='gl-wrap__inner'>
          <Header />
          <main className='gallery_wrap gallery_wrap--board' itemScope={true} itemType='https://schema.org/CreativeWork'>
            <div className='mt-50'>
              <h1 className='invisible'>{documents.title}</h1>
              <h2 className='title02 deco' itemProp='title' id='title'>
                <Link href='/#title'>
                  my <span className='t-beige'>Blog</span>!
                </Link>
              </h2>
            </div>


            <div className={styles['content_wrap']} id='content_wrap' itemScope={true} itemType='https://schema.org/CreativeWork'>
              <div className={styles['title_wrap']}>
                <div className={styles['title']}>
                  <h2 itemProp='title'>{documents.title}</h2>
                  <p>
                    <span id='date' itemProp='datePublished'>2023.09.11</span>
                    <span>
                      <em id='count'>조회수{documents.readed_count}</em>
                      <em id='name' itemProp='creator'>{documents.user_name}</em>
                    </span>
                  </p>
                </div>
              </div>
              <div className={styles['content']} id='content'>
                <div className={styles['young_board_content']} data-pswp-uid='1'>
                  {
                    documents.content && <div id='real' dangerouslySetInnerHTML={{__html: documents.content}} />
                  }
                </div>
              </div>
              <div className={styles['comment']} id='comment'>
                <div className={styles['comment_inner']} id='comment_inner'>
                  <h3 className={styles['comment_total']} ref={commentTitleRef}>댓글: <span id='comment_total_num'>{comments?.page?.totalContents}</span></h3>
                  <div className={styles['comment_list_wrapper']} id='comment_list_wrapper'>
                    {
                      [commentPageRandomKey === 0 ? comments?.content : commentsState?.content]?.[0]?.map((comment:any, idx:number) => (
                          <div className={`${styles['comment_list_wrap']} ${comment.parent_srl !== 0 && styles['comment_rep']}`} key={'comment' + commentPageRandomKey + idx}>
                            <div className={styles['comment_list']}>
                              <div className={styles['comment_photo']}>
                                
                                  {
                                    comment.user_id &&
                                    <button type='button' onClick={() => profileView(comment.user_id)}>
                                      <MiniProfileImage
                                        user_id={comment.user_id} 
                                        alt='profile image'
                                        size={{ width: 48, height: 48 }}
                                      />
                                    </button>
                                  }
                                  {
                                    !comment.user_id &&
                                    <button type='button' onClick={() => profileView(undefined, comment.user_name)}>
                                      <MiniProfileImage
                                        user_id='/images/file/members/default-user.png' 
                                        alt='profile image'
                                        size={{ width: 48, height: 48 }}
                                      />
                                    </button>
                                  }
                              </div>
                              <div className={styles['comment_text_wrap']}>
                                <div className={styles['comment_name']}>
                                  <button type='button'>
                                    <span>
                                      {
                                        comment.user_id === process.env.NEXT_PUBLIC_ADMIN_ID && <b className='black t-purple'>[운영자] </b>
                                      }  
                                    </span>
                                    {comment.user_name}
                                  </button>
                                  <p>{moment(comment.regdate).format('YYYY-MM-DD HH:mm')}</p>
                                </div>
                                
                                <div className={styles['comment_text']}>
                                  {
                                    editingComment.active && editingComment.comment_srl === comment.comment_srl ?
                                    <textarea 
                                      className={`${styles['edit_area']} styles['comment_form_text']`} 
                                      name='comment_form_txt' 
                                      cols={30} 
                                      rows={10} 
                                      placeholder='수정할 댓글을 남겨주세요!' 
                                      value={editingComment.new_content}
                                      onChange={(e) => changeEditingCommentTextValue(e.currentTarget.value)}
                                    />
                                    :
                                    <>
                                    {comment.content}
                                    </>
                                  }
                                </div>
                                  <div className={styles['comment_edit']}>
                                    {
                                      load && comment.status === 1 && <>
                                      {
                                      // 로그인 한 댓글
                                        comment.user_id ? <>
                                          {
                                            // 로그인 한 댓글인데, 나도 로그인 했고, 내가 댓글의 주인일 때
                                            myInfo &&
                                            (myInfo as string).split('|')[1] === comment.user_id && 
                                            !editingComment.active ? <p>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onEditComment(comment)}  
                                            >수정</button>
                                            <span> / </span>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onDeleteComment(comment.comment_srl)}
                                            >삭제</button>
                                          </p>
                                          :
                                          // 수정상태일때
                                          myInfo &&
                                          (myInfo as string).split('|')[1] === comment.user_id && 
                                          editingComment.active &&
                                          editingComment.comment_srl === comment.comment_srl &&
                                          <p>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={onEditCommentCancel}  
                                            >취소</button>
                                            <span> / </span>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onEditCommentComplete()}
                                            >수정완료</button>
                                          </p>
                                          }
                                        </>
                                        :
                                        <>
                                        {
                                          // 로그인 안 한 댓글인데, 나도 로그인 안했을 때
                                          // 수정상태가 아닐 때
                                          !myInfo && !editingComment.active ? <p>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onEditComment(comment)}  
                                            >수정</button>
                                            <span> / </span>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onDeleteComment(comment.comment_srl)}
                                            >삭제</button>
                                          </p>
                                          :
                                          // 수정상태일때
                                          !myInfo && editingComment.active && editingComment.comment_srl === comment.comment_srl &&
                                          <p>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={onEditCommentCancel}  
                                            >취소</button>
                                            <span> / </span>
                                            <button 
                                              type='button' 
                                              className={styles['onRep']}
                                              onClick={() => onEditCommentComplete()}
                                            >수정완료</button>
                                          </p>
                                        }
                                        </>
                                      }
                                    </>
                                  }
                                  {
                                    // 최상위 depth 댓글일 때
                                    comment.parent_srl === 0 &&
                                    // 정상 댓글일 때
                                    comment.status === 1 &&
                                    // 비밀 댓글이면서 운영자 로그인이 아닐 때는 답글 못적음
                                    !(comment.is_secret && myInfo?.split('|')[1] !== process.env.NEXT_PUBLIC_ADMIN_ID) &&
                                    // 댓글 수정중에는 답글 안됨
                                    !editingComment.active &&
                                    <button 
                                    type='button'
                                    className={styles['onRep']}
                                    onClick={() => onSetReplyData(comment.module_srl, comment.document_srl, comment.comment_srl)}  
                                  >
                                    답글
                                  </button>
                                  }
                                  {
                                    myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID &&
                                    <p style={{display:'block'}}>
                                      <button 
                                        type='button' 
                                        className={styles['onRep']}
                                        onClick={() => onCompletelyDeleteComment(comment)}  
                                      >완전삭제</button>
                                    </p>
                                  }
                                </div>
                              </div>
                            </div>
                            {
                            // 답글 달기가 활성화 상태라면
                            replyData.active && replyData.parent_srl === comment.comment_srl &&
                              <div className={styles['rep-wrap']}>
                                <form className={styles['comment_form_rep']}>
                                  <div className={styles['rep']}>
                                    <Image 
                                      src='/images/icon/arrow-rep.png' 
                                      alt='arrow' 
                                      width={48}
                                      height={48}
                                    />
                                  </div>
                                  <div className={styles['comment_form_rep_textarea']}>
                                    <div className={styles['comment_form_name']}>
                                      <div>
                                        <input 
                                          type='text' 
                                          name='comment_name' placeholder='이름' 
                                          maxLength={15}
                                          disabled={!!myInfo} 
                                          value={replyData.user_name}
                                          onChange={(e) => setReplyId(e.currentTarget.value)}
                                        />
                                      </div>
                                      <div>
                                        <input 
                                          type='password' name='rep_rep_pass' placeholder='비밀번호' 
                                          maxLength={15} 
                                          autoComplete='off'
                                          value={replyData.password}
                                          disabled={!!myInfo}
                                          onChange={(e) => setReplyPw(e.currentTarget.value)}
                                        />
                                      </div>
                                    </div>
                                    <textarea 
                                      name='comment_form_txt' 
                                      className={styles['comment_form_text']} 
                                      cols={30} 
                                      rows={10} 
                                      placeholder='답글을 남겨주세요!' 
                                      value={replyData.content}
                                      onChange={(e) => changeReplyTextValue(e.currentTarget.value)}
                                    ></textarea>
                                    <div className={styles['comment_btns']}>
                                      <input 
                                        type='checkbox' 
                                        className={styles['check_secret']} 
                                        id={'check_secret_' + idx} 
                                        onChange={(e) => changeReplySecret(comment.comment_srl, e.currentTarget.checked)}  
                                      />
                                      <label htmlFor={'check_secret_' + idx}>
                                        비밀 댓글
                                      </label>
                                      <button 
                                        type='button' 
                                        className={styles['submit-button']}
                                        onClick={submitReply}
                                      >작성</button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            }
                        </div>
                      ))
                    }
                  </div>
                  <div className='paging'>
                    <button
                      type='button'
                      className='arrow_btn double first'
                      aria-label='arrow_btn_double_first'
                      onClick={() => clickCommentPage(1)}
                    >
                      <i className='fa fa-angle-double-left'></i>
                    </button>
                    <button
                      type='button'
                      className='arrow_btn single prev'
                      aria-label='arrow_btn_single_prev'
                      onClick={() => {
                        if(currentCommentPage > 1) {
                          clickCommentPage(currentCommentPage - 1)
                        }
                      }}
                    >
                      <i className='fa fa-angle-left'></i>
                    </button>
                    <div id='board_paging'>
                      {commentPaging?.length && commentPaging?.map((page) => (
                        <button
                          key={'commentsPaging' + page}
                          type='button'
                          className={`paging_btn ${page === currentCommentPage && 'active'}`}
                          aria-label={`paging_btn_${page}`}
                          onClick={() => clickCommentPage(page)}
                        >
                          <i className='fa'>{page}</i>
                        </button>
                      ))}
                    </div>
                    <button
                      type='button'
                      className='arrow_btn single next'
                      aria-label='arrow_btn_single_next'
                      onClick={() => {
                        if(currentCommentPage < comments.page.totalPages) {
                          clickCommentPage(currentCommentPage + 1)
                        }
                      }}
                    >
                      <i className='fa fa-angle-right'></i>
                    </button>
                    <button
                      type='button'
                      className='arrow_btn double last'
                      aria-label='arrow_btn_double_last'
                      onClick={() => clickCommentPage(comments.page.totalPages)}
                    >
                      <i className='fa fa-angle-double-right'></i>
                    </button>
                  </div>
                  <form name='comment_form' id='comment_form' className={styles['comment_form']} data-gtm-form-interact-id='0'>
                    {
                      load && <div className={styles['comment_form_textarea']}>
                      <div id='comment_form_name' className={styles['comment_form_name']}>
                        <div>
                          <input 
                            type='text' 
                            name='comment_name' 
                            placeholder='이름' 
                            maxLength={30} 
                            required={true} data-gtm-form-interact-field-id='0'
                            disabled={!!myInfo} 
                            value={commentId}
                            onChange={(e) => setCommentId(e.currentTarget.value)}
                          />
                        </div>
                        <div>
                          <input 
                            type='password' 
                            name='comment_pass' 
                            placeholder='비밀번호' 
                            maxLength={15} required={true} autoComplete='on' data-gtm-form-interact-field-id='1' 
                            disabled={!!myInfo} 
                            value={commentPw}
                            onChange={(e) => setCommentPw(e.currentTarget.value)}
                          />
                        </div>
                      </div>
                      <textarea 
                        name='comment_form_text' 
                        className={styles['comment_form_text']} 
                        cols={30} 
                        rows={10} 
                        placeholder='댓글을 남겨주세요!' 
                        value={commentData.content}
                        onChange={(e) => changeCommentValue(e.currentTarget.value)}
                        required={true} 
                      />
                      <div className={styles['comment_btns']}>
                        <input 
                          type='checkbox' 
                          className={styles['check_secret']} 
                          name='check_secret' 
                          id='check_secret'
                          onChange={(e) => changeCommentSecret(e.currentTarget.checked)} 
                        />
                        <label htmlFor='check_secret'>비밀 댓글</label>
                        <button 
                          type='button' 
                          className={styles['submit-button']}
                          onClick={submitComment}
                        >작성</button>
                      </div>
                    </div>
                    }
                  </form>
                </div>
              </div>
 
              <div className={styles['toList_wrap']}>
                <Link href={`/board/${module_srl}/page/1`} className={styles['toList']}>목록으로</Link>
              </div>
            </div>
            <div className={styles['another_content']}>
              <h3>이전/다음글</h3>
              <div className={styles['another_content_inner']}>
                {
                  otherPost?.length > 0 &&otherPost?.map((item, idx) => (
                  <Link 
                    href={`/board/${module_srl}/document/${item.document_srl}#title`} 
                    title={item.title} 
                    style={
                      item.thumb ?
                      {
                        backgroundImage: `url('/images/file/board/${item.document_srl}/thumb.webp'), url('/images/flower6.webp')`
                      }
                      :
                      {
                        backgroundImage: `url('/images/flower6.webp')`
                      }
                    } className={`${document_srl === item.document_srl && styles['active']}`}
                    key={'otherPost' + idx}
                  >
                    <div className={styles['script']}>
                      <p className={styles['subject']}><span>{item.title}</span></p>
                      <p className={styles['text']}><span>{item.summary}</span></p>
                    </div>
                  </Link>
                  ))
                }
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
