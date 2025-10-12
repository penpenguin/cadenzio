# Cadenzio プロジェクト仕様

## プロダクト概要
- 名称: Cadenzio – ブラウザ完結型の音楽ループプレイヤー
- 目的: ローカル音声ファイルの任意区間を無限ループ再生し、集中や練習をサポートする
- 特徴: ファイルはクライアント側でのみ処理され、プライバシーと応答性を確保する

## 主なユースケース
- 語学学習や楽器練習で短いフレーズを繰り返し聴きたい
- 作業用BGMとして気に入った区間を無限ループしたい
- オフラインでも安定して再生したい（PWA対応）

## 主要機能
- 音声ファイルのインポート（`drag & drop` またはファイルダイアログ）
- 対応フォーマット: mp3 / wav / ogg / mp4 / aac / flac / webm など `audio/*` MIME
- 最大ファイルサイズ: 100MB
- Web Audio API による無限ループ再生、シーク、相対シーク（±5秒）
- デュアルハンドルスライダーでのループ区間設定（noUiSlider）
- 波形描画とプレイヘッド表示、ループ領域ハイライト
- オーディオビジュアライザ（周波数バー + パーティクル）
- 音量調整・ミュート、ショートカット (`Space`: 再生/一時停止, `M`: ミュート, `←/→`: ±5秒)
- エラートーストによるユーザ通知、ファイルクリア操作
- ライセンス情報モーダル

## ユーザーフロー
1. アプリ起動時にドロップゾーンが表示され、利用ガイドを提示
2. ファイル選択・ドロップ → `FileManager` がフォーマットとサイズを検証し、`AudioEngine` にArrayBufferを渡す
3. 読み込み成功で `AudioEngine` がAudioContextを初期化し、波形・ループスライダーを準備
4. 再生操作で無限ループ再生を開始し、波形プレイヘッドとプログレスバーが同期更新
5. ループハンドル操作で `loopStart/loopEnd` を更新し、波形上のハイライトを反映
6. ビジュアライザは周波数データを取得し、キャンバス描画を継続
7. ファイルクリアまたはエラー発生時にプレイヤーUIをリセットし、ドロップゾーンのみ表示

## アーキテクチャ概要
- **Astro 5.x** による単一ページ構成（`src/pages/index.astro`）
- ブラウザ実行モジュールを `src/scripts/` に集約
  - `app.js`: 全体オーケストレーション、イベント配線
  - `AudioEngine.js`: Web Audio APIラッパー。再生制御、ループ、音量、周波数解析を担当
  - `FileManager.js`: ファイル入力と検証、FileReader処理
  - `UIController.js`: DOM操作、noUiSlider初期化、トースト/モーダル管理
  - `WaveformRenderer.js`: 波形サンプリングと描画、プレイヘッド・ループ領域表示
  - `AudioVisualizer.js`: 背景ビジュアライザのキャンバス描画
  - `constants.js` / `utils.js`: 設定値とユーティリティ群
- スタイルは `src/styles/` に分割管理し、`main.css` でエントリポイントを集約

## オーディオ仕様
- `AudioContext` と `AudioBufferSourceNode` を再生の中心に使用
- ループ区間は `loopStart` / `loopEnd` プロパティで制御、最小ループ長は0.1秒
- 再生中のループ変更は即時反映、停止時は`pauseTime`にシーク位置を保持
- FFTサイズ256のアナライザで周波数データを提供し、平均値ベースのビジュアライザ制御
- `gainNode` を経由して音量調整・ミュート切り替えを実装

## UI / UX仕様
- ドロップゾーン全体がクリック可能で、ファイル選択ボタンを内包
- ループ情報は`開始/終了`の現在値とリセットボタンで構成
- プログレスバーは16ms周期で更新し、波形プレイヘッドと同期
- ミュート時にアイコンの交差ライン（`mute-path`）を表示
- エラー発生時は5秒表示のトーストでユーザに通知
- 設定ボタンからライセンスモーダルを開閉（`Escape`で閉じる）
- キーボードショートカットを`document`レベルでハンドリング

## PWA / 配信要件
- `public/manifest.json` により `start_url` を `/cadenzio/` に固定し、インストール可能
- `public/sw.js` でアプリシェルをキャッシュ（`cadenzio-v1`）し、オフラインフォールバックを提供
- `astro.config.mjs`・配信環境は GitHub Pages を想定、すべての静的アセットは `/cadenzio/` プレフィックスを持つ
- テーマカラーは `#5e4bb6`、背景カラーは `#1a1a2e`

## 開発・ビルドフロー
- `npm install` で依存関係を取得
- 主なスクリプト:
  - `npm run dev` / `npm run start`: 開発サーバー（ポート4321）
  - `npm run build`: 本番ビルド生成
  - `npm run preview`: ビルド済み出力のローカル確認
  - `npm run typecheck`: `astro check` による静的解析
  - `npm run lint` / `npm run lint:fix`: ESLint
  - `npm run format` / `npm run format:check`: Prettier
  - `npm run validate`: typecheck → lint → format:check の連鎖実行
- TypeScript設定は `tsconfig.json` に集約され、`@/*` などのパスエイリアスを提供
- 依存ライブラリ: Astro 5.x, noUiSlider 15.x（CSSはモジュール内部でimport）

## 非機能要件・品質基準
- パフォーマンス: LCP < 1.5s、JSバンドル < 50KB（CDN除外）を目標
- アクセシビリティ: WCAG 2.2 AA 相当、キーボード操作とARIAラベルを確保
- ブラウザ対応: 最新の Chrome / Edge / Firefox / Safari
- セキュリティ: HTTPS 配信前提、音声ファイルはサーバーへ送信しない
- フォールバック: Web Audio API 非対応ブラウザでは `<audio loop>` を想定（将来拡張）

## テストと開発プロセス
- Takuto Wada 流 TDD を厳守（Red → Green → Refactor の最小ステップ）
- バグ修正時は必ず回帰テストを追加し、特に AudioEngine と UIController の状態管理を重点的にカバー
- DOM 依存テストは Vitest + jsdom を利用し、`src/__tests__/` または対象モジュールと同階層の `__tests__/` へ配置
- テスト名は挙動ベース（例: `AudioEngine.looping.test.ts`）とし、観測可能な挙動のみ検証

## 今後の拡張アイデア（参考）
- ループプリセット保存（localStorage）
- ループ境界のクロスフェード（0.2秒）
- BPM 自動検出によるループ候補提示
- ループ開始/終了をURLパラメータとして共有

