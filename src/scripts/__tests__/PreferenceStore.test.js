import { beforeEach, describe, expect, it } from 'vitest';

import { AUDIO_CONFIG, STORAGE_KEYS } from '../constants.js';
import PreferenceStore from '../PreferenceStore.js';

const createMemoryStorage = () => {
  const map = new Map();
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: key => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
};

describe('PreferenceStore', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it('falls back to default values when storage is empty', () => {
    const store = new PreferenceStore({ storage });
    const state = store.load();

    expect(state.loopStart).toBe(0);
    expect(state.loopEnd).toBe(null);
    expect(state.volume).toBe(AUDIO_CONFIG.DEFAULT_VOLUME);
    expect(state.isMuted).toBe(false);
    expect(state).not.toHaveProperty('presets');
    expect(state).not.toHaveProperty('activePresetId');
  });

  it('persists sanitized state when save is called', () => {
    const store = new PreferenceStore({ storage });
    const payload = {
      loopStart: 1.5,
      loopEnd: 12.3,
      volume: 0.9,
      isMuted: true,
    };

    store.save(payload);

    const stored = JSON.parse(storage.getItem(STORAGE_KEYS.PLAYER_STATE));
    expect(stored).toMatchObject(payload);
    expect(stored).not.toHaveProperty('presets');
    expect(stored).not.toHaveProperty('activePresetId');
  });

  it('surfaces storage errors when setItem throws', () => {
    const throwingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
      removeItem: () => {},
      clear: () => {},
    };
    const store = new PreferenceStore({ storage: throwingStorage });

    expect(() => {
      store.save({ volume: 0.4 });
    }).toThrow('quota exceeded');
  });

  it('returns defaults when stored JSON is invalid', () => {
    storage.setItem(STORAGE_KEYS.PLAYER_STATE, '{invalid json');
    const store = new PreferenceStore({ storage });

    const state = store.load();

    expect(state.loopStart).toBe(0);
    expect(state.loopEnd).toBe(null);
    expect(state.volume).toBe(AUDIO_CONFIG.DEFAULT_VOLUME);
    expect(state.schemaVersion).toBeGreaterThanOrEqual(1);
  });
});
