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
import { strip_tags } from '@/utils/common';
import Link from 'next/link';

type Props = {
  props : {
    documents: string
  }
}
export const getServerSideProps: GetServerSideProps<Props> = async (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  try {
    const { page = '1', module_srl = '52' } = ctx.params || {};
    const pageSize = 9;
    const offset = (parseInt(page as string) - 1) * pageSize;
    const moduleSrl = parseInt(module_srl as string);

    console.log('page----------------')
    console.log(page)
    console.log('offset----------------')
    console.log(offset)
    console.log('moduleSrl----------------')
    console.log(moduleSrl)

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
    `, [moduleSrl, pageSize, offset]);

    return {
      props: {
        documents: JSON.stringify(documentRows)
      }
    } as GetServerSidePropsResult<any>
  } catch(er) {
    console.log(er)
    return {
      props: {
        documents: '[]'
      }
    }
  }
};

export default function Home({
  documents = '[]'
}:{documents: string}) {
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



  const [document, setDocument] = useState([])
  useEffect(() => {
    const data = JSON.parse(documents)
    console.log(data)
    setDocument(data)
  },[documents])

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
                <h1 className='invisible'>글루미스토어 - 프론트엔드 개발자의 포트폴리오 </h1>
                <h2 className='title02 deco' itemProp='title'>
                  <a href='/board/index.php?module_srl=module_srl#title'>
                    my <span className='t-beige'>Blog</span>!
                  </a>
                </h2>
              </div>
              <div className='gallery' id='gallery'>
                {document.length && document?.map((item:any, idx) => (
                  <div key={idx + 'card' + item.id} className='card_wrapper js-fadeIn' itemProp='workExample'>
                    <a
                      href={'#!'}
                      title={item.title}
                      className='card'
                    >
                      <p className='thumbnail'>
                        <img
                          src={`/images/file/board/${item.document_srl}/thumb.${item.thumb}`}
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
                    </a>
                    <Link href={`/board/${item.module_srl}/1`} title='게시판으로' className='module_float'>
                      {item.module_srl === 52 ? 'development' : 'daily'}
                    </Link>
                  </div>
                ))}
              </div>
              <div className='paging'>
                <button
                  type='button'
                  className='arrow_btn double first'
                  aria-label='arrow_btn_double_first'
                  onClick={() => getBoardPage(1, 'module_srl')}
                >
                  <i className='fa fa-angle-double-left'></i>
                </button>
                <button
                  type='button'
                  className='arrow_btn single prev'
                  aria-label='arrow_btn_single_prev'
                  onClick={() => getBoardPageBtn('left', 'module_srl')}
                  id='pageBoardLeft'
                >
                  <i className='fa fa-angle-left'></i>
                </button>
                <div id='board_paging'>
                  {pages.map((page) => (
                    <button
                      key={page}
                      type='button'
                      className={`paging_btn ${page === 1 ? 'active' : ''}`}
                      aria-label={`paging_btn_${page}`}
                      onClick={() => getBoardPage(page, 'module_srl')}
                    >
                      <i className='fa'>{page}</i>
                    </button>
                  ))}
                </div>
                <button
                  type='button'
                  className='arrow_btn single next'
                  aria-label='arrow_btn_single_next'
                  onClick={() => getBoardPageBtn('right', 'module_srl')}
                  id='pageBoardRight'
                >
                  <i className='fa fa-angle-right'></i>
                </button>
                <button
                  type='button'
                  className='arrow_btn double last'
                  aria-label='arrow_btn_double_last'
                  onClick={() => getBoardPageBtn('rightDouble', 'module_srl')}
                  id='pageBoardRightDouble'
                >
                  <i className='fa fa-angle-double-right'></i>
                </button>
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
