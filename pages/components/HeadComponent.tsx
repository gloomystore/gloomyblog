import Head from 'next/head'
import { useRouter } from 'next/router'

export default function HeadComponent({
  title = '글루미스토어 블로그', 
  description = '글루미스토어 블로그', 
  keywords = '글루미스토어, 블로그. gloomystore, blog, development, frontend',
  robots = true
  }
  :
  {
    title?: string, 
    description?: string, 
    keywords?: string,
    robots?: boolean,
  }) {
    const router = useRouter()
  return (
    <>
      <Head>
        <link rel='icon' type='image/x-icon' href='/favicon.ico' />
        <meta charSet='UTF-8' />
        <meta name='format-detection' content='telephone=no' />

        <title>{title}</title>
        <meta name='title' content={title} />
        <meta name='description' content={description} />
        <meta name='keywords' content={keywords} />
        <meta httpEquiv='X-UA-Compatible' content='IE=Edge' />
        <meta name='robots' content={robots ? 'INDEX,FOLLOW,max-snippet:20, max-image-preview:large' : 'NONE'} />
        <meta name='viewport' content='width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=4' />
        <meta name='theme-color' content='#4a2766'/>
        
        <meta property='og:type' content='website' /> 
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:image' content='https://www.gloomy-store.com/images/logo3.webp' />
        <meta property='og:url' content={process.env.NEXT_PUBLIC_API_URL + router.asPath} />
        <link rel='apple-touch-icon' href='/logo192.webp' />
	      <link rel='manifest' href='/manifest.json' />
        <meta name='naver-site-verification' content='d734660b63628ebd5ba4493a3b3f025cf2f0918c' />
        <meta name='google-site-verification' content='NbgJPXuyN9p7v3DvtB-Qadb7xAc0yay5AGeKgMgi_cc' />
        <meta name="google-adsense-account" content="ca-pub-9388179782533950" />
        <link rel='canonical' href={process.env.NEXT_PUBLIC_API_URL + router.asPath} />
        <noscript>이 블로그는 크로뮴, Gecko 환경에서 제일 잘 작동됩니다.</noscript>
      </Head>
    
    </>
  )
}