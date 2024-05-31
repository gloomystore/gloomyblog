// style
import styles from '@/styles/module/Board.module.scss'

// module
import HeadComponent from '@/pages/components/HeadComponent'

import Header from '@/pages/components/Header'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult, GetStaticProps, GetStaticPropsContext, GetStaticPropsResult } from 'next'
import { ParsedUrlQuery } from 'querystring'
import pool from '@/pages/api/db/mysql'
import { RowDataPacket } from 'mysql2'
import { strip_tags } from '@/utils/common'
import Link from 'next/link'

type Props = {
  props : {
    documents: string
  }
}

export const getStaticPaths = async () => {
  try {
    // 데이터베이스에서 module_srl과 document_srl을 가져오는 쿼리
    const [documentRows] = await pool.query<RowDataPacket[]>(`
    SELECT module_srl, document_srl
    FROM xe_documents
  `)

  // 가져온 데이터로 paths 배열을 생성
  const paths = documentRows.map((row) => ({
    params: {
      module_srl: row.module_srl.toString(),
      document_srl: row.document_srl.toString(),
    }
  }))

  return {
    paths,
    fallback: true, // or false, depending on your needs
  }
  } catch(err) {
    return {
      paths: [
        { 
          params: { 
            module_srl: 1,
            document_srl: 1,
          } 
        }
      ],
      fallback: true
    }
  }
  
}

