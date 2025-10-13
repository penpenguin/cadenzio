import { describe, expect, it, vi } from 'vitest';

import CadenzioApp from '../app.js';
import { ERROR_MESSAGES } from '../constants.js';

const createApp = () => {
  const callbacks = {};
  const audioEngine = {
    audioBuffer: {},
    isPlaying: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    duration: 1,
  };
  const fileManager = {
    setCallbacks: vi.fn(),
    loadFile: vi.fn(),
    clearFile: vi.fn(),
  };
  const ui = {
    onFileSelect: vi.fn(cb => {
      callbacks.fileSelect = cb;
    }),
    onFileClear: vi.fn(cb => {
      callbacks.fileClear = cb;
    }),
    onDragOver: vi.fn(cb => {
      callbacks.dragOver = cb;
    }),
    onDragLeave: vi.fn(cb => {
      callbacks.dragLeave = cb;
    }),
    onDrop: vi.fn(cb => {
      callbacks.drop = cb;
    }),
    onPlayToggle: vi.fn(cb => {
      callbacks.playToggle = cb;
    }),
    onSeek: vi.fn(cb => {
      callbacks.seek = cb;
    }),
    onVolumeChange: vi.fn(cb => {
      callbacks.volume = cb;
    }),
    onMuteToggle: vi.fn(cb => {
      callbacks.mute = cb;
    }),
    onLoopReset: vi.fn(cb => {
      callbacks.loopReset = cb;
    }),
    onKeyboard: vi.fn(cb => {
      callbacks.keyboard = cb;
    }),
    handleVolumeChange: vi.fn((event, cb) => cb(event?.target?.value ?? 0.5)),
    handleSeekClick: vi.fn(),
    setFileName: vi.fn(),
    showPlayer: vi.fn(),
    hidePlayer: vi.fn(),
    updateDuration: vi.fn(),
    updatePlayButton: vi.fn(),
    updateCurrentTime: vi.fn(),
    updateProgress: vi.fn(),
    updateVolumeSlider: vi.fn(),
    updateMuteButton: vi.fn(),
    updateLoopDisplay: vi.fn(),
    initializeLoopSlider: vi.fn(),
    resetLoopSlider: vi.fn(),
    addDragOverStyle: vi.fn(),
    removeDragOverStyle: vi.fn(),
    clearFileInput: vi.fn(),
    showError: vi.fn(),
  };
  const waveformRenderer = {
    setSeekCallback: vi.fn(),
    resize: vi.fn(),
    generate: vi.fn(),
    updateLoopRegion: vi.fn(),
    hidePlayhead: vi.fn(),
    updatePlayhead: vi.fn(),
  };
  const audioVisualizer = {
    start: vi.fn(),
    stop: vi.fn(),
  };
  const stateManager = {
    hydrate: vi.fn(() => ({
      loopStart: 0,
      loopEnd: null,
      volume: 0.5,
      isMuted: false,
    })),
    state: {
      loopStart: 0,
      loopEnd: null,
      volume: 0.5,
      isMuted: false,
    },
    updateLoop: vi.fn(),
    updateVolume: vi.fn(),
    toggleMute: vi.fn(),
  };

  const app = new CadenzioApp({
    audioEngine,
    fileManager,
    ui,
    waveformRenderer,
    audioVisualizer,
    stateManager,
  });

  return {
    app,
    audioEngine,
    fileManager,
    ui,
    waveformRenderer,
    audioVisualizer,
    stateManager,
    callbacks,
  };
};

describe('CadenzioApp controller behaviour', () => {
  it('hydrates state during initialization', () => {
    const { stateManager } = createApp();
    expect(stateManager.hydrate).toHaveBeenCalledTimes(1);
  });

  it('plays and pauses through togglePlayPause', async () => {
    const { app, audioEngine, ui } = createApp();
    audioEngine.audioBuffer = {};
    audioEngine.isPlaying = false;

    await app.togglePlayPause();

    expect(audioEngine.play).toHaveBeenCalled();
    expect(ui.updatePlayButton).toHaveBeenCalledWith(true);

    audioEngine.isPlaying = true;
    app.togglePlayPause();

    expect(audioEngine.pause).toHaveBeenCalled();
    expect(ui.updatePlayButton).toHaveBeenCalledWith(false);
  });

  it('delegates volume changes to the state manager', () => {
    const { callbacks, stateManager } = createApp();

    callbacks.volume?.({ target: { value: 0.8 } });

    expect(stateManager.updateVolume).toHaveBeenCalledWith(0.8);
  });

  it('replays pending loop state after slider initialization', () => {
    const { app, stateManager } = createApp();
    const pendingState = { loopStart: 6, loopEnd: 18, volume: 0.5, isMuted: false };

    app.pendingLoopState = pendingState;
    stateManager.updateLoop.mockClear();
    app.audioEngine.duration = 120;

    app.handleLoopUpdate([0, 120]);

    expect(stateManager.updateLoop).not.toHaveBeenCalled();

    app.applyPendingLoopState();

    expect(stateManager.updateLoop).toHaveBeenCalledTimes(1);
    expect(stateManager.updateLoop).toHaveBeenCalledWith(6, 18);
  });

  it('surfaces storage errors to the UI', () => {
    const { app, ui } = createApp();
    const error = new Error('quota');
    app.handleStorageError(error);
    expect(ui.showError).toHaveBeenCalledWith(ERROR_MESSAGES.STORAGE_WRITE_FAILED);
  });
});
