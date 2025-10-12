# Repository Guidelines

Cadenzio is an Astro 5.x web audio loop player that runs entirely in the browser to keep audio processing private and responsive.

## Project Structure & Module Organization
- `src/pages/index.astro` renders the single-page shell and registers the PWA manifest.
- `src/scripts/` houses modules such as `AudioEngine.js`, `UIController.js`, `WaveformRenderer.js`, plus shared helpers in `utils.js`.
- `src/styles/` stores shared tokens; update them before adjusting component-level colors.
- `public/` contains static assets (icons, service worker, manifest); `dist/`と`.astro/`はビルド生成物なので編集しないこと。
- 主要設定は `astro.config.mjs` と `tsconfig.json` にまとめられている。ベースパスやパスエイリアス変更時は両方を同期させる。

## Build, Test, and Development Commands
- `npm install`: 依存関係のインストール。
- `npm run dev` (port 4321): 開発サーバー起動。`npm run start` は同義。
- `npm run build` → `npm run preview`: GitHub Pages が配信する本番バンドルを生成・確認。
- `npm run typecheck`: `astro check` で TypeScript 静的解析。
- `npm run lint` / `npm run lint:fix`: ESLint を `.js/.ts/.astro` に適用し、必要に応じて自動修正。
- `npm run format:check` / `npm run format`: Prettier のフォーマット確認/適用。
- `npm run validate`: typecheck → lint → format:check を連鎖実行する事前ゲート。
- `npm run clean`: `dist/` と `.astro/` を削除してクリーンビルド。

## Coding Style & Naming Conventions
- インデントは 2 スペース、セミコロンあり、末尾カンマは ESLint/Prettier に従う。
- クラスは PascalCase、関数・変数は camelCase、共有定数は SCREAMING_SNAKE_CASE。
- Astro テンプレートは宣言的に保ち、ブラウザロジックは `src/scripts/` に集約し `utils.js` を再利用する。

## Testing Guidelines
- Takuto Wada 流 TDD を厳守：最小の失敗テスト → 実装 → リファクタリング。
- DOM 依存コードは Vitest + jsdom を想定し、`src/__tests__/` または同階層の `__tests__/` に配置。
- ファイル名は挙動ベースにする（例: `AudioEngine.looping.test.ts`）。観測可能な結果のみ検証。
- バグ修正前に回帰テストを追加し、`AudioEngine` や `UIController` の状態管理周辺のカバレッジを強化する。

## Commit & Pull Request Guidelines
- コミットは履歴に倣い `type: summary` 形式（`feat:`, `fix:`, `refactor:` など）で現在形・簡潔に記述。
- PR では関連 Issue、変更範囲、実行済みコマンド（`npm run validate` など）、UI 変更時のスクリーンショットや録画を共有。
- 変更は小さくまとめ、実施した TDD ステップやリスク・フォローアップを説明してレビュアーの判断を助ける。
