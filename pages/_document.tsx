
import { Html, Head, Main, NextScript } from "next/document";
// import Script from "next/script";
export default function Document() {
  return (
    <Html lang="ko">
      <Head>
          {/* Google Analytics */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-75607TXK6Q"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', 'G-75607TXK6Q');
              `,
            }}
          />
          {/* End Google Analytics */}
        </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
