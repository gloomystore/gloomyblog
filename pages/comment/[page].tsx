import HeadComponent from '@/components/HeadComponent'
import HeaderNoContent from '@/components/HeaderNoContent'
import axios from 'axios'
import { RowDataPacket } from 'mysql2'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pool from '../api/db/mysql'

import nextCookies from 'next-cookies'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { MyInfoAtom } from '@/store/CommonAtom'
import { useRecoilState } from 'recoil'
import Image from 'next/image'
import { TodayHitAtom, TotalHitAtom } from '@/store/StatisticsAtom'



interface Props {
  comments: any
}
interface Props {
  comments: any;
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  ctx: GetServerSidePropsContext<ParsedUrlQuery>
) => {
  try {
    const page = parseInt(ctx?.params?.page as string) || 1
    const document_srl = 201
    const cookies = nextCookies(ctx)
    const token = cookies.accessToken
    let isAdmin = false
    let myInfo = null
    let cookieUserId = null

    if (token) {
      try {
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET ?? ''
        const decoded = jwt.verify(token, secret) as any
        const cookieMyInfo = cookies.myInfo ?? null
        myInfo = cookieMyInfo ? atob(atob(cookieMyInfo)) : null // 디코딩된 사용자 정보
        isAdmin = myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID
        cookieUserId = myInfo?.split('|')[1] as string
      } catch (error) {
        console.error('JWT 검증 실패:', error)
      }
    }

    const commentsPageSize = 30
    const offset = (page - 1) * commentsPageSize

    // 최상위 댓글을 가져오는 쿼리
    const [topCommentsRows] = await pool.query<RowDataPacket[]>(`
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
        status
      FROM xe_comments
      WHERE document_srl = ${document_srl} AND parent_srl = 0 AND status <> -1
      ORDER BY regdate DESC
      LIMIT ${commentsPageSize} OFFSET ${offset}
    `)

    // 최상위 댓글의 SRLs 추출
    const topCommentsSrls = topCommentsRows.map(comment => comment.comment_srl).join(',')

    let repliesRows: RowDataPacket[] = []
    if (topCommentsSrls) {
      // 최상위 댓글의 답글을 가져오는 쿼리
      const [repliesResult] = await pool.query<RowDataPacket[]>(`
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
          status
        FROM xe_comments
        WHERE document_srl = ${document_srl} AND parent_srl IN (${topCommentsSrls}) AND status <> -1
        ORDER BY regdate ASC
      `)
      repliesRows = repliesResult
    }

    // 최상위 댓글과 답글을 하나의 배열로 통합하여 정렬
    const allComments = topCommentsRows.reduce((acc: any[], comment: any) => {
      // 최상위 댓글 추가
      acc.push({
        ...comment,
        content: handleCommentContent(comment, isAdmin, cookieUserId),
      })

      // 해당 최상위 댓글의 답글을 추가
      const replies = repliesRows.filter(reply => reply.parent_srl === comment.comment_srl)
      replies.forEach(reply => {
        acc.push({
          ...reply,
          content: handleCommentContent(reply, isAdmin, cookieUserId),
        })
      })

      return acc
    }, [])

    // 전체 댓글 수를 계산합니다. (모든 댓글의 수를 구함, 답글 포함)
    const [totalCommentsResult] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS totalComments
      FROM xe_comments
      WHERE document_srl = ${document_srl} AND status <> -1 AND parent_srl = 0
    `)

    // 전체 페이지 수를 계산합니다. (최상위 댓글만 대상으로 계산)
    const totalCommentsPages = Math.ceil(
      totalCommentsResult?.[0]?.totalComments / commentsPageSize
    )

    const commentsData = {
      content: allComments,
      page: {
        currentPage: page,
        totalContents: totalCommentsResult?.[0]?.totalComments,
        totalPages: totalCommentsPages,
      },
      module_srl: 0,
      document_srl,
    }

    return {
      props: {
        comments: JSON.parse(JSON.stringify(commentsData)),
      },
    } as GetServerSidePropsResult<any>
  } catch (err) {
    console.log(err)
    return {
      props: {
        comments: {
          content: [],
          page: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
          },
          document_srl: 0,
          module_srl: 201,
        },
      },
    }
  }
}

// 비밀 댓글 및 삭제된 댓글 처리를 위한 함수
const handleCommentContent = (
  comment: any,
  isAdmin: boolean,
  cookieUserId: string | null
): string => {
  let displayedContent

  // 삭제된 댓글
  if (comment.status === 0 || comment.status === -1) {
    displayedContent = '삭제된 댓글 입니다.'
  }
  // 비밀 댓글 처리
  else if (comment.is_secret === 1) {
    if (isAdmin || cookieUserId === comment.user_id) {
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

  return displayedContent
}

export default function Comment ({comments}:{comments:any}) {
  const router = useRouter()
  const [myInfo, setMyInfo]:[(string | null), Function] = useRecoilState(MyInfoAtom)
  const [todayHit] = useRecoilState(TodayHitAtom)
  const [totalHit] = useRecoilState(TotalHitAtom)
  // comment data 
  const [hydrated, setHydrated] = useState(false)
  const [commentsState, setCommentsState] = useState(comments)
  const [currentCommentPage, setCurrentCommentPage] = useState(1)
  const [commentPaging, setCommentPaging]:[number[], Function] = useState([1])
  const [commentPageRandomKey, setCommentPageRandomKey] = useState(0)
  useEffect(() => {
    if (comments?.page?.totalPages > 0) {
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

  const commentTitleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    getCommentData(currentCommentPage)
  }, [commentPageRandomKey, currentCommentPage])
  const getCommentData = useCallback(async(page:number) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/${page}`)
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
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/push`, data)
      if(res.status === 200 || res.status === 201) {
        console.log(res.data)
        router.reload()
        // setReplyData(initialRepData)
        // changeCommentPage(1)
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
      if(!data.content) return alert('내용을 입력해주세요')
      if(!myInfo && !(commentId && commentPw)) return alert('이름과 비밀번호를 채워주세요')
      const ip = await axios.get('https://blog.gloomy-store.com/getIp.php')
      data.ipaddress = ip.data
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/push`, data)
      if(res.status === 200 || res.status === 201) {
        router.push(`/comment/1`)
        setPageResetKey(Math.random())
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
          const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete`, {
            data,
            withCredentials: true,
          })
          if(res.status === 200 || res.status === 201) {
            alert('삭제에 성공 했습니다.')
            getCommentData(currentCommentPage)
            setPageResetKey(Math.random())
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
          const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete`, {
            data,
            withCredentials: true,
          })
          if(res.status === 200 || res.status === 201) {
            alert('삭제에 성공 했습니다.')
            getCommentData(currentCommentPage)
            setPageResetKey(Math.random())
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
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete/force`, {
        data,
        withCredentials: true,
      })
      if(res.data === true) {
        alert('성공')
        setPageResetKey(Math.random())
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
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/edit`, data)
          if(res.status === 200) {
            setEditingComment({...comment, new_content: res.data.content, active: true, password: Prompt})
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
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/edit`, data)
      if(res.status === 200 || res.status === 201) {
        alert('수정을 성공 했습니다.')
        router.reload()
      }
    } catch(err) {
      console.log(err)
      alert('실패했습니다.')
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

  // 라디오
  const onRadioClick = useCallback(() => {
    alert('추억으로 남겨둡시다')
  }, [])

  // page reset
  const [pageResetKey, setPageResetKey] = useState(0)
  const divRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if(!divRef.current) return
    divRef.current.scrollTo(0, 0)
    console.log(router.query.page)
  }, [router.query.page])

  useEffect(() => {
    if(!divRef.current) return
    setCommentData(initialCommentData)
    setReplyData(initialRepData)
    setEditingComment(initialEditingCommentData)
    divRef.current.scrollTo(0, 0)
  }, [pageResetKey])
  console.log(router)

  return (
    <>
      <HeadComponent
        title={'글루미스토어 - 방명록, comment'}
        description={'글루미 스토어 방명록입니다. 댓글을 남겨주세요. 영이에게 하고싶은 말이 있다면 얼마든지 하십시오'}
        keywords={'글루미스토어, 프론트엔드, 개발자, 방명록, comment'}
        canonical={process.env.NEXT_PUBLIC_API_URL + router.asPath}
      />
      <div className='gl-wrap gl-comment'>
        <h1 className='invisible'>방명록</h1>
        <div className='gl-wrap__inner'>
          <HeaderNoContent />
          <main className='gl-ui-main'>
            <div>
              <section className='gl-ui-left'>
                <h3 className='invisible'>profile</h3>
                <div className='statistics-area'>
                  <p>
                    <span>TODAY</span>
                    <span className='today'>{todayHit}</span>
                    <span> | </span>
                    <span>TOTAL</span>
                    <span>{totalHit}</span>
                  </p>
                </div>
                <div className='box'>
                  <button className='photo-area'>
                    <img
                      src={`/images/file/members/${process.env.NEXT_PUBLIC_ADMIN_ID}/photo.webp`}
                      alt='프로필 이미지'
                    />
                  </button>
                  <article className='my-word-area'>
                    <h2>
                      <span className='today-is'>TODAY IS...</span>
                      <div>
                        <span className='icon'>
                          <img src='/images/icon/cyicon.gif' alt='icon' />
                        </span>
                        <span className='word'>우울</span>
                      </div>
                    </h2>
<p>{`짧은 밤이여
  백가지 꿈을 꾸기엔
  너무나 짧은 밤이여`}
</p>
                  </article>
                  <article className='neighbor-area'>
                    <h4><button>이대영</button></h4>

                  </article>
                </div>
              </section>
              <section className='gl-ui-right'>
                <h2>방명록</h2>
                <div className='box' ref={divRef}>
                  <article className='comment-create-area'>
                    <div className='comment-create-area__main'>
                      <div className={`minimi ${!myInfo && 'no-member'}`}>
                        <ProfileImage 
                          user_id={myInfo && myInfo.split('|')[1]} 
                          alt='minimi'
                        />
                        {
                          !myInfo && <div className='no-member-form'>
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
                        }
                      </div>
                      <div className='create-text'>
                        <textarea 
                          name='create-text' 
                          cols={30} 
                          rows={10} 
                          placeholder='댓글을 남겨주세요!' 
                          value={commentData.content}
                          onChange={(e) => changeCommentValue(e.currentTarget.value)}
                          required={true} 
                        />
                      </div>
                    </div>
                    <div className='radio-area'>
                      <div>
                        <span>
                          <input type='radio' id='radio1' name='radio' checked onChange={onRadioClick} />
                          <label htmlFor='radio1'>미니미</label>
                        </span>
                        <span>
                          <input type='radio' id='radio2' name='radio' onClick={onRadioClick} />
                          <label htmlFor='radio2'>카드</label>
                        </span>
                      </div>
                      <div>
                        <input 
                          type='checkbox' 
                          className='check_secret'
                          name='check_secret' 
                          id='check_secret'
                          onChange={(e) => changeCommentSecret(e.currentTarget.checked)} 
                        />
                        <label htmlFor='check_secret'>비밀 댓글</label>
                        <button 
                          type='button' 
                          className='submit-button'
                          onClick={submitComment}
                        >확인</button>
                      </div>
                    </div>
                  </article>
                  <div className='comment-list-area'>
                    {comments?.content?.map((comment:any, idx:number) => (
                      comment.parent_srl === 0 ? 
                      <article key={comment.comment_srl} className={`comment-list comment-list-first`}>
                        <div className={`comment-title-area ${comment.is_secret && 'is-secret'}`}>
                          <div>
                            <span className='comment-title-number'>NO. {comment.comment_srl}</span>
                            {
                              comment.user_id ?
                              <button className='comment-title-name is-button'>{comment.user_name}</button>
                              :
                              <span className='comment-title-name'>{comment.user_name}</span>
                            }
                            <Link href='#!' /*target='_blank'*/ className='home-icon'>
                              <Image 
                                src={`/images/icon/homepage.webp`} 
                                alt='homepage'
                                width={14}
                                height={14} 
                              />
                            </Link>
                            <span className='comment-title-date'>({moment(comment.regdate).format('YYYY.MM.DD HH:mm')})</span>
                          </div>
                          <div>
                            <div className='comment-edit'>
                            {comment.status === 1 && (
                              <>
                                {comment.user_id ? (
                                  <>
                                    {myInfo?.split('|')[1] === comment.user_id && !editingComment.active && (
                                      <>
                                        <button type='button' onClick={() => onEditComment(comment)}>수정</button>
                                        <span> / </span>
                                        <button type='button' onClick={() => onDeleteComment(comment.comment_srl)}>삭제</button>
                                      </>
                                    )}
                                    {myInfo?.split('|')[1] === comment.user_id && editingComment.active && (
                                      <>

                                        <button type='button' onClick={onEditCommentCancel}>취소</button>
                                        <span> / </span>
                                        <button type='button' onClick={onEditCommentComplete}>수정완료</button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {!myInfo && !editingComment.active && (
                                      <>
                                        <button type='button' onClick={() => onEditComment(comment)}>수정</button>
                                        <span> / </span>
                                        <button type='button' onClick={() => onDeleteComment(comment.comment_srl)}>삭제</button>
                                      </>
                                    )}
                                    {!myInfo && editingComment.active && editingComment.comment_srl === comment.comment_srl && (
                                      <>
                                        <button type='button' onClick={onEditCommentCancel}>취소</button>
                                        <span> / </span>
                                        <button type='button' onClick={onEditCommentComplete}>수정완료</button>
                                      </>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                            {comment.parent_srl === 0 && comment.status === 1 && !editingComment.active && (
                              <button type='button' onClick={() => onSetReplyData(comment.module_srl, comment.document_srl, comment.comment_srl)} style={{paddingLeft:3}}>
                                답글
                              </button>
                            )}
                            {myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID && (
                              <p style={{ display: 'block' }}>
                                <button type='button' className='super-delete-button' onClick={() => onCompletelyDeleteComment(comment)}>
                                  완전삭제
                                </button>
                              </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='comment-content-area'>
                          <button>
                            <ProfileImage
                              user_id={comment.user_id} 
                              alt='minimi'
                            />
                          </button>
                          
                            {editingComment.active && editingComment.comment_srl === comment.comment_srl ? (
                              <textarea
                                className='edit-area'
                                name='comment_form_txt'
                                cols={30}
                                rows={6}
                                placeholder='수정할 댓글을 남겨주세요!'
                                value={editingComment.new_content}
                                onChange={(e) => setEditingComment({ ...editingComment, new_content: e.currentTarget.value })}
                              />
                            ) : (
                              <p>
                                {
                                  comment.is_secret ? <span className='is-secret-comment'>
                                    <b>비밀이야</b>
                                    (이 글은 홈주인과 작성자만 볼 수 있어요.)
                                  </span> : null
                                }
                                <span>
                                {comment.content}
                                </span>
                              </p>
                            )}
                          
                        </div>
                        {replyData.active && replyData.parent_srl === comment.comment_srl && (
                          <div className='rep-wrap'>
                            <form className='comment_form_rep'>
                            <article className={`comment-rep-create ${!myInfo && 'not-memeber'}`}>
                                {
                                  !myInfo && <div className='info-area'>
                                    <input 
                                      type='text' 
                                      name='comment_name' placeholder='이름' 
                                      maxLength={15}
                                      disabled={!!myInfo} 
                                      value={replyData.user_name}
                                      onChange={(e) => setReplyId(e.currentTarget.value)}
                                    />
                                    <input 
                                      type='password' name='rep_rep_pass' placeholder='비밀번호' 
                                      maxLength={15} 
                                      autoComplete='off'
                                      value={replyData.password}
                                      disabled={!!myInfo}
                                      onChange={(e) => setReplyPw(e.currentTarget.value)}
                                    />
                                  </div>
                                }
                                <textarea 
                                  name='comment_rep_text' 
                                  className='comment_rep_text' 
                                  cols={30} 
                                  rows={10} 
                                  placeholder='답글을 남겨주세요!' 
                                  value={replyData.content}
                                  onChange={(e) => changeReplyTextValue(e.currentTarget.value)}
                                ></textarea>
                                <div className='submit-box'>
                                  <div>
                                    <input 
                                      type='checkbox' 
                                      className='check_secret'
                                      id={'check_secret_' + idx} 
                                      onChange={(e) => changeReplySecret(comment.comment_srl, e.currentTarget.checked)}  
                                    />
                                    <label htmlFor={'check_secret_' + idx}>
                                      비밀 댓글
                                    </label>
                                  </div>
                                  <button 
                                    type='button' 
                                    className={'submit-button'}
                                    onClick={submitReply}
                                  >작성</button>
                                </div>
                              </article>
                            </form>
                          </div>
                        )}
                      </article>
                      :
                      <article className={`comment-rep ${comments?.content?.[idx - 1]?.parent_srl === 0 && 'comment-rep-first'} ${comments?.content?.[idx + 1]?.parent_srl === 0 && 'comment-rep-last'}`} key={comment.comment_srl}>
                        <p>
                          {
                            comment.user_id ?
                            <button className='rep-name is-member'>{comment.user_name}</button>
                            :
                            <span className='rep-name'>{comment.user_name}</span>
                          }
                          <span className='rep-message'>
                            {
                              editingComment.active && editingComment.comment_srl === comment.comment_srl ?
                              <textarea 
                                className='edit_area' 
                                cols={30} 
                                rows={1} 
                                placeholder='수정할 댓글을 남겨주세요!' 
                                value={editingComment.new_content}
                                onChange={(e) => changeEditingCommentTextValue(e.currentTarget.value)}
                              />
                            :
                            <>
                            :&nbsp;
                            {comment.content}
                            </>
                            }
                          </span>
                          <span className='rep-date'>
                            ({moment(comment.regdate).format('YYYY.MM.DD HH:mm')})
                          </span>
                          {
                          // 로그인 한 댓글
                          comment.user_id ? <>
                            {
                              // 로그인 한 댓글인데, 나도 로그인 했고, 내가 댓글의 주인일 때
                              myInfo &&
                              (myInfo as string).split('|')[1] === comment.user_id && 
                              !editingComment.active ? <>
                              <button 
                                className='rep-edit'
                                type='button'
                                onClick={() => onEditComment(comment)} 
                              >
                                <Image 
                                  src='/images/icon/eraser.webp' 
                                  alt='eraser' 
                                  width={12}
                                  height={12}   
                                />
                              </button>
                              <button 
                                className='rep-delete'
                                type='button' 
                                onClick={() => onDeleteComment(comment.comment_srl)}
                              >
                                <Image 
                                  src='/images/icon/xbutton.webp' 
                                  alt='delete'
                                  width={12}
                                  height={12}   
                                />
                              </button>
                            </>
                            :
                            // 수정상태일때
                            myInfo &&
                            (myInfo as string).split('|')[1] === comment.user_id && 
                            editingComment.active &&
                            editingComment.comment_srl === comment.comment_srl &&
                            <>
                              <button 
                                type='button' 
                                className='rep-edit-cancel'
                                onClick={onEditCommentCancel}  
                              >취소</button>
                              <span> / </span>
                              <button 
                                type='button' 
                                className='rep-edit-complete'
                                onClick={() => onEditCommentComplete()}
                              >수정완료</button>
                            </>
                            }
                          </>
                          :
                          <>
                          {
                            // 로그인 안 한 댓글인데, 나도 로그인 안했을 때
                            // 수정상태가 아닐 때
                            !myInfo && !editingComment.active ? <>
                            <button 
                              className='rep-edit'
                              type='button'
                              onClick={() => onEditComment(comment)} 
                            >
                              <Image 
                                src='/images/icon/eraser.webp' 
                                alt='eraser' 
                                width={12}
                                height={12}   
                              />
                            </button>
                            <button 
                              className='rep-delete'
                              type='button' 
                              onClick={() => onDeleteComment(comment.comment_srl)}
                            >
                              <Image 
                                src='/images/icon/xbutton.webp' 
                                alt='delete'
                                width={12}
                                height={12}   
                              />
                            </button>
                          </>
                            :
                            // 수정상태일때
                            !myInfo && editingComment.active && editingComment.comment_srl === comment.comment_srl &&
                            <>
                              <button 
                                type='button' 
                                className='rep-edit-cancel'
                                onClick={onEditCommentCancel}  
                              >취소</button>
                              <span> / </span>
                              <button 
                                type='button' 
                                className='rep-edit-complete'
                                onClick={() => onEditCommentComplete()}
                              >수정완료</button>
                            </>
                          }
                          </>
                        }
                        </p>
                      </article>
                    ))}
                    <div className='paging'>
                      <Link type='button' 
                        className='arrow_btn double first' 
                        aria-label='arrow_btn_double_first' 
                        href={comments.page.currentPage !== 1 ? `/comment/1` : `#!`}
                        title={`방명록 첫 페이지로 이동`}
                      >
                        <i className='fa fa-angle-double-left'></i>
                      </Link>
                      <Link
                        type='button'
                        className='arrow_btn single prev'
                        aria-label='arrow_btn_single_prev'
                        href={comments.page.currentPage > 1 ? `/comment/${comments.page.currentPage - 1}` : `#!`}
                        id='pageBoardLeft'
                        title={`방명록 이전 페이지로 이동`}
                      >
                        <i className='fa fa-angle-left'></i>
                      </Link>
                      <div id='board_paging'>
                        {comments.page.totalPages && Array.from({ length: comments.page.totalPages }, (_, i) => i + 1).map((page) => (
                          <Link
                            href={`/comment/${page}`}
                            key={`commentsPaging${page}`}
                            className={`paging_btn ${comments?.page?.currentPage === page && 'active'}`}
                            aria-label={`paging_btn_${page}`}
                            title={`방명록 ${page} 페이지로 이동`}
                          >
                            <i className='fa'>{page}</i>
                          </Link>
                        ))}
                      </div>
                      <Link
                        type='button'
                        className='arrow_btn single next'
                        aria-label='arrow_btn_single_next'
                        href={comments.page.currentPage < comments.page.totalPages ? `/comment/${comments.page.currentPage + 1}` : `#!`}
                        id='pageBoardRight'
                        title={`방명록 다음 페이지로 이동`}
                      >
                        <i className='fa fa-angle-right'></i>
                      </Link>
                      <Link
                        type='button'
                        className='arrow_btn double last'
                        aria-label='arrow_btn_double_last'
                        href={comments.page.currentPage < comments.page.totalPages ? `/comment/${comments.page.totalPages}` : `#!`}
                        id='pageBoardRightDouble'
                        title={`방명록 마지막 페이지로 이동`}
                      >
                        <i className='fa fa-angle-double-right'></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

function ProfileImage ({ 
  user_id, 
  alt, 
  size = {
    width: 148,
    height: 148
  } , 
  className }: {user_id?:string | null, alt:string, size?: { width: number, height: number} , className?:string}) {

  const [imgSrc, setImgSrc] = useState(user_id ? `/images/file/members/${user_id}/profile.webp`: '/images/file/members/default-user2.webp')

  useEffect(() => {
    setImgSrc(user_id ? `/images/file/members/${user_id}/profile.webp` : `/images/file/members/default-user2.webp`)
  }, [user_id])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className && className}
      onError={() => setImgSrc('/images/file/members/default-user2.webp')}
      width={size.width}
      height={size.height}
      fetchPriority={'low'}
    />
  )
}