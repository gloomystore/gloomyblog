import Image from "next/image"
import { useEffect, useState } from "react"

export default function MiniProfileImage ({ 
  user_id, 
  alt, 
  size = {
    width: 60,
    height: 60
  } , 
  className }: {user_id?:string, alt:string, size?: { width: number, height: number} , className?:string}) {

  const [imgSrc, setImgSrc] = useState(user_id ? `/images/file/members/${user_id}/mini.webp` : '/images/file/members/default-user.webp')

  useEffect(() => {
    setImgSrc(user_id ? `/images/file/members/${user_id}/mini.webp` : '/images/file/members/default-user.webp')
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
  )
}