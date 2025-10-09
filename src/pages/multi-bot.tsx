import MultiBotSelector from '../components/MultiBotSelector'
import Head from 'next/head'

export default function MultiBotPage() {
  return (
    <>
      <Head>
        <title>プロジェクト可視化ボット</title>
        <meta name="description" content="プロジェクトの構造・タスク・依存関係の可視化を支援するAIボット" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MultiBotSelector />
    </>
  )
}
