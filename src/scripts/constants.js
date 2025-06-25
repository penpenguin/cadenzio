/**
 * Application constants and configuration
 */

// Audio Configuration
export const AUDIO_CONFIG = {
  FFT_SIZE: 256,
  MIN_LOOP_DURATION: 0.1, // seconds
  SEEK_STEP: 5, // seconds
  DEFAULT_VOLUME: 0.5,
  GAIN_TRANSITION_TIME: 0.01, // seconds for smooth volume changes
};

// UI Configuration
export const UI_CONFIG = {
  PROGRESS_UPDATE_INTERVAL: 16, // ~60fps
  ERROR_TOAST_DURATION: 5000, // milliseconds
  DEBOUNCE_RESIZE_DELAY: 250, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
};

// Waveform Configuration
export const WAVEFORM_CONFIG = {
  HEIGHT: 120, // pixels
  AMPLITUDE_SCALE: 0.8, // scale factor for waveform amplitude
  PLAYHEAD_WIDTH: 2, // pixels
  BORDER_RADIUS: 12, // pixels
};

// Visualizer Configuration
export const VISUALIZER_CONFIG = {
  PARTICLE_COUNT: 50,
  FADE_ALPHA: 0.25,
  BAR_WIDTH_MULTIPLIER: 2.5,
  BAR_HEIGHT_SCALE: 0.7,
  HUE_BASE: 280,
  HUE_RANGE: 60,
  PARTICLE_SIZE_MIN: 1,
  PARTICLE_SIZE_MAX: 3,
  PARTICLE_VELOCITY_RANGE: 0.5,
};

// File Configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_FORMATS: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/webm'
  ],
};

// Color Configuration
export const COLORS = {
  PRIMARY: '#5e4bb6',
  PRIMARY_DARK: '#4a3c91',
  SECONDARY: '#e74c3c',
  BACKGROUND: '#0f0f23',
  SURFACE: 'rgba(255, 255, 255, 0.05)',
  SURFACE_HOVER: 'rgba(255, 255, 255, 0.08)',
  GLASS: 'rgba(255, 255, 255, 0.1)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.2)',
  TEXT: '#eee',
  TEXT_DIM: '#aaa',
};

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ',
  MUTE: ['m', 'M'],
  SEEK_BACKWARD: 'ArrowLeft',
  SEEK_FORWARD: 'ArrowRight',
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  WAVEFORM_SAMPLES_MAX: 2048,
  RENDER_THROTTLE_MS: 16, // ~60fps
  RESIZE_DEBOUNCE_MS: 250,
  PROGRESS_UPDATE_THROTTLE_MS: 16,
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: '選択されたファイルは音声ファイルではありません',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます（100MB以下にしてください）',
  LOAD_FAILED: 'ファイルの読み込みに失敗しました',
  AUDIO_PROCESSING_FAILED: '音声ファイルの処理に失敗しました',
  BROWSER_NOT_SUPPORTED: 'このブラウザは対応していません',
  INIT_FAILED: 'アプリケーションの初期化に失敗しました',
};

// Development Configuration
export const DEV_CONFIG = {
  DEBUG_LOGGING: false, // Set to true for development
  PERFORMANCE_MONITORING: false,
  ERROR_REPORTING: true,
};