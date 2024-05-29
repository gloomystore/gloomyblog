'use client'
// style
import styles from '@/styles/module/Home.module.scss'

// module
import { useRecoilState } from 'recoil';
import { LoadAtom, ScrollBlockAtom } from '@/store/CommonAtom'
import HeadComponent from "./components/HeadComponent";
import Loading from "./components/Loading";
import { useCallback, useMemo, useState } from 'react';

export default function Home() {
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
      <main className="wrap">

      </main>
      <article className={activeModal ? "modal active" : "modal"}>
        <div className="modal-dimmed" onClick={closeModal}></div>
        <div className="modal-content blink">
          {
            'companyName' &&
            <>
              <h3>
                <span className={styles["logo-company"]}>
                  <img src="/images/logo/ico_trans.webp" alt="icon" />
                </span>
                트랜스코스모스코리아
              </h3>
              <p className="mt-20 bold">UI디자이너 &amp; 웹퍼블리셔</p>
<pre className="mt-20">
{
`디자인 사용기술: photoshop, figma, xd
퍼블리싱 기술스택: HTML4, HTML5, CSS3, ES5, ES6
특이사항: 일본어 사용, 일본어로 제작

웹에이전시이며, 디자인 및 퍼블리싱 작업을 동시에 진행했습니다.

주 고객은 일본 내 대기업들이며,
웹사이트 구축 및 운영 모두 대응했습니다.
`}
</pre>
              <p className="mt-20 italic">이직사유: 디자인보다 코드로 뭔가를 구현하는 것에 흥미를 느껴, 커리어를 퍼블리셔로 굳히기 위함</p>
            </>
            }
          <div className="modal-button">
            <button onClick={closeModal}>확인</button>
          </div>
        </div>
      </article>
    </>
  );
}
