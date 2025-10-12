import { AUDIO_CONFIG, STORAGE_SCHEMA } from './constants.js';
import PreferenceStore, { DEFAULT_PREFERENCE_STATE } from './PreferenceStore.js';
import { clamp } from './utils.js';

/**
 * PlayerStateManager orchestrates persistence-aware state transitions.
 */
class PlayerStateManager {
  constructor({ audioEngine, ui, store = new PreferenceStore(), onError = () => {} } = {}) {
    this.audioEngine = audioEngine;
    this.ui = ui;
    this.store = store;
    this.onError = onError;
    this.state = { ...DEFAULT_PREFERENCE_STATE };
  }

  hydrate() {
    const snapshot = this.safeLoad();
    this.state = this.normalize(snapshot);

    const preset = this.resolveActivePreset(this.state);
    this.applyPreset(preset);

    return this.state;
  }

  safeLoad() {
    try {
      return this.store.load();
    } catch (error) {
      this.onError(error);
      return { ...DEFAULT_PREFERENCE_STATE };
    }
  }

  normalize(raw) {
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_PREFERENCE_STATE };
    }

    return {
      loopStart:
        typeof raw.loopStart === 'number' ? raw.loopStart : DEFAULT_PREFERENCE_STATE.loopStart,
      loopEnd: typeof raw.loopEnd === 'number' ? raw.loopEnd : DEFAULT_PREFERENCE_STATE.loopEnd,
      volume:
        typeof raw.volume === 'number' ? clamp(raw.volume, 0, 1) : DEFAULT_PREFERENCE_STATE.volume,
      isMuted: typeof raw.isMuted === 'boolean' ? raw.isMuted : DEFAULT_PREFERENCE_STATE.isMuted,
      presets: Array.isArray(raw.presets) ? raw.presets : [...DEFAULT_PREFERENCE_STATE.presets],
      activePresetId: raw.activePresetId ?? DEFAULT_PREFERENCE_STATE.activePresetId,
      schemaVersion: raw.schemaVersion ?? STORAGE_SCHEMA.VERSION,
    };
  }

  resolveActivePreset(state) {
    if (!state.presets || state.presets.length === 0) {
      return this.fallbackPresetFromState(state);
    }

    const match = state.presets.find(preset => preset.id === state.activePresetId);

    if (match) {
      return this.fallbackPresetFromState({
        ...state,
        loopStart: match.loopStart,
        loopEnd: match.loopEnd,
        volume: match.volume,
        isMuted: match.isMuted,
      });
    }

    return this.fallbackPresetFromState({
      ...state,
      loopStart: state.presets[0].loopStart,
      loopEnd: state.presets[0].loopEnd,
      volume: state.presets[0].volume,
      isMuted: state.presets[0].isMuted,
      activePresetId: state.presets[0].id,
    });
  }

  fallbackPresetFromState(state) {
    return {
      loopStart: typeof state.loopStart === 'number' ? state.loopStart : 0,
      loopEnd: typeof state.loopEnd === 'number' ? state.loopEnd : null,
      volume:
        typeof state.volume === 'number' ? clamp(state.volume, 0, 1) : AUDIO_CONFIG.DEFAULT_VOLUME,
      isMuted: !!state.isMuted,
    };
  }

  applyPreset(preset) {
    const loopStart = preset.loopStart ?? 0;
    const loopEnd = preset.loopEnd ?? preset.loopStart ?? 0;
    const volume = clamp(preset.volume ?? AUDIO_CONFIG.DEFAULT_VOLUME, 0, 1);
    const isMuted = !!preset.isMuted;

    if (this.audioEngine?.setLoopPoints) {
      this.audioEngine.setLoopPoints(loopStart, loopEnd);
    }

    if (this.audioEngine?.setVolume) {
      this.audioEngine.setVolume(isMuted ? 0 : volume);
    }

    if (this.ui?.setLoopHandles) {
      this.ui.setLoopHandles(loopStart, loopEnd);
    }

    if (this.ui?.updateLoopDisplay) {
      this.ui.updateLoopDisplay(loopStart, loopEnd);
    }

    if (this.ui?.updateVolumeSlider) {
      this.ui.updateVolumeSlider(volume);
    }

    if (this.ui?.updateMuteButton) {
      this.ui.updateMuteButton(isMuted);
    }
  }

  updateLoop(loopStart, loopEnd) {
    const normalizedStart = typeof loopStart === 'number' ? loopStart : this.state.loopStart;
    const normalizedEnd = typeof loopEnd === 'number' ? loopEnd : this.state.loopEnd;

    const nextState = {
      ...this.state,
      loopStart: normalizedStart,
      loopEnd: normalizedEnd,
      presets: this.state.presets.map(preset =>
        preset.id === this.state.activePresetId
          ? {
              ...preset,
              loopStart: normalizedStart,
              loopEnd: normalizedEnd,
            }
          : preset
      ),
    };

    this.persist(nextState);
    this.applyPreset({
      loopStart: normalizedStart,
      loopEnd: normalizedEnd,
      volume: this.state.volume,
      isMuted: this.state.isMuted,
    });
  }

  updateVolume(volume) {
    const clampedVolume = clamp(volume, 0, 1);
    const nextState = {
      ...this.state,
      volume: clampedVolume,
      isMuted: clampedVolume === 0 ? this.state.isMuted : false,
      presets: this.state.presets.map(preset =>
        preset.id === this.state.activePresetId
          ? {
              ...preset,
              volume: clampedVolume,
              isMuted: clampedVolume === 0 ? preset.isMuted : false,
            }
          : preset
      ),
    };

    this.persist(nextState);
    this.applyPreset({
      loopStart: this.state.loopStart,
      loopEnd: this.state.loopEnd,
      volume: this.state.volume,
      isMuted: this.state.isMuted,
    });
  }

  resetPresets() {
    const resetState = {
      ...DEFAULT_PREFERENCE_STATE,
      schemaVersion: STORAGE_SCHEMA.VERSION,
    };

    this.persist(resetState);
    this.applyPreset({
      loopStart: this.state.loopStart,
      loopEnd: this.state.loopEnd,
      volume: this.state.volume,
      isMuted: this.state.isMuted,
    });
  }

  toggleMute() {
    const nextMuted = !this.state.isMuted;
    const nextState = {
      ...this.state,
      isMuted: nextMuted,
      presets: this.state.presets.map(preset =>
        preset.id === this.state.activePresetId
          ? {
              ...preset,
              isMuted: nextMuted,
            }
          : preset
      ),
    };

    this.persist(nextState);
    this.applyPreset({
      loopStart: this.state.loopStart,
      loopEnd: this.state.loopEnd,
      volume: this.state.volume,
      isMuted: this.state.isMuted,
    });
  }

  createPreset({ name, loopStart, loopEnd, volume, isMuted } = {}) {
    const id = this.generatePresetId();
    const preset = {
      id,
      name: name && name.length > 0 ? name : `Preset ${this.state.presets.length + 1}`,
      loopStart: typeof loopStart === 'number' ? loopStart : this.state.loopStart,
      loopEnd: typeof loopEnd === 'number' ? loopEnd : this.state.loopEnd,
      volume: typeof volume === 'number' ? clamp(volume, 0, 1) : this.state.volume,
      isMuted: typeof isMuted === 'boolean' ? isMuted : this.state.isMuted,
    };

    const nextState = {
      ...this.state,
      loopStart: preset.loopStart,
      loopEnd: preset.loopEnd,
      volume: preset.volume,
      isMuted: preset.isMuted,
      activePresetId: id,
      presets: [...this.state.presets.filter(candidate => candidate.id !== id), preset],
    };

    this.persist(nextState);
    this.applyPreset(preset);
    return preset;
  }

  selectPreset(presetId) {
    const preset = this.state.presets.find(candidate => candidate.id === presetId);
    if (!preset) {
      return null;
    }

    const nextState = {
      ...this.state,
      loopStart: preset.loopStart,
      loopEnd: preset.loopEnd,
      volume: preset.volume,
      isMuted: preset.isMuted,
      activePresetId: presetId,
    };

    this.persist(nextState);
    this.applyPreset(preset);
    return preset;
  }

  deletePreset(presetId) {
    const remaining = this.state.presets.filter(preset => preset.id !== presetId);

    if (remaining.length === 0) {
      this.resetPresets();
      return this.state;
    }

    const nextActive =
      remaining.find(preset => preset.id === this.state.activePresetId) ?? remaining[0];

    const nextState = {
      ...this.state,
      presets: remaining,
      activePresetId: nextActive.id,
      loopStart: nextActive.loopStart,
      loopEnd: nextActive.loopEnd,
      volume: nextActive.volume,
      isMuted: nextActive.isMuted,
    };

    this.persist(nextState);
    this.applyPreset(nextActive);
    return this.state;
  }

  generatePresetId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  getActivePreset() {
    return this.resolveActivePreset(this.state);
  }

  persist(nextState) {
    const target = nextState ?? this.state;

    try {
      const saved = this.store.save(target);
      this.state = { ...saved };
      return this.state;
    } catch (error) {
      this.onError(error);
      this.state = { ...target };
      return this.state;
    }
  }
}

export default PlayerStateManager;
