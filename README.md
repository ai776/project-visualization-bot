# プロジェクト可視化ボット 🤖

プロジェクトの構造・タスク・依存関係の整理と可視化を支援するAIチャットボットです。

## ✨ 機能

- **チャットボット**: プロジェクトの目的、タスク、マイルストーン、依存関係などを整理・提案

## 🚀 クイックスタート

### 前提条件

- Node.js 16.x以上
- npm または yarn
- Dify APIキー（各機能ごとに必要）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/ai776/ryu-bot.git

# ディレクトリに移動
cd ryu-bot

# 依存関係のインストール
npm install
```

### 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定：

```bash
# 共通チャットAPI
DIFY_API_KEY=your_api_key
DIFY_API_URL=https://api.dify.ai/v1
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── ChatBot.tsx                 # ルート用チャットUI
│   ├── MultiBotSelector.tsx        # 1ボット選択（可視化ボット）
│   └── SettingsModal.tsx           # カスタムプロンプト設定
├── pages/
│   ├── api/
│   │   ├── chat.ts                 # 非ストリーミングAPI
│   │   └── chat-stream.ts          # ストリーミングAPI
│   ├── index.tsx                   # トップページ（ChatBot）
│   └── multi-bot.tsx               # 可視化ボットページ（任意）
└── styles/
    └── globals.css                 # グローバルスタイル
```

## 🌐 デプロイ

### Vercelへのデプロイ

Vercelへのデプロイにも対応しています。

1. GitHubリポジトリを作成
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## 🛠 技術スタック

- **Next.js** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Dify API** - AI機能の提供
- **Vercel** - ホスティング

## 📝 使い方

1. メッセージにプロジェクトの概要や課題を書いて送信
2. 提案されるWBS/タスク/優先度/次のアクションを確認
3. 必要に応じてカスタムプロンプトを設定（設定アイコンから）

## 🔧 カスタマイズ

### カスタムの工夫例

- 回答形式の指定（表形式、チェックリストなど）
- 制約条件（納期、予算、人数など）の明示

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 🤝 サポート

問題が発生した場合は、Issueを作成するか、ログ出力をご確認ください。

---

Built with ❤️
