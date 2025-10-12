# Cadenzio - 音楽ループプレイヤー

ローカル音楽ファイルの任意区間を無限ループ再生し、練習や耳コピを効率化できるブラウザアプリです。

## デモ

- GitHub Pages: [https://penpenguin.github.io/cadenzio](https://penpenguin.github.io/cadenzio)

GitHub Pages 上でホストしているため、インストール不要で即座に利用できます。ローカルファイルしか扱わないため音声データは端末外に送信されません。

## 主な特徴

- 🎵 mp3 / wav / ogg などのローカル音源を高速ロード
- 🔁 波形ビュー上で任意区間を指定し無限ループ再生
- 🎚️ 音量・ミュート・ループ区間の微調整を UI から操作
- ⌨️ 再生・停止・ループ設定をショートカットキーで制御
- 📱 モバイル・タブレットでも使いやすいレスポンシブ設計

## PWA として使う

Cadenzio は PWA (Progressive Web App) 対応しています。対応ブラウザで以下の手順を行うと、アプリのようにホーム画面やアプリケーションランチャーから起動できます。

1. [デモページ](https://penpenguin.github.io/cadenzio) を開く
2. ブラウザの「インストール」または「ホーム画面に追加」を選択
3. 次回以降は独立したウィンドウで起動し、初回アクセス後はキャッシュされた UI がオフラインでも動作

音声ファイルは端末からの選択が必要なため、完全なオフライン利用時は事前にローカルファイルを用意してください。

## 技術スタック

- [Astro 5.x](https://astro.build/) による静的サイト構成
- Web Audio API を用いたループ再生エンジン
- [noUiSlider](https://refreshless.com/nouislider/) による区間指定 UI
- TypeScript + ESLint + Prettier による型安全なフロントエンド

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー (http://localhost:4321)
npm run dev

# 型チェック・Lint・フォーマット検査
npm run validate

# プロダクションビルド
npm run build

# ビルド成果物のプレビュー
npm run preview
```

## デプロイ

`main` ブランチへのプッシュで GitHub Actions が実行され、Astro の静的ビルドを生成して [GitHub Pages](https://penpenguin.github.io/cadenzio) に自動デプロイします。設定値は `astro.config.mjs` の `site` と `base` にまとめています。

## ライセンス

MIT

