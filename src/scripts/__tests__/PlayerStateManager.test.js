import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlayerStateManager from '../PlayerStateManager.js';
import { STORAGE_SCHEMA } from '../constants.js';

const buildState = (overrides = {}) => ({
  loopStart: 2,
  loopEnd: 8,
  volume: 0.75,
  isMuted: false,
  presets: [
    {
      id: 'preset-1',
      name: 'Chorus',
      loopStart: 2,
      loopEnd: 8,
      volume: 0.75,
      isMuted: false,
    },
  ],
  activePresetId: 'preset-1',
  schemaVersion: STORAGE_SCHEMA.VERSION,
  ...overrides,
});

describe('PlayerStateManager', () => {
  let audioEngine;
  let ui;
  let store;
  let errorHandler;

  beforeEach(() => {
    audioEngine = {
      setLoopPoints: vi.fn(),
      setVolume: vi.fn(),
    };
    ui = {
      setLoopHandles: vi.fn(),
      updateLoopDisplay: vi.fn(),
      updateVolumeSlider: vi.fn(),
      updateMuteButton: vi.fn(),
    };
    store = {
      load: vi.fn(() => buildState()),
      save: vi.fn(),
    };
    errorHandler = vi.fn();
  });

  it('hydrates audio and UI with the active preset', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    const state = manager.hydrate();

    expect(state.activePresetId).toBe('preset-1');
    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(2, 8);
    expect(audioEngine.setVolume).toHaveBeenCalledWith(0.75);
    expect(ui.setLoopHandles).toHaveBeenCalledWith(2, 8);
    expect(ui.updateLoopDisplay).toHaveBeenCalledWith(2, 8);
    expect(ui.updateVolumeSlider).toHaveBeenCalledWith(0.75);
    expect(ui.updateMuteButton).toHaveBeenCalledWith(false);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('persists loop updates and refreshes UI', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    audioEngine.setLoopPoints.mockClear();
    ui.setLoopHandles.mockClear();
    ui.updateLoopDisplay.mockClear();
    store.save.mockImplementation(next => next);

    manager.updateLoop(4, 12);

    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(4, 12);
    expect(ui.setLoopHandles).toHaveBeenCalledWith(4, 12);
    expect(ui.updateLoopDisplay).toHaveBeenCalledWith(4, 12);
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        loopStart: 4,
        loopEnd: 12,
      })
    );
  });

  it('persists volume updates and handles mute state', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    audioEngine.setVolume.mockClear();
    ui.updateVolumeSlider.mockClear();
    store.save.mockImplementation(next => next);

    manager.updateVolume(0.3);

    expect(audioEngine.setVolume).toHaveBeenCalledWith(0.3);
    expect(ui.updateVolumeSlider).toHaveBeenCalledWith(0.3);
    expect(ui.updateMuteButton).toHaveBeenLastCalledWith(false);
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        volume: 0.3,
        isMuted: false,
      })
    );
  });

  it('notifies error handler when persistence fails', () => {
    store.save.mockImplementation(() => {
      throw new Error('quota');
    });

    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    errorHandler.mockClear();

    manager.updateLoop(5, 10);

    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    expect(manager.state.loopStart).toBe(5);
    expect(manager.state.loopEnd).toBe(10);
  });

  it('resets presets to default state', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    store.save.mockImplementation(next => next);
    audioEngine.setLoopPoints.mockClear();
    ui.setLoopHandles.mockClear();
    ui.updateVolumeSlider.mockClear();

    manager.resetPresets();

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        presets: [],
        activePresetId: null,
        loopStart: 0,
        isMuted: false,
      })
    );
    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(0, 0);
    expect(ui.setLoopHandles).toHaveBeenCalledWith(0, 0);
    expect(ui.updateVolumeSlider).toHaveBeenCalledWith(expect.any(Number));
  });

  it('toggles mute state and persists the change', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    store.save.mockImplementation(next => next);
    audioEngine.setVolume.mockClear();
    ui.updateMuteButton.mockClear();

    manager.toggleMute();

    expect(audioEngine.setVolume).toHaveBeenCalledWith(0);
    expect(ui.updateMuteButton).toHaveBeenCalledWith(true);
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isMuted: true,
      })
    );

    manager.toggleMute();

    expect(ui.updateMuteButton).toHaveBeenLastCalledWith(false);
  });

  it('creates a new preset and activates it', () => {
    store.load.mockReturnValueOnce(
      buildState({
        presets: [],
        activePresetId: null,
      })
    );
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    store.save.mockImplementation(next => next);
    audioEngine.setLoopPoints.mockClear();
    ui.setLoopHandles.mockClear();

    const preset = manager.createPreset({ name: 'Solo Practice' });

    expect(preset.name).toBe('Solo Practice');
    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        presets: expect.arrayContaining([
          expect.objectContaining({ id: preset.id, name: 'Solo Practice' }),
        ]),
        activePresetId: preset.id,
      })
    );
    expect(audioEngine.setLoopPoints).toHaveBeenCalled();
    expect(ui.setLoopHandles).toHaveBeenCalled();
  });

  it('selects an existing preset and applies its settings', () => {
    const extendedState = buildState({
      presets: [
        {
          id: 'preset-1',
          name: 'Chorus',
          loopStart: 2,
          loopEnd: 8,
          volume: 0.75,
          isMuted: false,
        },
        {
          id: 'preset-2',
          name: 'Bridge',
          loopStart: 10,
          loopEnd: 20,
          volume: 0.5,
          isMuted: true,
        },
      ],
      activePresetId: 'preset-1',
    });
    store.load.mockReturnValueOnce(extendedState);
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    store.save.mockImplementation(next => next);
    audioEngine.setLoopPoints.mockClear();
    ui.setLoopHandles.mockClear();
    ui.updateMuteButton.mockClear();

    manager.selectPreset('preset-2');

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        activePresetId: 'preset-2',
      })
    );
    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(10, 20);
    expect(ui.updateMuteButton).toHaveBeenCalledWith(true);
  });

  it('deletes a preset and falls back gracefully', () => {
    const extendedState = buildState({
      presets: [
        {
          id: 'preset-1',
          name: 'Chorus',
          loopStart: 2,
          loopEnd: 8,
          volume: 0.75,
          isMuted: false,
        },
        {
          id: 'preset-2',
          name: 'Bridge',
          loopStart: 10,
          loopEnd: 20,
          volume: 0.5,
          isMuted: false,
        },
      ],
      activePresetId: 'preset-2',
    });
    store.load.mockReturnValueOnce(extendedState);
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    store.save.mockImplementation(next => next);
    audioEngine.setLoopPoints.mockClear();

    manager.deletePreset('preset-2');

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        presets: [expect.objectContaining({ id: 'preset-1' })],
        activePresetId: 'preset-1',
      })
    );
    expect(manager.state.presets).toHaveLength(1);
    expect(manager.state.activePresetId).toBe('preset-1');
  });
});
