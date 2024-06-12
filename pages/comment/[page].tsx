import HeadComponent from '@/components/HeadComponent'
import HeaderNoContent from '@/components/HeaderNoContent'
import Link from 'next/link'
import { useRouter } from 'next/router'


export default function Comment () {
  const router = useRouter()
  
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
                    <span>1</span>
                    <span> | </span>
                    <span>TOTAL</span>
                    <span>133546</span>
                  </p>
                </div>
                <div className='box'>
                  <Link href={':'} className='photo-area'>
                    <img src='/images/file/members/uptownboy7/profile.webp' alt='프로필 이미지' />
                  </Link>
                  <article className='my-word-area'>
                    <h4>우울</h4>
                    <p>짧은 밤이여
                      백가지 꿈을 꾸기엔
                      너무나 짧은 밤이여
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
                    <div>
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
                  <article className='comment-list-area'>
                    <div className='title-area'>
                      <span className='number'>NO. 1525</span>
                      <span className='name'>이대영</span>
                      <Link href={':'} className='home-icon'><img src='/images/file/members/uptownboy7/profile.webp' alt='homepage' /></Link>
                      <span className='number'>(2024.06.12 12:33)</span>
                    </div>
                    <div className='content-area'>
                      <button>
                        <img src='/images/file/members/uptownboy7/profile.webp' alt='minimi' />
                      </button>
                      <p>아이이이이이라이런이러ㅏ닝러ㅔ니;ㅇ리마ㅔㄴ오랴ㅣ메졷ㄹ햄곤해ㅕㅁㄱ노혀ㅑㅐㅁㄱ호ㅕㅑㄱㄴ호먀ㅕㄴㄱㅎ</p>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}