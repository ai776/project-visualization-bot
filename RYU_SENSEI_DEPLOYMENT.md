# りゅう先生ボット デプロイメントガイド

このガイドでは、りゅう先生ボットアプリケーションを新しいGitHubリポジトリとVercelにデプロイする手順を説明します。

## 🎯 概要

現在のアプリケーションは山本さん用とりゅう先生用の両方のボットをサポートしています。このガイドに従って、りゅう先生用の独立したインスタンスをデプロイしてください。

## 📋 必要な環境変数

以下の環境変数をVercelで設定する必要があります：

### りゅう先生用の環境変数

```
# りゅう先生チャットボット
DIFY_RYU_API_KEY=（りゅう先生用チャットボットのDify APIキー）
DIFY_RYU_API_URL=https://api.dify.ai/v1

# りゅう先生X投稿作成
DIFY_RYU_X_API_KEY=（りゅう先生用X投稿作成のDify APIキー）
DIFY_RYU_X_API_URL=https://api.dify.ai/v1

# りゅう先生Facebook投稿作成
DIFY_RYU_FACEBOOK_API_KEY=（りゅう先生用Facebook投稿作成のDify APIキー）
DIFY_RYU_FACEBOOK_API_URL=https://api.dify.ai/v1

# りゅう先生自己紹介文作成
DIFY_RYU_PROFILE_API_KEY=（りゅう先生用自己紹介文作成のDify APIキー）
DIFY_RYU_PROFILE_API_URL=https://api.dify.ai/v1
```


## 🚀 デプロイ手順

### 1. GitHubリポジトリの作成

1. GitHubにログインして、新しいリポジトリを作成します
   - リポジトリ名: `ryu-bot`
   - プライベートリポジトリとして作成することを推奨

2. ローカルのプロジェクトをGitHubにプッシュ：

```bash
# 現在のディレクトリで初期化（すでにgit管理されている場合はスキップ）
git init

# すべてのファイルをステージング
git add .

# 初期コミット
git commit -m "Initial commit: りゅう先生ボット"

# メインブランチに切り替え
git branch -M main

# リモートリポジトリを追加（YOUR_USERNAMEを置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/ryu-bot.git

# プッシュ
git push -u origin main
```

### 2. Vercelでのデプロイ

1. [Vercel](https://vercel.com)にログインします

2. 「New Project」をクリック

3. GitHubリポジトリをインポート：
   - 先ほど作成した`ryu-bot`リポジトリを選択

4. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: そのまま（./）
   - **Build Command**: `npm run build`
   - **Output Directory**: そのまま
   - **Install Command**: `npm install`

5. 環境変数の設定：
   - 「Environment Variables」セクションで上記の環境変数を追加
   - 必ずりゅう先生用の環境変数（`DIFY_RYU_*`）を設定

6. 「Deploy」をクリック

### 3. デプロイ後の確認

1. デプロイが完了したら、提供されたURLにアクセス

2. `/multi-bot`ページにアクセスして、りゅう先生ボットが正常に動作することを確認

3. 各機能をテスト：
   - りゅう先生ボット（チャット）
   - X投稿作成
   - Facebook投稿作成
   - 自己紹介文作成

## 🔧 トラブルシューティング

### APIキーが正しく設定されていない場合

- Vercelのダッシュボードで環境変数を確認
- 環境変数を更新した後、デプロイを再実行

### ボットが応答しない場合

- ブラウザのコンソールでエラーを確認
- Vercelのログを確認（Functions タブ）
- Dify側でAPIキーが有効か確認

## 📝 ローカル開発

ローカルで開発する場合は、`.env.local`ファイルを作成：

```bash
# .env.local
DIFY_RYU_API_KEY=your_api_key_here
DIFY_RYU_API_URL=https://api.dify.ai/v1
DIFY_RYU_X_API_KEY=your_x_api_key_here
DIFY_RYU_X_API_URL=https://api.dify.ai/v1
DIFY_RYU_FACEBOOK_API_KEY=your_facebook_api_key_here
DIFY_RYU_FACEBOOK_API_URL=https://api.dify.ai/v1
DIFY_RYU_PROFILE_API_KEY=your_profile_api_key_here
DIFY_RYU_PROFILE_API_URL=https://api.dify.ai/v1
```

**注意**: `.env.local`ファイルは絶対にGitにコミットしないでください！

## 🔐 セキュリティ注意事項

- APIキーは絶対に公開しない
- `.env.local`ファイルは`.gitignore`に含める
- プロダクション環境では環境変数を使用

## 📚 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Dify Documentation](https://docs.dify.ai)

## ✅ チェックリスト

デプロイ前に以下を確認してください：

- [ ] Difyでりゅう先生用のAPIキーを4つ作成済み
- [ ] GitHubリポジトリを作成済み
- [ ] Vercelアカウントを作成済み
- [ ] 環境変数を正しく設定済み
- [ ] ローカルでテスト済み

---

何か問題がある場合は、このドキュメントを参照してトラブルシューティングを行ってください。
