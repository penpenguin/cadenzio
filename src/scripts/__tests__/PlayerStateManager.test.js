import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlayerStateManager from '../PlayerStateManager.js';
import { STORAGE_SCHEMA } from '../constants.js';

const buildState = (overrides = {}) => ({
  loopStart: 2,
  loopEnd: 8,
  volume: 0.75,
  isMuted: false,
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
      duration: 0,
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

  it('hydrates audio and UI using stored state', () => {
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    const state = manager.hydrate();

    expect(state.loopStart).toBe(2);
    expect(state.loopEnd).toBe(8);
    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(2, 8);
    expect(audioEngine.setVolume).toHaveBeenCalledWith(0.75);
    expect(ui.setLoopHandles).toHaveBeenCalledWith(2, 8);
    expect(ui.updateLoopDisplay).toHaveBeenCalledWith(2, 8);
    expect(ui.updateVolumeSlider).toHaveBeenCalledWith(0.75);
    expect(ui.updateMuteButton).toHaveBeenCalledWith(false);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('falls back to audio duration when loop end is missing', () => {
    audioEngine.duration = 120;
    store.load.mockReturnValueOnce(
      buildState({
        loopStart: 5,
        loopEnd: null,
      })
    );

    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();

    expect(audioEngine.setLoopPoints).toHaveBeenCalledWith(5, 120);
    expect(ui.setLoopHandles).toHaveBeenCalledWith(5, 120);
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

  it('persists every volume change and clears mute when volume increases', () => {
    store.save.mockImplementation(next => next);
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    audioEngine.setVolume.mockClear();
    ui.updateVolumeSlider.mockClear();
    ui.updateMuteButton.mockClear();
    store.save.mockClear();

    manager.updateVolume(0.3);

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({
        volume: 0.3,
        isMuted: false,
      })
    );
    expect(audioEngine.setVolume).toHaveBeenCalledWith(0.3);
    expect(ui.updateVolumeSlider).toHaveBeenCalledWith(0.3);
    expect(ui.updateMuteButton).toHaveBeenCalledWith(false);

    manager.updateVolume(0);

    expect(store.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        volume: 0,
      })
    );
    expect(audioEngine.setVolume).toHaveBeenLastCalledWith(0);
  });

  it('toggles mute state and persists the change', () => {
    store.save.mockImplementation(next => next);
    const manager = new PlayerStateManager({
      audioEngine,
      ui,
      store,
      onError: errorHandler,
    });

    manager.hydrate();
    audioEngine.setVolume.mockClear();
    ui.updateMuteButton.mockClear();
    store.save.mockClear();

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
});
