// style
import styles from '@/styles/module/Home.module.scss'
import stylesBoard from '@/styles/module/Board.module.scss'

// module
import { useRecoilState } from 'recoil';
import { IsAdminAtom, LoadAtom, MyInfoAtom, ProfileModalActiveAtom, ProfileModalAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import HeadComponent from '@/pages/components/HeadComponent';
import Loading from '@/pages/components/Loading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios'

import Header from '@/pages/components/Header'
import pool from './api/db/mysql';
import { RowDataPacket } from 'mysql2';
import Link from 'next/link';
import { strip_tags } from '@/utils/common';
import Image from 'next/image';
import API from './api';

export const getServerSideProps = async () => {
  try {
    const page = 1
    const pageSize = 9
    const offset = (page - 1) * pageSize
    const likersPageSize = 40;
    const commentsPageSize = 30;
    
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
      WHERE module_srl IN (214, 52)
      ORDER BY regdate DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)

    // 콘텐츠의 길이를 200자로 제한하는 함수
    const limit200 = (str: string) => {
      return str.slice(0, 200);
    };

    // 각 콘텐츠의 태그를 제거하고 길이를 제한합니다.
    const rows = documentRows.map((e: any) => ({ ...e, content: limit200(strip_tags(e.content)) }));

    // 총 문서 수를 계산합니다.
    const [totalRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM xe_documents
      WHERE module_srl IN (214, 52)
    `);
    const totalCount = totalRows[0].total;

    // 총 페이지 수를 계산합니다.
    const totalPages = Math.ceil(totalCount / pageSize);

    // youngetable에서 likers 데이터를 가져옵니다.
    const [likersRows] = await pool.query<RowDataPacket[]>(`
      SELECT liker_id, liker_name, liker_like, liker_reg
      FROM youngetable
      WHERE liker_like = 1
      ORDER BY liker_reg DESC
      LIMIT ${likersPageSize} OFFSET ${offset}
    `);

    const likers = likersRows.map((liker: any) => ({
      liker_id: liker.liker_id,
      liker_name: liker.liker_name,
      liker_like: liker.liker_like,
      liker_reg: liker.liker_reg,
    }));

    // 총 likers 수를 계산합니다.
    const [totalLikersRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM youngetable
    `);
    const totalLikersCount = totalLikersRows[0].total;

    // 총 페이지 수를 계산합니다.
    const totalLikersPages = Math.ceil(totalLikersCount / likersPageSize);

    // comments를 가져옵니다.
    const [commentsRows] = await pool.query<RowDataPacket[]>(`
      SELECT *
      FROM xe_comments
      WHERE document_srl IN (201)
      ORDER BY regdate DESC
      LIMIT ${commentsPageSize} OFFSET ${offset}
    `);

    const comments = commentsRows.map((comment: any) => ({
      comment_srl: comment.comment_srl,
      module_srl: comment.module_srl,
      document_srl: comment.document_srl,
      parent_srl: comment.parent_srl,
      is_secret: comment.is_secret,
      content: comment.content,
      voted_count: comment.voted_count,
      blamed_count: comment.blamed_count,
      notify_message: comment.notify_message,
      password: comment.password,
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
    }));

    // 총 comments 수를 계산합니다.
    const totalCommentsCount = commentsRows.length;

    // comments의 페이지 수를 계산합니다.
    const totalCommentsPages = Math.ceil(totalCommentsCount / commentsPageSize);

    // datas 객체를 구성합니다.
    const datas = {
      documents: {
        content: rows,
        page: {
          currentPage: 1,
          totalPages,
        },
      },
      likers: {
        content: likers,
        page: {
          currentPage: 1,
          totalPages: totalLikersPages,
        },
      },
      comments: {
        content: comments,
        page: {
          currentPage: 1,
          totalPages: totalCommentsPages,
          totalCount: totalCommentsCount,
        },
      },
    };

    return {
      props: {
        datas: JSON.parse(JSON.stringify(datas)),
      },
    }
  } catch(er) {
    console.log(er)
    return {
      props: {
        datas: {
          documents: {
            content: [],
            page: {
              currentPage: 1,
              totalPages :1,
            },
          },
          likers: {
            content: [],
            page: {
              currentPage: 1,
              totalPages: 1,
            },
          },
          comments: {
            content: [],
            page: {
              currentPage: 1,
              totalPages: 1,
              totalCount: 0
            },
          },
        }
      }
    }
  }
}

