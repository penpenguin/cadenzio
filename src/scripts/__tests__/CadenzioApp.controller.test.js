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
    onPresetSelect: vi.fn(cb => {
      callbacks.presetSelect = cb;
    }),
    onPresetSave: vi.fn(cb => {
      callbacks.presetSave = cb;
    }),
    onPresetDelete: vi.fn(cb => {
      callbacks.presetDelete = cb;
    }),
    onPresetReset: vi.fn(cb => {
      callbacks.presetReset = cb;
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
    clearPresetName: vi.fn(),
    getPresetName: vi.fn(() => 'New Preset'),
    setPresetOptions: vi.fn(),
    setPresetNamePlaceholder: vi.fn(),
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
      presets: [],
      activePresetId: null,
      volume: 0.5,
      isMuted: false,
    })),
    state: {
      loopStart: 0,
      loopEnd: null,
      presets: [],
      activePresetId: null,
      volume: 0.5,
      isMuted: false,
    },
    updateLoop: vi.fn(),
    updateVolume: vi.fn(),
    toggleMute: vi.fn(),
    resetPresets: vi.fn(),
    createPreset: vi.fn(() => ({ loopStart: 0, loopEnd: null })),
    selectPreset: vi.fn(() => ({ loopStart: 1, loopEnd: 2 })),
    deletePreset: vi.fn(),
    getActivePreset: vi.fn(() => ({
      loopStart: 0,
      loopEnd: null,
      name: 'Last Session',
      isMuted: false,
    })),
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
    const { stateManager, ui } = createApp();
    expect(stateManager.hydrate).toHaveBeenCalledTimes(1);
    expect(ui.setPresetOptions).toHaveBeenCalledWith([], null);
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

  it('delegates preset save to the state manager', () => {
    const { app, stateManager, ui } = createApp();
    app.handlePresetSave();
    expect(stateManager.createPreset).toHaveBeenCalledWith({ name: 'New Preset' });
    expect(ui.clearPresetName).toHaveBeenCalled();
  });

  it('surfaces storage errors to the UI', () => {
    const { app, ui } = createApp();
    const error = new Error('quota');
    app.handleStorageError(error);
    expect(ui.showError).toHaveBeenCalledWith(ERROR_MESSAGES.STORAGE_WRITE_FAILED);
  });
});
