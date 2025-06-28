/**
 * Cadenzio - Main Application Controller
 * Coordinates all modules for the audio loop player
 */

import AudioEngine from './AudioEngine.js';
import WaveformRenderer from './WaveformRenderer.js';
import AudioVisualizer from './AudioVisualizer.js';
import FileManager from './FileManager.js';
import UIController from './UIController.js';
import { formatTime, debounce, throttle } from './utils.js';
import { KEYBOARD_SHORTCUTS, UI_CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * Main application class that orchestrates all components
 */
class CadenzioApp {
  constructor() {
    // Initialize core components
    this.audioEngine = new AudioEngine();
    this.fileManager = new FileManager();
    this.ui = new UIController();
    
    // Initialize visual components
    this.waveformRenderer = new WaveformRenderer(
      document.getElementById('waveformCanvas'),
      document.getElementById('waveformPlayhead'),
      document.getElementById('waveformLoopRegion')
    );
    
    this.audioVisualizer = new AudioVisualizer(
      document.getElementById('visualizerCanvas')
    );
    
    // Application state
    this.isInitialized = false;
    this.updateIntervalId = null;
    
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Set up file manager callbacks
      this.fileManager.setCallbacks(
        (file, arrayBuffer) => this.handleFileLoad(file, arrayBuffer),
        (error) => this.ui.showError(error)
      );
      
      // Set up waveform renderer callback
      this.waveformRenderer.setSeekCallback((time) => this.audioEngine.seek(time));
      
      // Set up UI event listeners
      this.setupEventListeners();
      
      // Start progress update loop
      this.startProgressUpdates();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize Cadenzio:', error);
      this.ui.showError(ERROR_MESSAGES.INIT_FAILED);
    }
  }

  /**
   * Set up all UI event listeners
   */
  setupEventListeners() {
    // File handling
    this.ui.onFileSelect((e) => this.handleFileSelect(e));
    this.ui.onFileClear(() => this.clearFile());
    
    // Drag and drop
    this.ui.onDragOver((e) => this.handleDragOver(e));
    this.ui.onDragLeave(() => this.ui.removeDragOverStyle());
    this.ui.onDrop((e) => this.handleDrop(e));
    
    // Player controls
    this.ui.onPlayToggle(() => this.togglePlayPause());
    this.ui.onSeek((e) => this.handleSeek(e));
    
    // Volume controls
    this.ui.onVolumeChange((e) => this.handleVolumeChange(e));
    this.ui.onMuteToggle(() => this.toggleMute());
    
    // Loop controls
    this.ui.onLoopReset(() => this.resetLoop());
    
    // Keyboard shortcuts
    this.ui.onKeyboard((e) => this.handleKeyboard(e));
    
    // Window resize (debounced)
    window.addEventListener('resize', debounce(() => {
      this.waveformRenderer.resize();
    }, UI_CONFIG.DEBOUNCE_RESIZE_DELAY));
  }

  /**
   * Handle file selection from input
   */
  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      await this.fileManager.loadFile(file);
    }
  }

  /**
   * Handle file load completion
   */
  async handleFileLoad(file, arrayBuffer) {
    try {
      // Load audio buffer
      const audioBuffer = await this.audioEngine.loadAudioBuffer(arrayBuffer);
      
      // Update UI
      this.ui.setFileName(file.name);
      this.ui.showPlayer();
      this.ui.updateDuration(formatTime(this.audioEngine.duration));
      
      // Setup waveform
      this.waveformRenderer.resize();
      this.waveformRenderer.generate(audioBuffer);
      
      // Initialize loop slider with delay to ensure DOM is ready
      setTimeout(() => {
        if (this.audioEngine.duration && this.audioEngine.duration > 0) {
          this.ui.initializeLoopSlider(
            this.audioEngine.duration,
            (values) => this.handleLoopUpdate(values)
          );
        } else {
          console.error('Invalid audio duration for loop slider:', this.audioEngine.duration);
        }
      }, 200); // Increased delay to ensure everything is ready
      
    } catch (error) {
      console.error('Error loading file:', error);
      this.ui.showError(ERROR_MESSAGES.AUDIO_PROCESSING_FAILED);
      this.clearFile();
    }
  }

  /**
   * Handle loop slider updates
   */
  handleLoopUpdate(values) {
    if (!values || values.length !== 2) {
      console.error('Invalid loop values:', values);
      return;
    }
    
    const loopStart = parseFloat(values[0]);
    const loopEnd = parseFloat(values[1]);
    
    this.audioEngine.setLoopPoints(loopStart, loopEnd);
    this.ui.updateLoopDisplay(loopStart, loopEnd);
    this.waveformRenderer.updateLoopRegion(loopStart, loopEnd);
  }

  /**
   * Clear current file and reset UI
   */
  clearFile() {
    this.audioEngine.stop();
    this.audioVisualizer.stop();
    this.fileManager.clearFile();
    
    this.ui.hidePlayer();
    this.ui.clearFileInput();
    this.ui.updatePlayButton(false);
    this.waveformRenderer.hidePlayhead();
  }

  /**
   * Handle drag over events
   */
  handleDragOver(e) {
    e.preventDefault();
    this.ui.addDragOverStyle();
  }

  /**
   * Handle file drop
   */
  async handleDrop(e) {
    e.preventDefault();
    this.ui.removeDragOverStyle();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await this.fileManager.loadFile(files[0]);
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (!this.audioEngine.audioBuffer) return;
    
    if (this.audioEngine.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Start playback
   */
  async play() {
    await this.audioEngine.play();
    this.ui.updatePlayButton(true);
    this.audioVisualizer.start(this.audioEngine);
  }

  /**
   * Pause playback
   */
  pause() {
    this.audioEngine.pause();
    this.ui.updatePlayButton(false);
    this.audioVisualizer.stop();
  }

  /**
   * Handle seek from progress bar
   */
  handleSeek(e) {
    if (!this.audioEngine.audioBuffer) return;
    
    this.ui.handleSeekClick(e, this.audioEngine.duration, (time) => {
      this.audioEngine.seek(time);
    });
  }

  /**
   * Handle volume changes
   */
  handleVolumeChange(e) {
    this.ui.handleVolumeChange(e, (volume) => {
      this.audioEngine.setVolume(volume);
      this.ui.updateMuteButton(volume === 0);
    });
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    const newVolume = this.audioEngine.toggleMute();
    this.ui.updateVolumeSlider(newVolume);
    this.ui.updateMuteButton(newVolume === 0);
  }

  /**
   * Reset loop to full duration
   */
  resetLoop() {
    if (this.audioEngine.audioBuffer) {
      this.ui.resetLoopSlider(this.audioEngine.duration);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    // Ignore if typing in input field
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
      case KEYBOARD_SHORTCUTS.PLAY_PAUSE:
        e.preventDefault();
        this.togglePlayPause();
        break;
      case KEYBOARD_SHORTCUTS.SEEK_BACKWARD:
        e.preventDefault();
        this.audioEngine.seekRelative(-5);
        break;
      case KEYBOARD_SHORTCUTS.SEEK_FORWARD:
        e.preventDefault();
        this.audioEngine.seekRelative(5);
        break;
      default:
        if (KEYBOARD_SHORTCUTS.MUTE.includes(e.key)) {
          e.preventDefault();
          this.toggleMute();
        }
        break;
    }
  }

  /**
   * Start the progress update loop
   */
  startProgressUpdates() {
    const updateProgress = () => {
      if (this.audioEngine.isPlaying) {
        const currentTime = this.audioEngine.getCurrentTime();
        const percentage = (currentTime / this.audioEngine.duration) * 100;
        
        this.ui.updateCurrentTime(formatTime(currentTime));
        this.ui.updateProgress(percentage);
        this.waveformRenderer.updatePlayhead(currentTime);
      } else {
        this.waveformRenderer.hidePlayhead();
      }
      
      requestAnimationFrame(updateProgress);
    };
    
    updateProgress();
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check browser compatibility
  const { supported, missing } = FileManager.checkBrowserSupport();
  
  if (!supported) {
    console.error('Browser not supported. Missing APIs:', missing);
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
      errorEl.textContent = `${ERROR_MESSAGES.BROWSER_NOT_SUPPORTED}。必要な機能: ${missing.join(', ')}`;
      document.getElementById('errorToast').hidden = false;
    }
    return;
  }
  
  // Initialize the application
  new CadenzioApp();
});