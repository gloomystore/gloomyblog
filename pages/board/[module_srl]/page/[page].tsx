// style
import styles from '@/styles/module/Home.module.scss'

// module
import { useRecoilState } from 'recoil';
import { LoadAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import HeadComponent from '@/pages/components/HeadComponent';
import Loading from '@/pages/components/Loading';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios'

import Header from '@/pages/components/Header'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { ParsedUrlQuery } from 'querystring';
import pool from '@/pages/api/db/mysql';
import { RowDataPacket } from 'mysql2';
import { removeTags, removeTagsExceptCode } from '@/utils/common';
import Link from 'next/link';
import nextCookies from 'next-cookies'
import jwt from 'jsonwebtoken'

type Props = {
  props : {
    documents: string
  }
}
export const getServerSideProps: GetServerSideProps<Props> = async (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  try {
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

    const page = parseInt(ctx?.params?.page as string)
    const module_srl = parseInt(ctx?.params?.module_srl as string)
    const pageSize = 9;
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
      WHERE module_srl = ?
      ORDER BY regdate DESC
      LIMIT ? OFFSET ?
    `, [module_srl, pageSize, offset])

    // 콘텐츠의 길이를 200자로 제한하는 함수
    const limit200 = (str: string) => {
      return str.slice(0, 200)
    }

    // 각 콘텐츠의 태그를 제거하고 길이를 제한합니다.
    const rows = documentRows.map((e: any) => ({ ...e, content: limit200(removeTags(e.content)) }))

    const [totalRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM xe_documents
      WHERE module_srl IN (${module_srl})
    `);
    const totalCount = totalRows[0].total;

    // 총 페이지 수를 계산합니다
    const totalPages = Math.ceil(totalCount / pageSize)

    const documents = {
      data: rows,
      page: {
        currentPage: Number(page),
        totalPages
      },
      module_srl: module_srl
    }
    
    return {
      props: {
        documents: JSON.parse(JSON.stringify(documents)),
        module_srl
      }
    } as GetServerSidePropsResult<any>
  } catch(err) {
    console.log(err)
    return {
      props: {
        documents: {
          data: [],
          page: {
            currentPage: 0,
            totalPages: 0,
          },
          module_srl: 0,
        },
        module_srl: 0,
      }
    }
  }
};

export default function Board({
  documents = '[]',
  module_srl,
}:{documents: any, module_srl:number}) {
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

  const SSRPaging:number[] = []
  if (documents.page?.totalPages > 0) {
    for(let i = 1; i < documents.page.totalPages + 1; i++) {
      SSRPaging.push(i)
    }
  }

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
                <h1 className='invisible'>글루미스토어 - 
                  {
                    documents.module_srl === 52 && '개발 블로그'
                  } 
                  {
                    documents.module_srl === 214 && '일상 일기'
                  } 
                  {
                    ![52, 214].includes(module_srl) && '나의 블로그'
                  } 
                </h1>
                <h2 className='title02 deco' itemProp='title' id='title'>
                  {
                    documents.module_srl === 52 && (
                      <Link href='/board/52/page/1#title' title='개발일기'>
                        <span className='t-beige'>Dev</span>elopment!
                      </Link>
                    )
                  }
                  {
                    documents.module_srl === 214 && (
                      <Link href='/board/214/page/1#title' title='일상 일기'>
                        <span className='t-beige'>Dai</span>ly
                      </Link>
                    )
                  }
                  {
                    ![52, 214].includes(documents.module_srl) && (
                      <Link href='/#title' title='블로그 메인'>
                        my <span className='t-beige'>Blog</span>!
                      </Link>
                    )
                  }
                </h2>
              </div>
              <div className='gallery' id='gallery'>
                {documents.data?.map((item:any, idx:number) => (
                  <div key={idx + 'card' + item.id} className='card_wrapper js-fadeIn' itemProp='workExample'>
                    <Link
                      href={`/board/${item.module_srl}/document/${item.document_srl}`}
                      title={item.title}
                      className='card'
                    >
                      <p className='thumbnail'>
                        <img
                          src={item.thumb && item.thumb !== 'null' ? `/images/file/board/${item.document_srl}/thumb.${item.thumb} ` : '/images/flower6.webp'}
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
                          {removeTagsExceptCode(item.content)}
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
                ))}
              </div>
              <div className='paging'>
                <Link
                  type='button'
                  className='arrow_btn double first'
                  aria-label='arrow_btn_double_first'
                  href={`/board/${documents.module_srl}/page/1#title`}
                >
                  <i className='fa fa-angle-double-left'></i>
                </Link>
                <Link
                  type='button'
                  className='arrow_btn single prev'
                  aria-label='arrow_btn_single_prev'
                  href={documents.page?.currentPage !== 1 ? `/board/${documents.module_srl}/page/${documents.page?.currentPage - 1}#title` : '#!'}
                  id='pageBoardLeft'
                >
                  <i className='fa fa-angle-left'></i>
                </Link>
                <div id='board_paging'>
                  {SSRPaging?.length && SSRPaging?.map((page) => (
                    <Link
                      key={'paging' + page}
                      type='button'
                      className={`paging_btn ${page === documents.page.currentPage && 'active'}`}
                      aria-label={`paging_btn_${page}`}
                      href={`/board/${documents.module_srl}/page/${page}#title`}
                    >
                      <i className='fa'>{page}</i>
                    </Link>
                  ))}
                </div>
                <Link
                  type='button'
                  className='arrow_btn single next'
                  aria-label='arrow_btn_single_next'
                  href={documents.page?.currentPage + 1 < documents.page?.totalPages ? `/board/${documents.module_srl}/page/${documents.page.currentPage + 1}#title` : '#!'}
                  id='pageBoardRight'
                >
                  <i className='fa fa-angle-right'></i>
                </Link>
                <Link
                  type='button'
                  className='arrow_btn double last'
                  aria-label='arrow_btn_double_last'
                  href={`/board/${documents.module_srl}/page/${documents.page?.totalPages}#title`}
                  id='pageBoardRightDouble'
                >
                  <i className='fa fa-angle-double-right'></i>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
      <article className={activeModal ? 'modal active' : 'modal'}>
        <div className='modal-dimmed' onClick={closeModal}></div>
        <div className='modal-content blink'>
          {
            'companyName' &&
            <>
              <h3>
                <span className={styles['logo-company']}>
                  <img src='/images/logo/ico_trans.webp' alt='icon' />
                </span>
                트랜스코스모스코리아
              </h3>
              <p className='mt-20 bold'>UI디자이너 &amp; 웹퍼블리셔</p>
<pre className='mt-20'>
{
`디자인 사용기술: photoshop, figma, xd
퍼블리싱 기술스택: HTML4, HTML5, CSS3, ES5, ES6
특이사항: 일본어 사용, 일본어로 제작

웹에이전시이며, 디자인 및 퍼블리싱 작업을 동시에 진행했습니다.

주 고객은 일본 내 대기업들이며,
웹사이트 구축 및 운영 모두 대응했습니다.
`}
</pre>
              <p className='mt-20 italic'>이직사유: 디자인보다 코드로 뭔가를 구현하는 것에 흥미를 느껴, 커리어를 퍼블리셔로 굳히기 위함</p>
            </>
            }
          <div className='modal-button'>
            <button onClick={closeModal}>확인</button>
          </div>
        </div>
      </article>
    </>
  );
}
