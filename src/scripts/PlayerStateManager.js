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
    const normalized = this.normalize(snapshot);
    this.state = normalized;
    this.applyState(normalized);
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

    const loopStart =
      typeof raw.loopStart === 'number' && Number.isFinite(raw.loopStart)
        ? Math.max(0, raw.loopStart)
        : DEFAULT_PREFERENCE_STATE.loopStart;

    const hasLoopEnd = typeof raw.loopEnd === 'number' && Number.isFinite(raw.loopEnd);
    const loopEnd = hasLoopEnd ? Math.max(loopStart, raw.loopEnd) : null;

    const volume =
      typeof raw.volume === 'number' && Number.isFinite(raw.volume)
        ? clamp(raw.volume, 0, 1)
        : DEFAULT_PREFERENCE_STATE.volume;

    const isMuted = typeof raw.isMuted === 'boolean' ? raw.isMuted : DEFAULT_PREFERENCE_STATE.isMuted;

    return {
      loopStart,
      loopEnd,
      volume,
      isMuted,
      schemaVersion: raw.schemaVersion ?? STORAGE_SCHEMA.VERSION,
    };
  }

  applyState(target) {
    const loopStart =
      typeof target.loopStart === 'number' && Number.isFinite(target.loopStart)
        ? Math.max(0, target.loopStart)
        : 0;

    const durationCandidate = Number(this.audioEngine?.duration);
    const hasDuration = Number.isFinite(durationCandidate) && durationCandidate > 0;

    const hasLoopEnd = typeof target.loopEnd === 'number' && Number.isFinite(target.loopEnd);
    let loopEnd = hasLoopEnd ? Math.max(loopStart, target.loopEnd) : null;

    if (loopEnd === null) {
      loopEnd = hasDuration ? Math.max(loopStart, durationCandidate) : loopStart;
    } else if (hasDuration) {
      loopEnd = Math.max(loopStart, Math.min(loopEnd, durationCandidate));
    }

    const resolvedVolume =
      typeof target.volume === 'number' && Number.isFinite(target.volume)
        ? clamp(target.volume, 0, 1)
        : AUDIO_CONFIG.DEFAULT_VOLUME;
    const isMuted = !!target.isMuted;

    if (this.audioEngine?.setLoopPoints) {
      this.audioEngine.setLoopPoints(loopStart, loopEnd);
    }

    if (this.audioEngine?.setVolume) {
      this.audioEngine.setVolume(isMuted ? 0 : resolvedVolume);
    }

    if (this.ui?.setLoopHandles) {
      this.ui.setLoopHandles(loopStart, loopEnd);
    }

    if (this.ui?.updateLoopDisplay) {
      this.ui.updateLoopDisplay(loopStart, loopEnd);
    }

    if (this.ui?.updateVolumeSlider) {
      this.ui.updateVolumeSlider(resolvedVolume);
    }

    if (this.ui?.updateMuteButton) {
      this.ui.updateMuteButton(isMuted);
    }
  }

  updateLoop(loopStart, loopEnd) {
    const hasDesiredStart = typeof loopStart === 'number' && Number.isFinite(loopStart);
    const fallbackStart =
      typeof this.state.loopStart === 'number' && Number.isFinite(this.state.loopStart)
        ? Math.max(0, this.state.loopStart)
        : 0;
    const normalizedStart = hasDesiredStart ? Math.max(0, loopStart) : fallbackStart;

    const hasDesiredEnd = typeof loopEnd === 'number' && Number.isFinite(loopEnd);
    const hasFallbackEnd =
      typeof this.state.loopEnd === 'number' && Number.isFinite(this.state.loopEnd);
    let normalizedEnd = hasDesiredEnd
      ? Math.max(normalizedStart, loopEnd)
      : hasFallbackEnd
        ? Math.max(normalizedStart, this.state.loopEnd)
        : null;

    if (!(typeof normalizedEnd === 'number' && Number.isFinite(normalizedEnd))) {
      normalizedEnd = null;
    }

    const saved = this.persist({
      ...this.state,
      loopStart: normalizedStart,
      loopEnd: normalizedEnd,
    });

    this.applyState(saved);
  }

  updateVolume(volume) {
    const numericVolume = Number.parseFloat(volume);
    const clampedVolume = Number.isFinite(numericVolume)
      ? clamp(numericVolume, 0, 1)
      : this.state.volume;

    const nextState = {
      ...this.state,
      volume: clampedVolume,
      isMuted: clampedVolume === 0 ? this.state.isMuted : false,
    };

    const saved = this.persist(nextState);
    this.applyState(saved);
  }

  toggleMute() {
    const nextMuted = !this.state.isMuted;
    const saved = this.persist({
      ...this.state,
      isMuted: nextMuted,
    });

    this.applyState(saved);
    return nextMuted;
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
