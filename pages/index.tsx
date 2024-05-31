// style
import styles from '@/styles/module/Home.module.scss'

// module
import { useRecoilState } from 'recoil';
import { IsAdminAtom, LoadAtom, MyInfoAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import HeadComponent from '@/pages/components/HeadComponent';
import Loading from '@/pages/components/Loading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios'

import Header from '@/pages/components/Header'
import pool from './api/db/mysql';
import { RowDataPacket } from 'mysql2';
import Link from 'next/link';
import { strip_tags } from '@/utils/common';

export const getServerSideProps = async() => {
  try {
    // const { data } = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/dummy/getBoardData.json')
    const page = 1
    const pageSize = 9
    const offset = (page - 1) * pageSize
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
    // strip_tags

    const limit200 = (str:string) => {
      return str.slice(0, 200)
    }
    const rows = documentRows.map((e:any) => ({...e, content: limit200(strip_tags(e.content))}))

    const [totalRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM xe_documents
      WHERE module_srl IN (214, 52)
    `);
    const totalCount = totalRows[0].total;

    // 총 페이지 수를 계산합니다
    const totalPages = Math.ceil(totalCount / pageSize)


    const documents = {
      data: rows,
      page: {
        currentPage: 1,
        totalPages
      }
    }
    
    return {
      props: {
        documents: JSON.parse(JSON.stringify(documents))
      }
    }
  } catch(er) {
    console.log(er)
    return {
      props: {
        documents: {
          data: [],
          page: {
            currentPage: 0,
            totalPages: 0
          }
        }
      }
    }
  }
}

export default function Home({
  documents = {
    data: [],
    page: {
      currentPage: 0,
      totalPages: 0
    }
  }
}:{documents:any}) {
  // 로딩
  const [scrollBlock, setScrollBlock] = useRecoilState(ScrollBlockAtom);
  const [load, setLoad] = useRecoilState(LoadAtom)
  const [isLoad, setIsLoad] = useState(false)
  const [isContentLoad, setIsContentLoad] = useState(false)
  const loadWord = useMemo(() => '로딩중', [])

  // modal
  const [activeModal, setActiveModal] = useState(false)
  const closeModal = useCallback(() => {
    setActiveModal(false)
  }, [activeModal])
  const [profileId, setProfileId] = useState(0)
  const profileView = useCallback((id:string) => {

  }, [profileId])
  const initialState = useMemo(() => ({
    data: [],
    page: {
      currentPage: 0,
      totalPages: 0
    }
  }), [])
  const [Document, setDocument] = useState(initialState)
  useEffect(() => {
    const res = documents
    setDocument(res)
  },[documents])


  const [currentPage, setCurrentPage] = useState(1)
  const [paging, setPaging] = useState([1])
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (Document.page.totalPages > 0) {
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
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/board/all/${page}`)
      if(res.status === 200) {
        setDocument(JSON.parse(res.data))
      } else throw new Error('network failed')
    } catch(err) {
      console.log(err)
      setDocument(initialState)
    }
  }, [])

  const titleRef = useRef<HTMLHeadingElement>(null)

  const pages = [1, 2]; // 페이지 번호 예시

  const getBoardPage = (page: number, moduleSrl: string) => {
    console.log(`Load page ${page} for module ${moduleSrl}`);
  };

  const getBoardPageBtn = (direction: string, moduleSrl: string) => {
    console.log(`Load page in direction ${direction} for module ${moduleSrl}`);
  };


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
                documents?.data?.map((item:any, idx:number) => (
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
                Document && Document?.data?.length && Document?.data?.map((item:any, idx:number) => (
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
                      changePage(currentPage + 1)
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
                    if(currentPage < documents.page.totalPages) {
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
                  onClick={() => changePage(documents.page.totalPages)}
                  id='pageBoardRightDouble'
                >
                  <i className='fa fa-angle-double-right'></i>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

