import HeadComponent from '@/components/HeadComponent'
import HeaderNoContent from '@/components/HeaderNoContent'
import axios from 'axios'
import { RowDataPacket } from 'mysql2'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Props } from 'next/script'
import { ParsedUrlQuery } from 'querystring'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pool from '../api/db/mysql'

import nextCookies from 'next-cookies'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { MyInfoAtom } from '@/store/CommonAtom'
import { useRecoilState } from 'recoil'

export const getServerSideProps: GetServerSideProps<Props> = async (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  try {
    const page = parseInt(ctx?.params?.page as string)
    const document_srl = 201
    const module_srl = 0
    const cookies = nextCookies(ctx)
    const token = cookies.accessToken
    let isAdmin = false
    let myInfo = null
    if (token) {
      try {
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET ?? ''
        const decoded = jwt.verify(token, secret)
        const cookieMyInfo = cookies.myInfo ?? null
        myInfo = cookieMyInfo ? atob(atob(cookieMyInfo)) : null // 디코딩된 사용자 정보
        isAdmin = myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID
      } catch (error) {
        console.error('JWT 검증 실패:', error)
      }
    }

    const commentsPageSize = 30
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

    const commentOffset = (totalCommentsPages - 1) * commentsPageSize

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
      module_srl: 0,
      document_srl,
    }
    return {
      props: {
        comments: JSON.parse(JSON.stringify(commentsData))
      }
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

export default function Comment ({comments}:{comments:any}) {
  const router = useRouter()
  const [myInfo, setMyInfo]:[(string | null), Function] = useRecoilState(MyInfoAtom)
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
    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/push`, data)
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
        const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete`, {
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
        const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete`, {
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
    const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/delete/force`, {
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
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/edit`, data)
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
    const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/board/${comments.module_srl}/document/${comments.document_srl}/comment/edit`, data)
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

  return (
    <>
      <HeadComponent
        title={'글루미스토어 - 프론트엔드 개발자 영 블로그'}
        description={'프론트엔드 개발자 영의 블로그입니다. 이 웹사이트의 모든 동작은 state binding으로 구현되어있습니다. 또한 이 웹사이트는 Next.js로 구현되어있습니다.'}
        keywords={'글루미스토어, 퍼블리셔, 프론트엔드, 개발자, FE, 웹퍼블리셔, HTML5, CSS3, ES6, Jquery, PHP, Photoshop'}
      />
      <div className='gl-wrap'>
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
                    <span className='today'>1</span>
                    <span> | </span>
                    <span>TOTAL</span>
                    <span>133546</span>
                  </p>
                </div>
                <div className='box'>
                  <button className='photo-area'>
                    <img src='/images/file/members/uptownboy7/profile.webp' alt='프로필 이미지' />
                  </button>
                  <article className='my-word-area'>
                    <h4>
                      <span>TODAY IS...</span>
                      <span className='icon'>ㅇ</span>
                      <span className='word'>우울</span>
                      </h4>
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
                <div className='box'>
                  <article className='comment-create-area'>
                    <div className='comment-create-area__main'>
                      <div className='minimi'>
                        <img src='/images/file/members/uptownboy7/profile.webp' alt='minimi' />
                      </div>
                      <div className='create-text'>
                        <textarea 
                          name='create-text' 
                        />
                      </div>
                    </div>
                    <div className='radio-area'>
                      <div>
                        <span>
                          <input type='radio' id='radio1' name='radio' />
                          <label htmlFor='radio1'>미니미</label>
                        </span>
                        <span>
                          <input type='radio' id='radio2' name='radio' />
                          <label htmlFor='radio2'>카드</label>
                        </span>
                      </div>
                      <button>확인</button>
                    </div>
                  </article>
                  <div className='comment-list-area'>
                    {comments?.content?.map((comment:any, idx:number) => (
                      <article key={comment.comment_srl} className={`comment-list ${comment.parent_srl !== 0 ? 'comment-rep' : ''}`}>
                        <div className='comment-title-area'>
                          <span className='comment-title-number'>NO. {comment.comment_srl}</span>
                          <span className='comment-title-name'>{comment.user_name}</span>
                          <Link href='/' target='_blank' className='home-icon'>
                            <img src={`/images/file/members/uptownboy7/profile.webp`} alt='homepage' />
                          </Link>
                          <span className='comment-title-date'>({moment(comment.regdate).format('YYYY.MM.DD HH:mm')})</span>
                        </div>
                        <div className='comment-content-area'>
                          <button>
                            <img src={comment.user_id ? `/images/file/members/${comment.user_id}/profile.webp` : '/images/file/members/default-user.png'} alt='minimi' />
                          </button>
                          
                            {editingComment.active && editingComment.comment_srl === comment.comment_srl ? (
                              <textarea
                                className='edit-area'
                                name='comment_form_txt'
                                cols={30}
                                rows={10}
                                placeholder='수정할 댓글을 남겨주세요!'
                                value={editingComment.new_content}
                                onChange={(e) => setEditingComment({ ...editingComment, new_content: e.currentTarget.value })}
                              />
                            ) : (
                              <p>
                              {comment.content}
                              </p>
                            )}
                          
                        </div>
                        <div className='comment-edit'>
                          {comment.status === 1 && (
                            <>
                              {comment.user_id ? (
                                <>
                                  {myInfo?.split('|')[1] === comment.user_id && !editingComment.active && (
                                    <p>
                                      <button type='button' onClick={() => onEditComment(comment)}>수정</button>
                                      <span> / </span>
                                      <button type='button' onClick={() => onDeleteComment(comment.comment_srl)}>삭제</button>
                                    </p>
                                  )}
                                  {myInfo?.split('|')[1] === comment.user_id && editingComment.active && (
                                    <p>
                                      <button type='button' onClick={onEditCommentCancel}>취소</button>
                                      <span> / </span>
                                      <button type='button' onClick={onEditCommentComplete}>수정완료</button>
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  {!myInfo && !editingComment.active && (
                                    <p>
                                      <button type='button' onClick={() => onEditComment(comment)}>수정</button>
                                      <span> / </span>
                                      <button type='button' onClick={() => onDeleteComment(comment.comment_srl)}>삭제</button>
                                    </p>
                                  )}
                                  {!myInfo && editingComment.active && editingComment.comment_srl === comment.comment_srl && (
                                    <p>
                                      <button type='button' onClick={onEditCommentCancel}>취소</button>
                                      <span> / </span>
                                      <button type='button' onClick={onEditCommentComplete}>수정완료</button>
                                    </p>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {comment.parent_srl === 0 && comment.status === 1 && !editingComment.active && (
                            <button type='button' onClick={() => onSetReplyData(comment.module_srl, comment.document_srl, comment.comment_srl)}>
                              답글
                            </button>
                          )}
                          {myInfo?.split('|')[1] === process.env.NEXT_PUBLIC_ADMIN_ID && (
                            <p style={{ display: 'block' }}>
                              <button type='button' onClick={() => onCompletelyDeleteComment(comment)}>
                                완전삭제
                              </button>
                            </p>
                          )}
                        </div>
                        {replyData.active && replyData.parent_srl === comment.comment_srl && (
                          <div className='rep-wrap'>
                            <form className='comment_form_rep'>
                              <div className='rep'>
                                <img src='/images/icon/arrow-rep.png' alt='arrow' />
                              </div>
                              <div className='comment_form_rep_textarea'>
                                <div className='comment_form_name'>
                                  <div>
                                    <input
                                      type='text'
                                      name='comment_name'
                                      placeholder='이름'
                                      maxLength={15}
                                      disabled={!!myInfo}
                                      value={replyData.user_name}
                                      onChange={(e) => setReplyId(e.currentTarget.value)}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type='password'
                                      name='rep_rep_pass'
                                      placeholder='비밀번호'
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
                                  cols={30}
                                  rows={10}
                                  placeholder='댓글을 남겨주세요!'
                                  value={replyData.content}
                                  onChange={(e) => changeReplyTextValue(e.currentTarget.value)}
                                ></textarea>
                                <div className='comment_btns'>
                                  <input
                                    type='checkbox'
                                    className='check_secret'
                                    id={`check_secret_${idx}`}
                                    onChange={(e) => changeReplySecret(comment.comment_srl, e.currentTarget.checked)}
                                  />
                                  <label htmlFor={`check_secret_${idx}`}>비밀 댓글</label>
                                  <button type='button' onClick={submitReply}>작성</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                      </article>
                    ))}
                    <div className='paging'>
                      <button type='button' className='arrow_btn double first' aria-label='arrow_btn_double_first' onClick={() => clickCommentPage(1)}>
                        <i className='fa fa-angle-double-left'></i>
                      </button>
                      <button
                        type='button'
                        className='arrow_btn single prev'
                        aria-label='arrow_btn_single_prev'
                        onClick={() => {
                          if (currentCommentPage > 1) {
                            clickCommentPage(currentCommentPage - 1);
                          }
                        }}
                        id='pageBoardLeft'
                      >
                        <i className='fa fa-angle-left'></i>
                      </button>
                      <div id='board_paging'>
                        {comments.page.totalPages && Array.from({ length: comments.page.totalPages }, (_, i) => i + 1).map((page) => (
                          <Link
                            href={`/comment/${page}`}
                            key={`commentsPaging${page}`}
                            type='button'
                            className={`paging_btn ${comments.currentPage === currentCommentPage ? 'active' : ''}`}
                            aria-label={`paging_btn_${page}`}
                            // onClick={() => clickCommentPage(page)}
                          >
                            <i className='fa'>{page}</i>
                          </Link>
                        ))}
                      </div>
                      <button
                        type='button'
                        className='arrow_btn single next'
                        aria-label='arrow_btn_single_next'
                        onClick={() => {
                          if (currentCommentPage < comments.page.totalPages) {
                            clickCommentPage(currentCommentPage + 1);
                          }
                        }}
                        id='pageBoardRight'
                      >
                        <i className='fa fa-angle-right'></i>
                      </button>
                      <button
                        type='button'
                        className='arrow_btn double last'
                        aria-label='arrow_btn_double_last'
                        onClick={() => clickCommentPage(comments.page.totalPages)}
                        id='pageBoardRightDouble'
                      >
                        <i className='fa fa-angle-double-right'></i>
                      </button>
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