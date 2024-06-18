import HeadComponent from "@/components/HeadComponent"
import HeaderNoContent from "@/components/HeaderNoContent"
// import { MyInfoAtom } from "@/store/CommonAtom"
import { TodayHitAtom, TotalHitAtom } from "@/store/StatisticsAtom"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRecoilState } from "recoil"

export default function Comment ({comments}:{comments:any}) {
  // const [myInfo, setMyInfo]:[(string | null), Function] = useRecoilState(MyInfoAtom)
  const [todayHit] = useRecoilState(TodayHitAtom)
  const [totalHit] = useRecoilState(TotalHitAtom)

  return (
    <>
      <HeadComponent
        title={'글루미스토어 - 방명록, comment'}
        description={'글루미 스토어 방명록입니다. 댓글을 남겨주세요. 영이에게 하고싶은 말이 있다면 얼마든지 하십시오'}
        keywords={'글루미스토어, 프론트엔드, 개발자, 방명록, comment'}
        
      />
      <div className='gl-wrap gl-comment'>
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
                    <span className='today'>{todayHit}</span>
                    <span> | </span>
                    <span>TOTAL</span>
                    <span>{totalHit}</span>
                  </p>
                </div>
                <div className='box'>
                  <button className='photo-area'>
                    <img
                      src={`/images/file/members/${process.env.NEXT_PUBLIC_ADMIN_ID}/photo.webp`}
                      alt='프로필 이미지'
                    />
                  </button>
                  <article className='my-word-area'>
                    <h2>
                      <span className='today-is'>TODAY IS...</span>
                      <div>
                        <span className='icon'>
                          <img src='/images/icon/cyicon.gif' alt='icon' />
                        </span>
                        <span className='word'>우울</span>
                      </div>
                    </h2>
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
                
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

function ProfileImage ({ 
  user_id, 
  alt, 
  size = {
    width: 148,
    height: 148
  } , 
  className }: {user_id?:string | null, alt:string, size?: { width: number, height: number} , className?:string}) {

  const [imgSrc, setImgSrc] = useState(user_id ? `/images/file/members/${user_id}/profile.webp`: '/images/file/members/default-user2.webp')

  useEffect(() => {
    setImgSrc(user_id ? `/images/file/members/${user_id}/profile.webp` : `/images/file/members/default-user2.webp`)
  }, [user_id])

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className && className}
      onError={() => setImgSrc('/images/file/members/default-user2.webp')}
      width={size.width}
      height={size.height}
      fetchPriority={'low'}
    />
  )
}