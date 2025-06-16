# Cadenzio - 音楽ループプレイヤー

ローカル音楽ファイルの任意区間を無限ループ再生できるWebアプリケーション

## 機能

- 🎵 音楽ファイルのローカル再生（mp3, wav, ogg対応）
- 🔁 任意区間の無限ループ再生
- 📱 ドラッグ&ドロップでファイル選択
- 🎚️ 音量調整とミュート機能
- ⌨️ キーボードショートカット対応
- 📱 レスポンシブデザイン

## 技術スタック

- [Astro](https://astro.build/) - 静的サイトジェネレーター
- Web Audio API - 高度な音声処理
- noUiSlider - ループ区間指定UI
- TypeScript - 型安全性

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## デプロイ

GitHub Pagesへの自動デプロイが設定されています。`main`ブランチへのプッシュで自動的にビルド・デプロイされます。

## ライセンス

MIT