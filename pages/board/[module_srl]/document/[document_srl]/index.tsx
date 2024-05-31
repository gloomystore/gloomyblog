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
    const row = documentRows.map(e => ({
      ...e,
      summary: e.content.slice(0, 40)
    }))
    // 이전 글 가져오기
    const this_regdate = (row[0] as any).regdate;
    console.log('this_regdate')
    console.log(this_regdate)
    console.log('this_regdate')
    const [beforeRows] = await pool.query(
      `SELECT * FROM (SELECT * FROM xe_documents WHERE status = 'PUBLIC' AND module_srl = ? AND regdate > ? ORDER BY regdate LIMIT 2) tmp ORDER BY regdate DESC`,
      [module_srl, this_regdate]
    );

    const beforePosts = (beforeRows as any[]).map((row: any) => {
      const {
        document_srl,
        module_srl,
        title,
        content,
        thumb,
        readed_count,
        nick_name,
        regdate,
        status,
      } = row;

      let before_thumb = thumb !== 'null' ? `/images/board/${document_srl}/thumb.${thumb}` : '/images/flower6.jpg';
      let before_re_title = title;
      let before_converted = strip_tags(content);

      if (title.length > 15) {
        before_re_title = title.substring(0, 15) + '...';
      }
      if (before_converted.length > 35) {
        before_converted = before_converted.substring(0, 35) + '...';
      }

      return {
        document_srl,
        module_srl,
        title: before_re_title,
        content: before_converted,
        thumb: before_thumb,
        readed_count,
        nick_name,
        regdate,
        status,
      };
    });

    // 이후 글 가져오기
    const [afterRows] = await pool.query(
      `SELECT * FROM xe_documents WHERE status = 'PUBLIC' AND module_srl = ? AND regdate < ? ORDER BY regdate DESC LIMIT 2`,
      [module_srl, this_regdate]
    );

    const afterPosts = (afterRows as any[]).map((row: any) => {
      const {
        document_srl,
        module_srl,
        title,
        content,
        thumb,
        readed_count,
        nick_name,
        regdate,
        status,
      } = row;

      let after_thumb = thumb !== 'null' ? `/images/board/${document_srl}/thumb.${thumb}` : '/images/flower6.jpg';
      let after_re_title = title;
      let after_converted = strip_tags(content);

      if (title.length > 15) {
        after_re_title = title.substring(0, 15) + '...';
      }
      if (after_converted.length > 35) {
        after_converted = after_converted.substring(0, 35) + '...';
      }

      return {
        document_srl,
        module_srl,
        title: after_re_title,
        content: after_converted,
        thumb: after_thumb,
        readed_count,
        nick_name,
        regdate,
        status,
      };
    });

    ;

    return {
      props: {
        documents: JSON.parse(JSON.stringify(row[0])),
        otherPost: JSON.parse(JSON.stringify([...beforePosts, ...afterPosts])),
      },
      revalidate: 43200, // 12시간 (43200초)마다 재생성
    } as GetStaticPropsResult<any>
  } catch(err) {
    console.log(err)
    return {
      props: {
        documents: {},
        otherPost: []
      }
    }
  }
}

export default function Document({
  documents = {},
  otherPost = [],
}:{documents: any, otherPost: any[]}) {
  
  // console.log(documents)
  // console.log(otherPost)

  
  const onMoveBoard = () => {}




  return (
    <>
      <HeadComponent
      title={documents.title}
      description={documents.summary}
      keywords={documents.tags}
      />
      
      <div className='gl-wrap'>
        <div className='gl-wrap__inner'>
          <Header />
          <main className='gallery_wrap gallery_wrap--board' itemScope={true} itemType='https://schema.org/CreativeWork'>
            <div className='mt-50'>
              <h1 className='invisible'>{documents.title}</h1>
              <h2 className='title02 deco' itemProp='title' id='title'>
                <Link href='/#title'>
                  my <span className='t-beige'>Blog</span>!
                </Link>
              </h2>
            </div>


            <div className={styles['content_wrap']} id='content_wrap' itemScope={true} itemType='https://schema.org/CreativeWork'>
              <div className={styles['title_wrap']}>
                <div className={styles['title']}>
                  <h2 itemProp='title'>{documents.title}</h2>
                  <p>
                    <span id='date' itemProp='datePublished'>2023.09.11</span>
                    <span>
                      <em id='count'>조회수{documents.readed_count}</em>
                      <em id='name' itemProp='creator'>{documents.user_name}</em>
                    </span>
                  </p>
                </div>
              </div>
              <div className={styles['content']} id='content'>
                <div className={styles['young_board_content']} data-pswp-uid='1'>
                  {
                    documents.content && <div id='real' dangerouslySetInnerHTML={{__html: documents.content}} />
                  }
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
                <Link href=':' title='아이폰 safe-area 대응하기 (아이폰 X 이상, 이하 구분하기)' style={{backgroundImage: `url('/images/file/board/1027/thumb.jpg')`}} className='active'>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>아이폰 sdumidumiudmidumidutmafe-area 대...</span></p>
                    <p className={styles['text']}><span>@supports -webkit-touch-calghjhjghjtyjyrtjenuryjurmyulout: n...</span></p>
                  </div>
                </Link>
                <Link href=':' title='input file 파일 복수 업로드 구현' style={{backgroundImage: `url('/images/file/board/1015/thumb.png')`}}>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>input fidumiumidutmidmidumtidumile 파일 복...</span></p>
                    <p className={styles['text']}><span>&lt;!DOCTYPE html&gt;&lt;htmyumytmdudytmitumitumiudmidumil lang=...</span></p>
                  </div>
                </Link>
                <Link href=':' title='axios 취소 기능으로 검색 debounce 구현하기' style={{backgroundImage: `url('/images/file/board/1002/thumb.jpg')`}}>
                  <div className={styles['script']}>
                    <p className={styles['subject']}><span>axios 취소 기능으로 검...</span></p>
                    <p className={styles['text']}><span>&lt;input type='text' oninput='hand...</span></p>
                  </div>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
