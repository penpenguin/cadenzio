import { AUDIO_CONFIG } from './constants.js';

/**
 * AudioEngine - Core Web Audio API functionality
 * Handles audio context, buffer management, playback control, and audio analysis
 */
class AudioEngine {
  /**
   * Create an AudioEngine instance
   */
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.duration = 0;
    this.previousVolume = AUDIO_CONFIG.DEFAULT_VOLUME;
    
    // Audio analysis data
    this.frequencyData = null;
    this.bufferLength = 0;
  }

  /**
   * Initialize the audio context and nodes
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      
      // Create analyser node for visualizer
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = AUDIO_CONFIG.FFT_SIZE;
      this.bufferLength = this.analyserNode.frequencyBinCount;
      this.frequencyData = new Uint8Array(this.bufferLength);
      
      // Connect nodes: source -> gain -> analyser -> destination
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      this.setVolume(AUDIO_CONFIG.DEFAULT_VOLUME);
    }
  }

  /**
   * Load audio data from an ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - The audio file data
   * @returns {Promise<AudioBuffer>} The decoded audio buffer
   */
  async loadAudioBuffer(arrayBuffer) {
    if (!this.audioContext) await this.initialize();
    
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
    this.loopStart = 0;
    this.loopEnd = this.duration;
    
    return this.audioBuffer;
  }

  /**
   * Start audio playback with current loop settings
   */
  async play() {
    if (!this.audioBuffer) return;
    
    // Ensure audio context is initialized
    if (!this.audioContext) {
      await this.initialize();
    }
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);
    
    // Set loop parameters
    this.sourceNode.loop = true;
    this.sourceNode.loopStart = this.loopStart;
    this.sourceNode.loopEnd = this.loopEnd;
    
    const offset = this.pauseTime % this.duration;
    this.sourceNode.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    
    this.isPlaying = true;
  }

  /**
   * Pause audio playback
   */
  pause() {
    if (!this.sourceNode) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.sourceNode = null;
    
    this.isPlaying = false;
  }

  /**
   * Stop audio playback and reset position
   */
  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;
  }

  /**
   * Seek to a specific time position
   * @param {number} time - Time in seconds
   */
  seek(time) {
    this.pauseTime = Math.max(0, Math.min(this.duration, time));
    
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  /**
   * Seek relative to current position
   * @param {number} [seconds=AUDIO_CONFIG.SEEK_STEP] - Seconds to seek (positive or negative)
   */
  seekRelative(seconds = AUDIO_CONFIG.SEEK_STEP) {
    this.seek(this.pauseTime + seconds);
  }

  /**
   * Set loop start and end points
   * @param {number} start - Loop start time in seconds
   * @param {number} end - Loop end time in seconds
   */
  setLoopPoints(start, end) {
    this.loopStart = start;
    this.loopEnd = end;
    
    if (this.sourceNode) {
      this.sourceNode.loopStart = start;
      this.sourceNode.loopEnd = end;
    }
  }

  /**
   * Set the output volume
   * @param {number} value - Volume level (0.0 to 1.0)
   */
  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  /**
   * Toggle mute state
   * @returns {number} New volume level
   */
  toggleMute() {
    const isMuted = this.gainNode.gain.value === 0;
    
    if (isMuted) {
      this.setVolume(this.previousVolume);
      return this.previousVolume;
    } else {
      this.previousVolume = this.gainNode.gain.value;
      this.setVolume(0);
      return 0;
    }
  }

  /**
   * Get current playback time
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    if (this.isPlaying && this.sourceNode) {
      return (this.audioContext.currentTime - this.startTime) % this.duration;
    }
    return this.pauseTime;
  }

  /**
   * Get current frequency analysis data
   * @returns {Uint8Array|null} Frequency data array or null if not available
   */
  getFrequencyData() {
    if (this.analyserNode && this.frequencyData) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  /**
   * Calculate average frequency level
   * @returns {number} Average frequency value (0-255)
   */
  getAverageFrequency() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  }
}

export default AudioEngine;