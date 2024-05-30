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

export const getServerSideProps = async() => {
  try {
    const { data } = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/dummy/getBoardData.json')
    return {
      props: {
        boardData: data
      }
    }
  } catch(er) {
    console.log(er)
    return {
      props: {
        boardData: 'error'
      }
    }
  }
}

export default function Home({
  boardData = []
}:{boardData:any[]}) {
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

  useEffect(() => {
    console.log(boardData)
  },[boardData])





  const pages = [1, 2]; // 페이지 번호 예시

const getBoardPage = (page: number, moduleSrl: string) => {
  console.log(`Load page ${page} for module ${moduleSrl}`);
};

const getBoardPageBtn = (direction: string, moduleSrl: string) => {
  console.log(`Load page in direction ${direction} for module ${moduleSrl}`);
};
const galleryItems:any[] = [
  {
    id: 1,
    link: '/board/board.php?document_srl=1027&module_srl=52&view_all=1#title',
    title: '아이폰 safe-area 대응하기 (아이폰 X 이상, 이하 구분하기)',
    thumbnail: '/images/board/1027/thumb.jpg',
    module: 'development',
    about: '아이폰 safe-area 대응하기 (아이폰 X...',
    text: '@supports (-webkit-touch-callout: none) { /*아이폰 전체*/ paddin...',
    date: '2023.09.11',
    moduleLink: '/board/index.php?module_srl=52&view_all=0#title',
  },
]


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
                {boardData.length && boardData?.map((item:any, idx) => (
                  <div key={idx + 'card' + item.id} className='card_wrapper js-fadeIn' itemProp='workExample'>
                    <a
                      href={item.link}
                      title={item.title}
                      className='card'
                    >
                      <p className='thumbnail'>
                        <img
                          src={item.thumbnail}
                          alt='thumbnail'
                          onError={(e) => (e.currentTarget.src = '/images/flower6.jpg')}
                        />
                      </p>
                      <div className='script'>
                        {/* <p className='module'>
                          <span>{item.module}</span>
                        </p> */}
                        <p className='title' itemProp='about'>
                          {item.about}
                        </p>
                        <p className='text'>
                          {item.text}
                        </p>
                        <p className='date' itemProp='datePublished'>
                          <span>{item.date}</span>
                        </p>
                      </div>
                    </a>
                    <a href={item.moduleLink} title='게시판으로' className='module_float'>
                      <span>{item.module}</span>
                    </a>
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
