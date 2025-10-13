import { AUDIO_CONFIG, STORAGE_KEYS, STORAGE_SCHEMA } from './constants.js';

const DEFAULT_STATE = Object.freeze({
  loopStart: 0,
  loopEnd: null,
  volume: AUDIO_CONFIG.DEFAULT_VOLUME,
  isMuted: false,
  schemaVersion: STORAGE_SCHEMA.VERSION,
});

/**
 * PreferenceStore wraps persistent storage for player state.
 */
class PreferenceStore {
  constructor({ storage = window.localStorage, key = STORAGE_KEYS.PLAYER_STATE } = {}) {
    this.storage = storage;
    this.key = key;
  }

  load() {
    if (!this.storage) {
      return this.withDefaults({});
    }

    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) {
        return this.withDefaults({});
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return this.withDefaults({});
      }

      return this.withDefaults(parsed);
    } catch {
      return this.withDefaults({});
    }
  }

  save(nextState) {
    if (!this.storage) {
      throw new Error('Storage backend is not available');
    }

    const sanitized = this.withDefaults(nextState ?? {});

    this.storage.setItem(this.key, JSON.stringify(sanitized));
    return sanitized;
  }

  withDefaults(state) {
    return {
      loopStart: typeof state.loopStart === 'number' ? state.loopStart : DEFAULT_STATE.loopStart,
      loopEnd: typeof state.loopEnd === 'number' ? state.loopEnd : DEFAULT_STATE.loopEnd,
      volume: typeof state.volume === 'number' ? state.volume : DEFAULT_STATE.volume,
      isMuted: typeof state.isMuted === 'boolean' ? state.isMuted : DEFAULT_STATE.isMuted,
      schemaVersion: STORAGE_SCHEMA.VERSION,
    };
  }
}

export default PreferenceStore;
export { DEFAULT_STATE as DEFAULT_PREFERENCE_STATE };