export const getStaticProps: GetStaticProps<Props> = async (ctx: GetStaticPropsContext<ParsedUrlQuery>) => {
  try {
    const { document_srl = '1', module_srl = '52' } = ctx.params || {}

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
      WHERE document_srl = ${document_srl}
    `)

    return {
      props: {
        documents: JSON.parse(JSON.stringify(documentRows))
      },
      revalidate: 43200, // 12시간 (43200초)마다 재생성
    } as GetStaticPropsResult<any>
  } catch(err) {
    console.log(err)
    return {
      props: {
        documents: '[]'
      }
    }
  }
}

export default function Home({
  documents = '[]'
}:{documents: any}) {
  
  console.log(documents)

  
  const onMoveBoard = () => {}




  return (
    <>
      <HeadComponent
      title={'글루미스토어 - 프론트엔드 개발자 영 블로그'}
      description={'프론트엔드 개발자 영의 블로그입니다. 이 웹사이트의 모든 동작은 state binding으로 구현되어있습니다. 또한 이 웹사이트는 Next.js로 구현되어있습니다.'}
      keywords={'글루미스토어, 퍼블리셔, 프론트엔드, 개발자, FE, 웹퍼블리셔, HTML5, CSS3, ES6, Jquery, PHP, Photoshop'}
      />
      
      <div className='gl-wrap'>
        <div className='gl-wrap__inner'>
          <Header />
          <main className='gallery_wrap gallery_wrap--board' itemScope={true} itemType='https://schema.org/CreativeWork'>
            <div className='mt-50'>
              <h1 className='invisible'>글루미스토어 - 프론트엔드 개발자 블로그 </h1>
              <h2 className='title02 deco' itemProp='title' id='title'>
                <Link href='/#title'>
                  my <span className='t-beige'>Blog</span>!
                </Link>
              </h2>
            </div>


            <div className={styles['content_wrap']} id='content_wrap' itemScope={true} itemType='https://schema.org/CreativeWork'>
              <div className={styles['title_wrap']}>
                <div className={styles['title']}>
                  <h2 itemProp='title'>아이폰 safe-area 대응하기 (아이폰 X 이상, 이하 구분하기)</h2>
                  <p>
                    <span id='date' itemProp='datePublished'>2023.09.11</span>
                    <span>
                      <em id='count'>조회수: 1188</em>
                      <em id='name' itemProp='creator'><b>[운영자]</b>영이</em>
                    </span>
                  </p>
                </div>
              </div>
              <div className={styles['content']} id='content'>
                <div className={styles['young_board_content']} data-pswp-uid='1'>








                <p><br /></p><p><br /></p><p><br /></p><p><br /></p><p className="summer_img_wrapper"><img alt="maxresdefault.jpg" className="uploaded_img sm-width50" src="/images/board/1027/20230911122425_3fb2db6cccf4a23383383394b28b2b31.jpg"/><br /></p><p><br /></p><p><br /></p><p><br /></p><p><br /></p><pre><code className="language-css hljs">
<span className="hljs-keyword">@supports</span> (<span className="hljs-attribute">-webkit-touch-callout</span>: none) {`{`}
  <span className="hljs-comment">/*아이폰 전체*/</span>
  <span className="hljs-attribute">padding-bottom</span>: <span className="hljs-number">30px</span>;
  <span className="hljs-selector-class">.padding-bottom</span> {`{`}
    <span className="hljs-comment">/* iPhone X 이하일 때 */</span>
    <span className="hljs-keyword">@media</span> <span className="hljs-keyword">only</span> screen <span className="hljs-keyword">and</span> (<span className="hljs-attribute">max-device-width</span>: <span className="hljs-number">812px</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">-webkit-min-device-pixel-ratio</span>: <span className="hljs-number">2</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">orientation</span>: portrait),
    <span className="hljs-keyword">only</span> screen <span className="hljs-keyword">and</span> (<span className="hljs-attribute">max-device-width</span>: <span className="hljs-number">812px</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">-webkit-min-device-pixel-ratio</span>: <span className="hljs-number">2</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">orientation</span>: landscape) {`{`}
      <span className="hljs-attribute">padding-bottom</span>: <span className="hljs-built_in">calc</span>(<span className="hljs-number">48px</span> + #{`{`}$-h-btn-fixed{`}`} + #{`{`}$-spacing_y{`}`}) !important;
      <span className="hljs-attribute">padding-bottom</span>: <span className="hljs-built_in">calc</span>( <span className="hljs-number">48px</span> + #{`{`}$-h-btn-fixed{`}`} + #{`{`}$-spacing_y{`}`}) !important;
      <span className="hljs-comment">/* iPhone X 이상일 때 */</span>
      <span className="hljs-keyword">@media</span> <span className="hljs-keyword">only</span> screen <span className="hljs-keyword">and</span> (<span className="hljs-attribute">max-device-width</span>: <span className="hljs-number">812px</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">-webkit-min-device-pixel-ratio</span>: <span className="hljs-number">3</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">orientation</span>: portrait),
      <span className="hljs-keyword">only</span> screen <span className="hljs-keyword">and</span> (<span className="hljs-attribute">max-device-width</span>: <span className="hljs-number">812px</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">-webkit-min-device-pixel-ratio</span>: <span className="hljs-number">3</span>) <span className="hljs-keyword">and</span> (<span className="hljs-attribute">orientation</span>: landscape) {`{`}
        <span className="hljs-attribute">padding-bottom</span>: <span className="hljs-built_in">calc</span>(<span className="hljs-built_in">constant</span>(safe-area-inset-bottom) + <span className="hljs-number">48px</span> + #{`{`}$-h-btn-fixed{`}`}) !important;
        <span className="hljs-attribute">padding-bottom</span>: <span className="hljs-built_in">calc</span>(<span className="hljs-built_in">env</span>(safe-area-inset-bottom) + <span className="hljs-number">48px</span> + #{`{`}$-h-btn-fixed{`}`}) !important;
        {`}`}
      {`}`}
    {`}`}
  {`}`}</code></pre><p><br /></p><p><br /></p><p>아이폰만, 게다가 아이폰 버전별로 css를 먹이는 key는 바로&nbsp;</p><p>-webket-touch-callout: none과&nbsp;</p><p>-webkit-min-device-pixel-ratio 두가지였다.</p><p><br /></p><p>일단 테스트해보면 웬만한 아이폰에서는 정상적으로 잘먹힘.</p><p><br /></p><p>앱이 아니라 웹에서는 safe area대응이 정말 불편하고&nbsp;</p><p>일일이 수동으로 다 짜줘야해서 너무 어려웠던 기억이 난다.</p><p><br /></p><p>아이폰은 X부터 홈버튼이 사라지고 home bar가 생겼는데, 마침 이 시기에 픽셀비율이 3이상이 되어서&nbsp;</p><p>홈바가 있냐 없냐 구분은 픽셀비율이 2냐 3이냐로 따지면 됨.</p><p><br /></p><p><br /></p><p><br /></p><p><br /></p>              
















                </div>
              </div>
              <div className={styles['comment']} id='comment'>
                <div className={styles['comment_inner']} id='comment_inner'>
                  <h3 className={styles['comment_total']}>댓글: <span id='comment_total_num'>3</span></h3>
                  <div className={styles['comment_list_wrapper']} id='comment_list_wrapper'>
                    {/* JavaScript 코드가 JSX로 변환되지 않는 부분은 따로 처리해야 합니다 */}
                  </div>
                  <form action='/php/comment/INSERT_comment.php' method='post' name='comment_form' id='comment_form' className={styles['comment_form']} data-gtm-form-interact-id='0'>
                    <div id='comment_form_name' className={styles['comment_form_name']}>
                      <div>
                        <input type='text' name='comment_name' placeholder='이름' maxLength={30} required={true} data-gtm-form-interact-field-id='0' />
                      </div>
                      <div>
                        <input type='password' name='comment_pass' placeholder='비밀번호' maxLength={15} required={true} autoComplete='on' data-gtm-form-interact-field-id='1' />
                      </div>
                      {/* 스팸 방지문구 영역은 주석 처리합니다 */}
                      <input type='hidden' name='document_srl' value='1027' readOnly={true} tabIndex={-1} className={styles['invisible']} />
                      <input type='hidden' name='module_srl' value='52' readOnly={true} tabIndex={-1} className={styles['invisible']} />
                    </div>
                    <textarea name='comment_form_txt' id='comment_form_txt' className={styles['comment_form_txt']} cols={30} rows={10} placeholder='댓글을 남겨주세요!' required={true}></textarea>
                    <div className={styles['comment_btns']}>
                      <input type='checkbox' className={styles['check_secret']} name='check_secret' id='check_secret' /><label htmlFor='check_secret'>비밀 댓글</label>
                      <button type='submit'>작성</button>
                    </div>
                  </form>
                </div>
              </div>
              {/* 다음의 스크립트는 JSX로 변환되지 않는 부분입니다. */}
              <script>
                {`/* 여기에 자바스크립트 코드를 JSX로 변환하여 넣으세요 */`}
              </script>
              <div className={styles['toList_wrap']}>
                <button type='button' onClick={() => {}} className={styles['toList']}>목록으로</button>
              </div>
            </div>
            <div className={styles['another_content']}>
              <h3>이전/다음글</h3>
              <div className={styles['another_content_inner']}>
                <a href='#' title='아이폰 safe-area 대응하기 (아이폰 X 이상, 이하 구분하기)' style={{backgroundImage: `url('/images/file/board/1027/thumb.jpg')`}} className='active'>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>아이폰 sdumidumiudmidumidutmafe-area 대...</span></p>
                    <p className={styles['text']}><span>@supports (-webkit-touch-calghjhjghjtyjyrtjenuryjurmyulout: n...</span></p>
                  </div>
                </a>
                <a href='/board/board.php?document_srl=1015&amp;module_srl=52&amp;view_all=0#title' title='input file 파일 복수 업로드 구현' style={{backgroundImage: `url('/images/file/board/1015/thumb.png')`}}>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>input fidumiumidutmidmidumtidumile 파일 복...</span></p>
                    <p className={styles['text']}><span>&lt;!DOCTYPE html&gt;&lt;htmyumytmdudytmitumitumiudmidumil lang=...</span></p>
                  </div>
                </a>
                <a href='/board/board.php?document_srl=1002&amp;module_srl=52&amp;view_all=0#title' title='axios 취소 기능으로 검색 debounce 구현하기' style={{backgroundImage: `url('/images/file/board/1002/thumb.jpg')`}}>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>axios 취소 기능으로 검...</span></p>
                    <p className={styles['text']}><span>&lt;input type='text' oninput='hand...</span></p>
                  </div>
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
