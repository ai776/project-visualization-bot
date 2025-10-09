# 🚀 りゅう先生ボット クイックスタートガイド

## ステップ1: Dify APIキーの準備

Difyで以下の4つのアプリケーションを作成し、それぞれのAPIキーを取得してください：

1. りゅう先生チャットボット
2. りゅう先生X投稿作成
3. りゅう先生Facebook投稿作成
4. りゅう先生自己紹介文作成

## ステップ2: GitHubリポジトリの作成と設定

```bash
# 1. GitHubで新しいリポジトリを作成（名前: ryu-bot）

# 2. ローカルでGitを初期化
git init

# 3. ファイルをステージング
git add .

# 4. 初期コミット
git commit -m "Initial commit: りゅう先生ボット"

# 5. リモートリポジトリを追加
git remote add origin https://github.com/ai776/ryu-bot.git

# 6. プッシュ
git push -u origin main
```

## ステップ3: Vercelでのデプロイ

### 3.1 Vercelプロジェクトの作成
1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリ（ryu-bot）を選択

### 3.2 環境変数の設定
Vercelの設定画面で以下の環境変数を追加：

```
DIFY_RYU_API_KEY=（取得したAPIキー）
DIFY_RYU_API_URL=https://api.dify.ai/v1
DIFY_RYU_X_API_KEY=（取得したAPIキー）
DIFY_RYU_X_API_URL=https://api.dify.ai/v1
DIFY_RYU_FACEBOOK_API_KEY=（取得したAPIキー）
DIFY_RYU_FACEBOOK_API_URL=https://api.dify.ai/v1
DIFY_RYU_PROFILE_API_KEY=（取得したAPIキー）
DIFY_RYU_PROFILE_API_URL=https://api.dify.ai/v1
```

### 3.3 デプロイ実行
「Deploy」ボタンをクリックして、デプロイを開始

## ステップ4: 動作確認

1. デプロイ完了後、提供されたURLにアクセス
2. `/multi-bot`ページを開く
3. 「りゅう先生ボット」を選択
4. メッセージを送信して動作を確認

## 📋 チェックリスト

- [ ] Difyで4つのアプリケーションを作成
- [ ] 各アプリケーションのAPIキーを取得
- [ ] GitHubリポジトリを作成
- [ ] Vercelにプロジェクトを作成
- [ ] 環境変数を設定
- [ ] デプロイ完了
- [ ] 動作確認

## 🆘 トラブルシューティング

### ボットが応答しない
- 環境変数が正しく設定されているか確認
- DifyのAPIキーが有効か確認
- Vercelのログを確認

### エラーが表示される
- ブラウザのコンソールを確認
- Vercel Functionsのログを確認

詳細は[RYU_SENSEI_DEPLOYMENT.md](./RYU_SENSEI_DEPLOYMENT.md)を参照してください。
