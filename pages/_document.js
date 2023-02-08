import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <meta property="og:title" content="AI Rapper" key="title"/>
        <meta property="og:description" content="Can't rap? Get AI to do it for you!" key="description"/>
        <meta
          property="og:image"
          content="https://cdn.buildspace.so/images/vibes/daboiz.png"
        />
        <meta name="twitter:card" content="summary_large_image"></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