export default function Home({
  datas = {
    documents: {
      data: [],
      page: {
        currentPage: 0,
        totalPages: 0
      },
    },
    likers: {
      content: [],
      page: {
        currentPage: 1,
        totalPages: 1,
      },
    },
    comments: {
      content: [],
      page: {
        currentPage: 1,
        totalPages: 1,
      },
    },
  }
}:{datas:any}) {

  // store
  const [myInfo, setMyInfo]:[(string | null), Function] = useRecoilState(MyInfoAtom)
  const [isAdmin, setIsAdmin] = useRecoilState(IsAdminAtom)

  // 로딩
  const [scrollBlock, setScrollBlock] = useRecoilState(ScrollBlockAtom);
  const [load, setLoad] = useRecoilState(LoadAtom)
  const [isLoad, setIsLoad] = useState(false)
  const [isContentLoad, setIsContentLoad] = useState(false)
  const loadWord = useMemo(() => '로딩중', [])

  const [Document, setDocument] = useState(datas.documents)

  const [currentPage, setCurrentPage] = useState(1)
  const [paging, setPaging] = useState([1])
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (Document?.page?.totalPages > 0) {
      const totalPages = Document.page.totalPages;
      let startPage = Math.max(1, currentPage - 3);
      let endPage = Math.min(totalPages, currentPage + 3);
  
      if (currentPage <= 4) {
        startPage = 1;
        endPage = Math.min(10, totalPages);
      } else if (currentPage > totalPages - 6) {
        startPage = Math.max(totalPages - 9, 1);
        endPage = totalPages;
      }
  
      const newPaging = [];
      for (let i = startPage; i <= endPage; i++) {
        newPaging.push(i);
      }
      setPaging(newPaging);
    }
  }, [Document, currentPage])
  const changePage = useCallback((page:number) => {
    if(!hydrated) setHydrated(true)
    setCurrentPage(page)
  }, [currentPage])
  useEffect(() => {
    if(!titleRef.current) return
    getBoardData(currentPage)
    titleRef.current.scrollIntoView()
  }, [currentPage])
  const getBoardData = useCallback(async(page:number) => {
    try {
      console.log('page', page)
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/board/all/${page}`)
      console.log('res', res.data)
      if(res.status === 200) {
        setDocument(res.data)
      } else throw new Error('network failed')
    } catch(err) {
      console.log(err)
      setDocument(datas.documents)
    }
  }, [])

  const titleRef = useRef<HTMLHeadingElement>(null)

  // liker data
  const [likers, setLikers] = useState(datas.likers)
  const [currentLikerPage, setCurrentLikerPage] = useState(1)
  const [likerPaging, setLikerPaging]:[number[], Function] = useState([1])
  const [likerRandomKey, setLikerRandomKey] = useState(0)
  useEffect(() => {
    if (likers.page.totalPages > 0) {
      const totalPages = likers.page.totalPages;
      let startPage = Math.max(1, currentLikerPage - 3);
      let endPage = Math.min(totalPages, currentLikerPage + 3);
  
      if (currentLikerPage <= 4) {
        startPage = 1;
        endPage = Math.min(10, totalPages);
      } else if (currentLikerPage > totalPages - 6) {
        startPage = Math.max(totalPages - 9, 1);
        endPage = totalPages;
      }
  
      const newPaging = [];
      for (let i = startPage; i <= endPage; i++) {
        newPaging.push(i);
      }
      setLikerPaging(newPaging);
    }
  }, [likers, currentLikerPage])
  const changeLikerPage = useCallback((page:number) => {
    if(!hydrated) setHydrated(true)
    setLikerRandomKey(Math.random())
    setCurrentLikerPage(page)
  }, [likerRandomKey, currentLikerPage])

  const likerTitleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if(!likerTitleRef.current || likerRandomKey === 0) return
    getLikerData(currentLikerPage)
    likerTitleRef.current.scrollIntoView()
  }, [likerRandomKey, currentLikerPage])
  const getLikerData = useCallback(async(page?:number) => {
    try {
      if(!page) page = 1
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/liker/${page}`)
      if(res.status === 200) {
        setLikers(res.data)
      } else throw new Error('network failed')
    } catch(err) {
      console.log(err)
      setDocument(datas.likers)
    }
  }, [likerRandomKey])

  const onLikeButton = useCallback(async() => {
    if(!myInfo) return alert('로그인 한 유저만 가능합니다')
    try {
      const idData = {
        id: (myInfo as string).split('|')[1]
      }
      // 내 아이디에 대한 종합정보 가져오기
      const profileRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/common/getProfile`, idData)
      const { data } = profileRes
      // 좋아요 누르기
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/liker/push`, {
        liker_id: data.BOR_mem_id,
        liker_name: data.BOR_mem_name,
      })
      if(res.data.liker_like === 1) {
        alert('좋아요를 눌렀습니다')
      } else if(res.data.liker_like === 0) {
        alert('좋아요를 취소했습니다')
      }
      changeLikerPage(1)
  } catch(err:any) {
    console.log(err)
    if(err?.response?.data?.message) {
      alert(err?.response?.data?.message)
    }
  }
  }, [myInfo])

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

  // comment data 
  const [comments, setComments] = useState(datas.comments)
  const [currentCommentPage, setCurrentCommentPage] = useState(1)
  const [commentPaging, setCommentPaging]:[number[], Function] = useState([1])
  const [commandPageRandomKey, setCommandPageRandomKey] = useState(0)
  useEffect(() => {
    if (comments.page.totalPages > 0) {
      const totalPages = comments.page.totalPages;
      let startPage = Math.max(1, currentCommentPage - 3);
      let endPage = Math.min(totalPages, currentCommentPage + 3);
  
      if (currentCommentPage <= 4) {
        startPage = 1;
        endPage = Math.min(10, totalPages);
      } else if (currentCommentPage > totalPages - 6) {
        startPage = Math.max(totalPages - 9, 1);
        endPage = totalPages;
      }
  
      const newPaging = [];
      for (let i = startPage; i <= endPage; i++) {
        newPaging.push(i);
      }
      setCommentPaging(newPaging);
    }
  }, [comments, currentCommentPage])
  const changeCommentPage = useCallback((page:number) => {
    if(!hydrated) setHydrated(true)
    console.log(page)
    setCurrentCommentPage(page)
    setCommandPageRandomKey(Math.random())
  }, [currentCommentPage])

  const commentTitleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if(!commentTitleRef.current || commandPageRandomKey === 0) return
    getCommentData(currentCommentPage)
    commentTitleRef.current.scrollIntoView()
  }, [commandPageRandomKey, currentCommentPage])
  const getCommentData = useCallback(async(page:number) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/board/0/document/201/comment/${page}`)
      if(res.status === 200) {
        console.log(res.data)
        setComments(res.data)
      } else throw new Error('network failed')
    } catch(err) {
      console.log(err)
      setComments(datas.comments)
    }
  }, [])

  // 답글
  const initialRepData = useMemo(() => ({
    active: false,
    module_srl: 0,
    document_srl: 0,
    parent_srl: 0,
    comment_srl: 0,
    user_name: '',
    user_id: '',
    content: '',
    is_secret: false,
    voted_count: 0,
    blamed_count: 0,
    notify_message: '',
    password: '',
    member_srl: '',
    email_address: '',
    homepage: '',
    uploaded_count: '',
    last_update: '',
    regdate: '',
    ipaddress: '',
    list_order: '',
    status: 1,
  }), [])
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
  }, [replyData.parent_srl])

  const [replyId, setReplyId] = useState('')
  const [replyPw, setReplyPw] = useState('')
  useEffect(() => {
    if(myInfo) {
      setReplyId((myInfo as string).split('|')[1])
    } else setReplyId('')
  }, [myInfo])

  const changeReplySecret = useCallback((comment_srl:number, is_secret:boolean) => {
    const data = {...replyData, parent_srl: comment_srl, is_secret}
    setReplyData(data)
  }, [replyData, replyData.active])

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
    member_srl: myInfo ? myInfo.split('|')[0] : '',
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
      member_srl: myInfo ? myInfo.split('|')[0] : '',
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
      const ip = await axios.get('https://blog.gloomy-store.com/getIp.php')
      data.ipaddress = ip.data
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/board/0/document/201/comment/push`, data)
      if(res.status === 200 || res.status === 201) {
        console.log(res.data)
        changeCommentPage(1)
      } else throw new Error('network failed')
    } catch (err) {
      console.log(err)
      alert('실패 했습니다.')
    }
  }, [commentData])

  return (
    <>
      <HeadComponent
      title={'글루미스토어 - 프론트엔드 개발자 영 블로그'}
      description={'프론트엔드 개발자 영의 블로그입니다. 이 웹사이트의 모든 동작은 state binding으로 구현되어있습니다. 또한 이 웹사이트는 Next.js로 구현되어있습니다.'}
      keywords={'글루미스토어, 퍼블리셔, 프론트엔드, 개발자, FE, 웹퍼블리셔, HTML5, CSS3, ES6, Jquery, PHP, Photoshop'}
      />
      {isLoad && <Loading
        isLoad={isLoad}
        isContentLoad={isContentLoad}
        loadWord={loadWord}
       />
      }
      <div className='gl-wrap'>
        <div className='gl-wrap__inner'>
          <Header />
          <main className='gl-card-list'>
            <div className='gallery_wrap' itemScope itemType='https://schema.org/CreativeWork'>
              <div>
                <h1 className='invisible'>글루미스토어 - 프론트엔드 개발자 블로그 </h1>
                <h2 className='title02 deco' itemProp='title' id='title' ref={titleRef}>
                  <Link href='/#title'>
                    my <span className='t-beige'>Blog</span>!
                  </Link>
                </h2>
              </div>
              <div className='gallery' id='gallery'>
                {
                !hydrated &&
                datas?.documents?.content?.map((item:any, idx:number) => (
                  <div key={idx + 'card' + item.id} className='card_wrapper js-fadeIn' itemProp='workExample'>
                    <Link
                      href={`/board/all/document/${item.document_srl}`}
                      title={item.title}
                      className='card'
                    >
                      <p className='thumbnail'>
                        <img
                          src={item.thumb && item.thumb !== 'null' ? `/images/file/board/${item.document_srl}/thumb.${item.thumb} ` : '/images/header2_3.webp'}
                          alt='thumbnail'
                          onError={(e) => (e.currentTarget.src = '/images/header2_3.webp')}
                        />
                      </p>
                      <div className='script'>
                        {/* <p className='module'>
                          <span>{item.module}</span>
                        </p> */}
                        <p className='title' itemProp='about'>
                          {item.title}
                        </p>
                        <p className='text'>
                          {strip_tags(item.content)}
                        </p>
                        <p className='date' itemProp='datePublished'>
                          <span>{item.regdate}</span>
                        </p>
                      </div>
                    </Link>
                    <Link href={`/board/${item.module_srl}/page/1#title`} title='게시판으로' className='module_float'>
                      {item.module_srl === 52 ? 'development' : 'daily'}
                    </Link>
                  </div>
                ))
                }
                {
                  hydrated &&
                Document && Document?.content?.length && Document?.content?.map((item:any, idx:number) => (
                  <div key={idx + 'card' + item.id} className='card_wrapper js-fadeIn' itemProp='workExample'>
                    <Link
                      href={`/board/all/document/${item.document_srl}`}
                      title={item.title}
                      className='card'
                    >
                      <p className='thumbnail'>
                        <img
                          src={item.thumb && item.thumb !== 'null' ? `/images/file/board/${item.document_srl}/thumb.${item.thumb} ` : '/images/header2_3.webp'}
                          alt='thumbnail'
                          onError={(e) => (e.currentTarget.src = '/images/header2_3.webp')}
                        />
                      </p>
                      <div className='script'>
                        {/* <p className='module'>
                          <span>{item.module}</span>
                        </p> */}
                        <p className='title' itemProp='about'>
                          {item.title}
                        </p>
                        <p className='text'>
                          {strip_tags(item.content)}
                        </p>
                        <p className='date' itemProp='datePublished'>
                          <span>{item.regdate}</span>
                        </p>
                      </div>
                    </Link>
                    <Link href={`/board/${item.module_srl}/page/1#title`} title='게시판으로' className='module_float'>
                      {item.module_srl === 52 ? 'development' : 'daily'}
                    </Link>
                  </div>
                ))
                }
              </div>
              <div className='paging'>
                <button
                  type='button'
                  className='arrow_btn double first'
                  aria-label='arrow_btn_double_first'
                  onClick={() => changePage(1)}
                >
                  <i className='fa fa-angle-double-left'></i>
                </button>
                <button
                  type='button'
                  className='arrow_btn single prev'
                  aria-label='arrow_btn_single_prev'
                  onClick={() => {
                    if(currentPage > 1) {
                      changePage(currentPage - 1)
                    }
                  }}
                  id='pageBoardLeft'
                >
                  <i className='fa fa-angle-left'></i>
                </button>
                <div id='board_paging'>
                  {paging?.length && paging?.map((page) => (
                    <button
                      key={'paging' + page}
                      type='button'
                      className={`paging_btn ${page === currentPage && 'active'}`}
                      aria-label={`paging_btn_${page}`}
                      onClick={() => changePage(page)}
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
                    if(currentPage < Document.page.totalPages) {
                      changePage(currentPage + 1)
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
                  onClick={() => changePage(Document.page.totalPages)}
                  id='pageBoardRightDouble'
                >
                  <i className='fa fa-angle-double-right'></i>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <section className={styles['section-flower']}>
        <div className={styles['text-area']}>
          <h4> I Can Do This </h4>
          <h5 className={`${styles['h5']}`}>Web Development</h5>
          <p>이 블로그는 <span>개인서버</span>로 배포되고 있습니다.</p>
          <div className={styles['cans']}>
            <div className={styles['can']}><span></span>
              <p>기획 - 디자인 - 프론트엔드 - 백엔드 <br className='onlySP'/>- 서버 도메인 - 서비스</p>
            </div>
            <div className={`${styles['can']} ${styles['right']}`}><span></span>
              <p>PPT - Ps(Xd) - React - PHP,mySQL - NAS</p>
            </div>
          </div>
        </div>
        <div className={styles['motion-area']}>
          <svg version='1.1' className={`${styles['flower_small']} ${styles['flower1_1']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='80px' height='80px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          <svg version='1.1' className={`${styles['flower_small']} ${styles['flower2_2']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='80px' height='80px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          <svg version='1.1' className={`${styles['flower_small']} ${styles['flower3']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='80px' height='80px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>


          <svg version='1.1' className={`${styles['flower_small']} ${styles['flower1_2']} onlyPC`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='80px' height='80px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>

          <svg version='1.1' className={`${styles['flower_small']} ${styles['flower1_3']} onlyPC`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='80px' height='80px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          {/* <!-- //작은 꽃 --> */}

          {/* <!-- 큰 꽃 --> */}
          <svg version='1.1' className={`${styles['flower_mid']} ${styles['flower4']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='120px' height='120px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          <svg version='1.1' className={`${styles['flower_mid']} ${styles['flower5']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='120px' height='120px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          {/* <!-- //큰 꽃 --> */}

          {/* <!-- 존나 큰 꽃 --> */}
          <svg version='1.1' className={`${styles['flower_mid']} ${styles['flower6']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='590px' height='590px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          <svg version='1.1' className={`${styles['flower_mid']} ${styles['flower7']}`} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='300px' height='300px' viewBox='0 0 50 50' enableBackground='new 0 0 50 50' xmlSpace='preserve'>
            <path fill='#ffffff' d='M16.758,49.942c-6.39,0-11.587-5.011-11.587-11.17c0-1.83,0.473-3.635,1.375-5.256c-4.059-1.84-6.65-5.746-6.65-10.103
                  c0-6.159,5.198-11.169,11.586-11.169c0.645,0,1.304,0.057,1.969,0.171c-0.05-0.411-0.074-0.804-0.074-1.189
                  c0-6.159,5.199-11.169,11.587-11.169c6.389,0,11.586,5.01,11.586,11.169c0,0.391-0.024,0.788-0.074,1.202
                  c0.689-0.123,1.376-0.184,2.041-0.184c6.39,0,11.586,5.011,11.586,11.169c0,4.137-2.417,7.956-6.202,9.879
                  c0.853,1.585,1.3,3.345,1.3,5.123c0,6.158-5.196,11.17-11.585,11.17c-3.101,0-6.074-1.213-8.25-3.345
                  C23.167,48.6,20.063,49.942,16.758,49.942z M11.482,13.247c-5.815,0-10.547,4.561-10.547,10.167c0,4.14,2.569,7.83,6.545,9.404
                  c0.14,0.056,0.249,0.168,0.296,0.307c0.048,0.139,0.03,0.29-0.048,0.416c-0.993,1.588-1.518,3.396-1.518,5.231
                  c0,5.606,4.732,10.168,10.548,10.168c3.188,0,6.172-1.372,8.188-3.766c0.096-0.114,0.239-0.183,0.392-0.186
                  c0.142,0,0.298,0.059,0.4,0.168c2.006,2.178,4.878,3.427,7.878,3.427c5.815,0,10.546-4.563,10.546-10.168
                  c0-1.778-0.492-3.538-1.425-5.088c-0.074-0.121-0.092-0.267-0.048-0.401c0.045-0.134,0.145-0.244,0.276-0.304
                  c3.706-1.666,6.1-5.282,6.1-9.209c0-5.607-4.732-10.167-10.548-10.167c-0.822,0-1.678,0.104-2.538,0.31
                  c-0.173,0.041-0.35-0.004-0.479-0.12c-0.13-0.115-0.188-0.285-0.158-0.452c0.114-0.628,0.168-1.203,0.168-1.757
                  c0-5.607-4.731-10.167-10.546-10.167c-5.815,0-10.547,4.56-10.547,10.167c0,0.548,0.054,1.117,0.166,1.74
                  c0.03,0.166-0.029,0.335-0.156,0.45c-0.129,0.115-0.307,0.162-0.477,0.122C13.114,13.345,12.283,13.247,11.482,13.247z'></path>
          </svg>
          {/* <!-- //존나 큰꽃 --> */}
        </div>
      </section>
      <section className={styles['section-liker']}>
        <div className='pt-0'>
          <div>
            <div className={styles['section-liker__title']}>
              <h2 className={`${styles['title-02']} ${styles.deco}`} itemProp='title' ref={likerTitleRef} id='liker_section'>
                <button type='button'>
                  이 블로그를 <br className='onlySP' /><span>좋아하는</span> 사람들
                </button>
              </h2>
            </div>
            <div className={styles.likers}>
              <div className={styles.likers_inner} id='likers_inner'>
                {
                  likerRandomKey === 0 ?
                  datas?.likers?.content.map((item:any, idx:number) => (
                    <button type='button' title={'아이디: ' + item.liker_id + '이름: ' + item.liker_name + '날짜: ' + item.liker_reg} onClick={() => profileView(item.liker_id)} className={styles.mini_profile_wrapper} key={'likers' + idx}>
                      {/* <img src={item.liker_id} alt={item.liker_id + 'Profile Photo'} className={styles.mini_profile} /> */}
                      <MiniProfileImage 
                        user_id={item.liker_id} 
                        alt={item.liker_id + 'Profile Photo'} 
                        className={styles.mini_profile}  
                      />
                    </button>
                  ))
                  :
                  likers?.content?.map((item:any, idx:number) => (
                    <button type='button' title={'아이디: ' + item.liker_id + '이름: ' + item.liker_name + '날짜: ' + item.liker_reg} onClick={() => profileView(item.liker_id)} className={styles.mini_profile_wrapper} key={'likers' + idx}>
                        <MiniProfileImage 
                          user_id={item.liker_id} 
                          alt={item.liker_id + 'Profile Photo'} 
                          className={styles.mini_profile}  
                        />
                      
                      {/* <img src={item.liker_id} alt={item.liker_id + 'Profile Photo'} className={styles.mini_profile} /> */}
                    </button>
                  ))
                }
              </div>
              <div className='paging'>
                <button
                  type='button'
                  className='arrow_btn double first'
                  aria-label='arrow_btn_double_first'
                  onClick={() => changeLikerPage(1)}
                >
                  <i className='fa fa-angle-double-left'></i>
                </button>
                <button
                  type='button'
                  className='arrow_btn single prev'
                  aria-label='arrow_btn_single_prev'
                  onClick={() => {
                    if(currentLikerPage > 1) {
                      changeLikerPage(currentLikerPage - 1)
                    }
                  }}
                  id='pageBoardLeft'
                >
                  <i className='fa fa-angle-left'></i>
                </button>
                <div id='board_paging'>
                  {likerPaging?.length && likerPaging?.map((page) => (
                    <button
                      key={'likerPaging' + page}
                      type='button'
                      className={`paging_btn ${page === currentLikerPage && 'active'}`}
                      aria-label={`paging_btn_${page}`}
                      onClick={() => changeLikerPage(page)}
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
                    if(currentLikerPage < likers.page.totalPages) {
                      changeLikerPage(currentLikerPage + 1)
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
                  onClick={() => changeLikerPage(likers.page.totalPages)}
                  id='pageBoardRightDouble'
                >
                  <i className='fa fa-angle-double-right'></i>
                </button>
              </div>
              <article className={styles['like_btns']}>
                <button className={styles['like_btn']} id='like_btn' type='button' onClick={onLikeButton}>
                  <img src='/images/icon/figma.png' alt='figma' />
                </button>
                <p>
                  <label htmlFor='like_btn' className={styles['like_btn_label']}>
                    나도 좋아요 누르기
                  </label>
                  <img
                    src='/images/icon/info.png'
                    className={styles['info']}
                    alt='회원가입을 하고 좋아요를 누를 수 있습니다'
                    title='회원가입을 하고 좋아요를 누를 수 있습니다'
                    onClick={() => alert('회원가입을 하고 좋아요를 누를 수 있습니다')}
                  />
                </p>
              </article>
            </div>
          </div>
        </div>
        <article className={styles['section-comment']}>
          <div className='gallery_wrap gallery_wrap--board' itemScope={true} itemType='https://schema.org/CreativeWork'>
            <div className={`${stylesBoard['content_wrap']} mt-0`}>
              <div className={stylesBoard['comment']} id='comment'>
                <div className={stylesBoard['comment_inner']} id='comment_inner'>
                  <h3 className={stylesBoard['comment_total']} ref={commentTitleRef}>댓글: <span id='comment_total_num'>{datas?.comments?.page?.totalCount}</span></h3>
                  <div className={stylesBoard['comment_list_wrapper']} id='comment_list_wrapper'>
                    {
                      [commandPageRandomKey === 0 ? datas.comments?.content : comments?.content].map(e => (
                        e.map((comment:any, idx:number) => (
                          <div className={stylesBoard['comment_list_wrap']} key={'comment' + idx}>
                            <div className={stylesBoard['comment_list']}>
                              <div className={stylesBoard['comment_photo']}>
                                
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
  
                              <div className={stylesBoard['comment_text_wrap']}>
                                <div className={stylesBoard['comment_name']}>
                                  <a href='#!'>
                                    <span>
                                      {
                                        comment.user_id === 'uptownboy7' && <b className='black t-purple'>[운영자] </b>
                                      }  
                                    </span>
                                    {comment.user_name}
                                  </a>
                                  <p>{comment.regdate}</p>
                                </div>
                                
                                <div className={stylesBoard['comment_text']}>{comment.content}</div>
                                  <div className={stylesBoard['comment_edit']}>
                                    {
                                      load && <>
                                      {
                                      // 로그인 한 댓글
                                        comment.user_id ? <>
                                          {
                                            // 로그인 한 댓글인데, 나도 로그인 했고, 내가 댓글의 주인일 때
                                            myInfo &&
                                            (myInfo as string).split('|')[1] === comment.user_id && <p>
                                            <button type='button' className={stylesBoard['onRep']}>수정</button>
                                            <span> / </span>
                                            <button type='button' className={stylesBoard['onRep']}>삭제</button>
                                          </p>
                                          }
                                        </>
                                        :
                                        <>
                                        {
                                          // 로그인 안 한 댓글인데, 나도 로그인 안했을 때
                                          !myInfo && <p>
                                            <button type='button' className={stylesBoard['onRep']}>수정</button>
                                            <span> / </span>
                                            <button type='button' className={stylesBoard['onRep']}>삭제</button>
                                          </p>
                                        }
                                        </>
                                      }
                                    </>
                                  }
                                  {/* <p>
                                    <button className={stylesBoard['onRep']}>수정</button>
                                    <span> / </span>
                                    <button className={stylesBoard['onRep']}>삭제</button>
                                  </p>
                                  <button className={stylesBoard['onRep']}>답글</button> */}
                                  <button 
                                    type='button'
                                    className={stylesBoard['onRep']}
                                    onClick={() => onSetReplyData(comment.module_srl, comment.document_srl, comment.comment_srl)}  
                                  >
                                    답글
                                  </button>
                                </div>
                              </div>
                            </div>
                            {
                            // 답글 달기가 활성화 상태라면
                            replyData.active && replyData.parent_srl === comment.comment_srl &&
                              <div className={stylesBoard['rep-wrap']}>
                                <form className={stylesBoard['comment_form_rep']}>
                                  <div className={stylesBoard['rep']}>
                                    <img src='/images/icon/arrow-rep.png' alt='arrow' />
                                  </div>
                                  <div className={stylesBoard['comment_form_rep_textarea']}>
                                    <div className={stylesBoard['comment_form_name']}>
                                      <div>
                                        <input 
                                          type='text' 
                                          name='comment_name' placeholder='이름' 
                                          maxLength={15}
                                          disabled={!!myInfo} 
                                          value={replyId}
                                          onChange={(e) => setReplyId(e.currentTarget.value)}
                                        />
                                      </div>
                                      <div>
                                        <input 
                                          type='password' name='rep_rep_pass' placeholder='비밀번호' 
                                          maxLength={15} 
                                          autoComplete='off' 
                                          value={replyPw}
                                          disabled={!!myInfo}
                                          onChange={(e) => setReplyPw(e.currentTarget.value)}
                                        />
                                      </div>
                                      <input type='hidden' name='document_srl' value='201' readOnly tabIndex={-1} className={stylesBoard['invisible']} />
                                      <input type='hidden' name='module_srl' value='50' readOnly tabIndex={-1} className={stylesBoard['invisible']} />
                                      <input type='hidden' name='parent_srl' value='325' readOnly tabIndex={-1} className={stylesBoard['invisible']} />
                                    </div>
                                    <textarea name='comment_form_txt' className={stylesBoard['comment_form_text']} cols={30} rows={10} placeholder='댓글을 남겨주세요!' required></textarea>
                                    <div className={stylesBoard['comment_btns']}>
                                      <input 
                                        type='checkbox' 
                                        className={stylesBoard['check_secret']} 
                                        id={'check_secret_' + idx} 
                                        onChange={(e) => changeReplySecret(comment.comment_srl, e.currentTarget.checked)}  
                                      />
                                      <label htmlFor={'check_secret_' + idx}>
                                        비밀 댓글
                                      </label>
                                      <button type='button' className={stylesBoard['submit-button']}>작성</button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            }
                        </div>
                        ))
                      ))
                    }
                  </div>
                  <div className='paging'>
                    <button
                      type='button'
                      className='arrow_btn double first'
                      aria-label='arrow_btn_double_first'
                      onClick={() => changeCommentPage(1)}
                    >
                      <i className='fa fa-angle-double-left'></i>
                    </button>
                    <button
                      type='button'
                      className='arrow_btn single prev'
                      aria-label='arrow_btn_single_prev'
                      onClick={() => {
                        if(currentCommentPage > 1) {
                          changeCommentPage(currentCommentPage - 1)
                        }
                      }}
                      id='pageBoardLeft'
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
                          onClick={() => changeCommentPage(page)}
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
                          changeCommentPage(currentCommentPage + 1)
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
                      onClick={() => changeCommentPage(comments.page.totalPages)}
                      id='pageBoardRightDouble'
                    >
                      <i className='fa fa-angle-double-right'></i>
                    </button>
                  </div>
                  <form name='comment_form' id='comment_form' className={stylesBoard['comment_form']} data-gtm-form-interact-id='0'>
                    {
                      load && <div className={stylesBoard['comment_form_rep_textarea']}>
                      <div id='comment_form_name' className={stylesBoard['comment_form_name']}>
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
                        {/* 스팸 방지문구 영역은 주석 처리합니다 */}
                        <input type='hidden' name='document_srl' value='1027' readOnly={true} tabIndex={-1} className={stylesBoard['invisible']} />
                        <input type='hidden' name='module_srl' value='52' readOnly={true} tabIndex={-1} className={stylesBoard['invisible']} />
                      </div>
                      <textarea 
                        name='comment_form_text' 
                        className={stylesBoard['comment_form_text']} 
                        cols={30} 
                        rows={10} 
                        placeholder='댓글을 남겨주세요!' 
                        onChange={(e) => changeCommentValue(e.currentTarget.value)}
                        required={true} 
                      />
                      <div className={stylesBoard['comment_btns']}>
                        <input 
                          type='checkbox' 
                          className={stylesBoard['check_secret']} 
                          name='check_secret' 
                          id='check_secret'
                          onChange={(e) => changeCommentSecret(e.currentTarget.checked)} 
                        />
                        <label htmlFor='check_secret'>비밀 댓글</label>
                        <button 
                          type='button' 
                          className={stylesBoard['submit-button']}
                          onClick={submitComment}
                        >작성</button>
                      </div>
                    </div>
                    }
                  </form>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

export function MiniProfileImage ({ 
  user_id, 
  alt, 
  size = {
    width: 60,
    height: 60
  } , 
  className }: {user_id:string, alt:string, size?: { width: number, height: number} , className?:string}) {

  const [imgSrc, setImgSrc] = useState(`/images/file/members/${user_id}/mini.webp`);

  useEffect(() => {
    setImgSrc(`/images/file/members/${user_id}/mini.webp`)
  }, [user_id])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className && className}
      onError={() => setImgSrc('/images/file/members/default-user.webp')}
      width={size.width}
      height={size.height}
      fetchPriority={'low'}
    />
  );
};