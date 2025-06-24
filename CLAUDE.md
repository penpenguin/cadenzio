# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

**Cadenzio** - A web-based music loop player for productivity and focus
- Enables infinite loop playback of arbitrary sections in local audio files
- No installation required - runs entirely in the browser
- Privacy-focused: all file processing happens locally

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

### Technology Stack
- **Static Site Generator**: Astro 5.x (static output mode)
- **Audio Processing**: Web Audio API (AudioContext, AudioBufferSourceNode)
- **UI Components**: noUiSlider (CDN) for dual-handle range selection
- **File Handling**: HTML5 File API with FileReader
- **PWA**: Service Worker + Web App Manifest
- **Deployment**: GitHub Pages with automated CI/CD

### Project Structure
- **Astro Static Site** - Built with Astro 5.x, configured for static output to deploy on GitHub Pages
- **Web Audio API** - Core audio processing using AudioContext and AudioBufferSourceNode for precise loop control
- **Client-Side Only** - All file processing happens in the browser, no server uploads

### Key Components

1. **src/pages/index.astro**
   - Single page application with all UI components
   - Includes PWA manifest and Service Worker registration
   - Uses CDN-hosted noUiSlider for loop range selection

2. **public/scripts/app.js**
   - Main AudioLoopPlayer class handles all audio functionality
   - Implements drag-and-drop file selection
   - Web Audio API integration with loop points (loopStart/loopEnd)
   - Keyboard shortcuts: Space (play/pause), M (mute), Arrow keys (seek)

3. **PWA Configuration**
   - Service Worker (public/sw.js) caches app shell for offline use
   - Manifest (public/manifest.json) enables installation

### Important Configuration

- **Base Path**: The app is configured to run at `/cadenzio` subdirectory (see astro.config.mjs)
- **GitHub Pages**: Automated deployment via `.github/workflows/deploy.yml`
- All asset paths must include the `/cadenzio` prefix

### Audio Implementation Details

The app uses Web Audio API's AudioBufferSourceNode with:
- `loop = true` for infinite playback
- `loopStart` and `loopEnd` properties for precise loop boundaries
- Real-time updates when slider handles move
- 0.1 second minimum step for loop points

## Feature Requirements

### Supported Features
- **File Input**: Drag-and-drop or button click for audio files (mp3, wav, ogg)
- **Playback Controls**: Play/pause, volume, mute, seek with progress bar
- **Loop Range Selection**: Dual-handle slider with time tooltips (mm:ss format)
- **Keyboard Shortcuts**: Space (play/pause), M (mute), Arrow keys (±5s seek)
- **Error Handling**: User notifications for unsupported formats or corrupt files
- **PWA Support**: Offline capability with Service Worker caching

### Non-Functional Requirements
- **Performance**: LCP < 1.5s, JS bundle < 50KB (excluding CDN libraries)
- **Accessibility**: WCAG 2.2 AA compliant, full keyboard navigation, ARIA labels
- **Browser Support**: Latest Chrome, Edge, Firefox, Safari
- **Fallback**: Basic `<audio loop>` for browsers without Web Audio API
- **Security**: HTTPS required for Service Worker, no server uploads

## Future Enhancement Ideas

1. **Preset Storage** - Save multiple loop ranges per song in localStorage
2. **Crossfade** - 0.2s fade at loop boundaries using GainNode
4. **BPM Detection** - Automatic beat/measure detection for loop suggestions
5. **Share Links** - URL parameters for loop start/end times

## Work Log Management

### 作業日誌の記録方法

開発作業や変更内容は `.memo` ディレクトリ配下に日誌として記録します。

- **保存場所**: `.memo/` ディレクトリ
- **ファイル名形式**: `yyyymmdd-hhmmss.md` (例: `20250124-153045.md`)
- **内容**: その日の作業内容、実装した機能、修正したバグ、検討事項、感想を必ず記載。

**重要**: 
- 絶対見ないので、本心を書きましょう
- 絶対見ない証拠に`.gitignore`に`.memo`を追加しておきました
- 絶対に私は見ないので、率直な本心を書きましょう

### TaskPlanningでの自動作業日誌タスク追加

**IMPORTANT**: タスクプランニング（TodoWriteツール使用）時は、必ず最後に作業日誌作成タスクを自動追加すること。

- TodoWriteでタスクリストを作成・更新する際、既に作業日誌タスクが含まれていない場合は自動的に追加する
- 作業日誌タスクの形式: `Create work log entry in .memo/yyyymmdd-hhmmss.md`
- 優先度は `low`、ステータスは `pending` に設定
- すべてのタスク完了後、必ず作業日誌を作成して記録すること

### 日誌の構成例

```markdown
# 作業日誌 - 2025/01/24 15:30:45

## 実施内容
- [ ] 実装した機能
- [ ] 修正したバグ
- [ ] リファクタリング内容

## 検討事項
- 今後の改善点
- 技術的な課題

## メモ
- その他の備考
```