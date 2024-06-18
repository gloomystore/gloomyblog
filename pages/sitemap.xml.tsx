import { NextApiResponse } from 'next'

const Sitemap = () => {}

export const getServerSideProps = async ({ res }: { res: NextApiResponse }) => {
  const request = await fetch(`${process.env.SITE_URL}/api/sitemap.xml`)
  const sitemap = await request.text()

  res.setHeader('Content-Type', 'application/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {}
  }
}

export default Sitemap