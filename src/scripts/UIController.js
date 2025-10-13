/**
 * UIController - Manages DOM interactions and UI state
 */
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

class UIController {
  constructor() {
    this.elements = {};
    this.loopSlider = null;
    this.errorToastTimeout = null;
    this.pendingLoopHandles = null;
    this.lastLoopHandles = null;
    this.loopSliderRange = null;
    this.loopHandleSyncId = null;
    this.lastLoopHandleError = null;

    this.initializeElements();
    this.initializeEventListeners();
  }

  initializeElements() {
    // File elements
    this.elements.fileInput = document.getElementById('fileInput');
    this.elements.dropZone = document.getElementById('dropZone');
    this.elements.fileInfo = document.getElementById('fileInfo');
    this.elements.fileName = document.getElementById('fileName');
    this.elements.fileSelectBtn = document.querySelector('.file-select-btn');
    this.elements.fileClearBtn = document.querySelector('.file-clear-btn');

    // Player elements
    this.elements.playerSection = document.getElementById('playerSection');
    this.elements.playBtn = document.getElementById('playBtn');
    this.elements.playIcon = document.querySelector('.play-icon');
    this.elements.pauseIcon = document.querySelector('.pause-icon');
    this.elements.currentTimeEl = document.getElementById('currentTime');
    this.elements.durationEl = document.getElementById('duration');
    this.elements.progressBar = document.getElementById('progressBar');
    this.elements.progressFill = document.getElementById('progressFill');

    // Volume elements
    this.elements.muteBtn = document.getElementById('muteBtn');
    this.elements.volumeSlider = document.getElementById('volumeSlider');
    this.elements.volumeIcon = document.querySelector('.volume-icon');
    this.elements.mutePath = document.querySelector('.mute-path');

    // Loop elements
    this.elements.loopSlider = document.getElementById('loopSlider');
    this.elements.loopStartEl = document.getElementById('loopStart');
    this.elements.loopEndEl = document.getElementById('loopEnd');
    this.elements.loopResetBtn = document.getElementById('loopResetBtn');

    // Error elements
    this.elements.errorToast = document.getElementById('errorToast');
    this.elements.errorMessage = document.getElementById('errorMessage');

    // Modal elements
    this.elements.settingsBtn = document.querySelector('.settings-btn');
    this.elements.licenseModal = document.getElementById('licenseModal');
    this.elements.licenseModalClose = document.getElementById('licenseModalClose');
  }

  initializeEventListeners() {
    // File selection
    this.elements.fileSelectBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.elements.fileInput.click();
    });

    // Drag and drop
    this.elements.dropZone.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    // License modal
    this.elements.settingsBtn.addEventListener('click', () => {
      this.showLicenseModal();
    });

    this.elements.licenseModalClose.addEventListener('click', () => {
      this.hideLicenseModal();
    });

    this.elements.licenseModal.addEventListener('click', e => {
      if (e.target === this.elements.licenseModal) {
        this.hideLicenseModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this.elements.licenseModal.hidden) {
        this.hideLicenseModal();
      }
    });
  }

  // File UI methods
  setFileName(name) {
    if (this.elements.fileName) {
      this.elements.fileName.textContent = name;
    }
  }

  clearFileInput() {
    if (this.elements.fileInput) {
      this.elements.fileInput.value = '';
    }
  }

  // Player UI methods
  showPlayer() {
    if (this.elements.playerSection) {
      this.elements.playerSection.hidden = false;
    }
  }

  hidePlayer() {
    if (this.elements.playerSection) {
      this.elements.playerSection.hidden = true;
    }
  }

  updatePlayButton(isPlaying) {
    if (this.elements.playIcon && this.elements.pauseIcon) {
      this.elements.playIcon.hidden = isPlaying;
      this.elements.pauseIcon.hidden = !isPlaying;

      // Force style update with multiple methods
      if (isPlaying) {
        // Hide play icon, show pause icon
        this.elements.playIcon.style.display = 'none';
        this.elements.playIcon.style.visibility = 'hidden';
        this.elements.playIcon.style.opacity = '0';
        this.elements.playIcon.setAttribute('hidden', 'true');

        this.elements.pauseIcon.style.display = 'block';
        this.elements.pauseIcon.style.visibility = 'visible';
        this.elements.pauseIcon.style.opacity = '1';
        this.elements.pauseIcon.removeAttribute('hidden');
      } else {
        // Show play icon, hide pause icon
        this.elements.playIcon.style.display = 'block';
        this.elements.playIcon.style.visibility = 'visible';
        this.elements.playIcon.style.opacity = '1';
        this.elements.playIcon.removeAttribute('hidden');

        this.elements.pauseIcon.style.display = 'none';
        this.elements.pauseIcon.style.visibility = 'hidden';
        this.elements.pauseIcon.style.opacity = '0';
        this.elements.pauseIcon.setAttribute('hidden', 'true');
      }
    }
    if (this.elements.playBtn) {
      this.elements.playBtn.setAttribute('aria-label', isPlaying ? '一時停止' : '再生');
    }
  }

  // License modal methods
  showLicenseModal() {
    if (this.elements.licenseModal) {
      this.elements.licenseModal.hidden = false;
    }
  }

  hideLicenseModal() {
    if (this.elements.licenseModal) {
      this.elements.licenseModal.hidden = true;
    }
  }

  updateCurrentTime(timeString) {
    if (this.elements.currentTimeEl) {
      this.elements.currentTimeEl.textContent = timeString;
    }
  }

  updateDuration(timeString) {
    if (this.elements.durationEl) {
      this.elements.durationEl.textContent = timeString;
    }
  }

  updateProgress(percentage) {
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = percentage + '%';
    }
  }

  // Volume UI methods
  updateVolumeSlider(value) {
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.value = value * 100;
      // Update CSS variable for background gradient
      this.elements.volumeSlider.style.setProperty('--slider-progress', value * 100 + '%');
    }
  }

  updateMuteButton(isMuted) {
    if (this.elements.mutePath) {
      this.elements.mutePath.hidden = !isMuted;
      this.elements.mutePath.style.display = isMuted ? 'inline' : 'none';
    }
  }

  // Loop UI methods
  initializeLoopSlider(duration, onUpdate) {
    if (!this.resolveLoopSliderElement()) {
      console.error('Loop slider element not found');
      return;
    }

    // Validate duration
    if (typeof duration !== 'number' || duration <= 0 || !isFinite(duration)) {
      console.error('Invalid duration value:', duration);
      return;
    }

    // Check if noUiSlider is available
    if (!noUiSlider) {
      console.error('noUiSlider is not loaded');
      return;
    }

    // Completely destroy existing slider
    if (this.elements.loopSlider.noUiSlider) {
      try {
        this.elements.loopSlider.noUiSlider.destroy();
        this.loopSlider = null;
        // Clear any remaining classes
        this.elements.loopSlider.className = '';
        this.elements.loopSlider.setAttribute('id', 'loopSlider');
        this.lastLoopHandles = null;
        this.loopSliderRange = null;
        this.cancelLoopHandleSync();
      } catch (error) {
        console.warn('Error destroying existing slider:', error);
      }
    }

    // Complete DOM reset - create a new element
    const parent = this.elements.loopSlider.parentNode;
    const newSlider = document.createElement('div');
    newSlider.id = 'loopSlider';
    parent.replaceChild(newSlider, this.elements.loopSlider);
    this.elements.loopSlider = newSlider;

    // Set initial values to span the entire audio range
    const initialStart = 0; // Start position (0%)
    const initialEnd = duration; // End position (100%)

    this.loopSliderRange = {
      min: 0,
      max: duration,
    };

    try {
      const sliderOptions = {
        start: [initialStart, initialEnd], // Set handles at 25% and 75% initially
        connect: true, // Connect between handles
        range: {
          min: 0,
          max: duration,
        },
        step: 0.1,
        tooltips: [
          {
            to: value => this.formatTime(value),
          },
          {
            to: value => this.formatTime(value),
          },
        ],
        behaviour: 'tap-drag',
        orientation: 'horizontal',
        margin: 0, // Allow handles to overlap so single-point loops work
        // Explicitly set the number of handles
        handles: 2,
      };

      noUiSlider.create(this.elements.loopSlider, sliderOptions);

      if (this.elements.loopSlider.noUiSlider) {
        const sliderInstance = this.elements.loopSlider.noUiSlider;
        sliderInstance.on('update', values => {
          const parsed = this.parseHandleValues(values);
          if (parsed) {
            this.lastLoopHandles = parsed;
          }
          onUpdate(values);
        });
        this.loopSlider = sliderInstance;
        this.lastLoopHandles = [initialStart, initialEnd];
        if (this.pendingLoopHandles) {
          const [pendingStart, pendingEnd] = this.normalizeLoopHandles(
            this.pendingLoopHandles[0],
            this.pendingLoopHandles[1]
          );
          try {
            this.loopSlider.set([pendingStart, pendingEnd]);
            this.lastLoopHandles = [pendingStart, pendingEnd];
            this.pendingLoopHandles = null;
            this.cancelLoopHandleSync();
          } catch (error) {
            console.warn('Retrying loop slider handles sync:', error);
            this.pendingLoopHandles = [pendingStart, pendingEnd];
            this.enqueueLoopHandleSync();
          }
        }
        this.flushPendingLoopHandles();
      } else {
        console.error('noUiSlider instance not created');
      }
    } catch (error) {
      console.error('Failed to initialize loop slider:', error);
      console.error('Error stack:', error.stack);

      // Fallback: Create simple range inputs
      this.createFallbackSlider(duration, onUpdate);
    }
  }

  // Fallback method if noUiSlider fails
  createFallbackSlider(duration, onUpdate) {
    console.warn('Creating fallback slider with native inputs');

    const container = this.elements.loopSlider;
    container.innerHTML = `
      <div class="fallback-slider">
        <label>開始: <input type="range" id="loopStartRange" min="0" max="${duration}" step="0.1" value="0"></label>
        <label>終了: <input type="range" id="loopEndRange" min="0" max="${duration}" step="0.1" value="${duration}"></label>
      </div>
    `;

    const startInput = container.querySelector('#loopStartRange');
    const endInput = container.querySelector('#loopEndRange');

    this.loopSliderRange = {
      min: 0,
      max: Number(duration),
    };

    this.lastLoopHandles = [0, Number(duration)];

    const updateHandler = () => {
      const values = [parseFloat(startInput.value), parseFloat(endInput.value)];
      this.lastLoopHandles = values;
      onUpdate(values);
    };

    startInput.addEventListener('input', updateHandler);
    endInput.addEventListener('input', updateHandler);

    if (this.pendingLoopHandles) {
      const [pendingStart, pendingEnd] = this.normalizeLoopHandles(
        this.pendingLoopHandles[0],
        this.pendingLoopHandles[1]
      );
      startInput.value = pendingStart;
      endInput.value = pendingEnd;
      this.lastLoopHandles = [pendingStart, pendingEnd];
      this.pendingLoopHandles = null;
    }
  }

  updateLoopDisplay(startTime, endTime) {
    if (this.elements.loopStartEl) {
      this.elements.loopStartEl.textContent = this.formatTime(startTime);
    }
    if (this.elements.loopEndEl) {
      this.elements.loopEndEl.textContent = this.formatTime(endTime);
    }
  }

  resetLoopSlider(duration) {
    const numericDuration = Number(duration);
    if (!Number.isFinite(numericDuration)) {
      return;
    }

    if (!this.loopSliderRange) {
      this.loopSliderRange = {
        min: 0,
        max: numericDuration,
      };
    }

    const [normalizedStart, normalizedEnd] = this.normalizeLoopHandles(0, numericDuration);

    if (!this.resolveLoopSliderElement()) {
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      return;
    }

    if (this.isFallbackSliderActive()) {
      this.updateFallbackHandles(normalizedStart, normalizedEnd);
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      return;
    }

    const sliderInstance = this.elements.loopSlider?.noUiSlider;

    if (sliderInstance && this.loopSlider === sliderInstance) {
      try {
        if (this.handlesMatch(normalizedStart, normalizedEnd)) {
          return;
        }

        this.loopSlider.set([normalizedStart, normalizedEnd]);
        this.lastLoopHandles = [normalizedStart, normalizedEnd];
        this.pendingLoopHandles = null;
        this.cancelLoopHandleSync();
      } catch (error) {
        console.warn('Failed to reset loop slider (will retry):', error);
        this.pendingLoopHandles = [normalizedStart, normalizedEnd];
        this.enqueueLoopHandleSync();
      }
    } else {
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      this.enqueueLoopHandleSync();
    }
  }

  setLoopHandles(start, end) {
    const targetStart = Number(start);
    const targetEnd = Number(end);

    if (!Number.isFinite(targetStart) || !Number.isFinite(targetEnd)) {
      return;
    }

    if (!this.loopSliderRange) {
      this.pendingLoopHandles = [targetStart, targetEnd];
      return;
    }

    const [normalizedStart, normalizedEnd] = this.normalizeLoopHandles(targetStart, targetEnd);

    if (!this.resolveLoopSliderElement()) {
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      this.enqueueLoopHandleSync();
      return;
    }

    if (this.isFallbackSliderActive()) {
      this.updateFallbackHandles(normalizedStart, normalizedEnd);
      this.lastLoopHandles = [normalizedStart, normalizedEnd];
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      this.lastLoopHandleError = null;
      this.cancelLoopHandleSync();
      return;
    }

    if (this.handlesMatch(normalizedStart, normalizedEnd)) {
      this.pendingLoopHandles = null;
      this.lastLoopHandleError = null;
      this.cancelLoopHandleSync();
      return;
    }

    this.pendingLoopHandles = [normalizedStart, normalizedEnd];
    this.enqueueLoopHandleSync();
  }

  // Error handling
  showError(message) {
    if (this.elements.errorMessage && this.elements.errorToast) {
      this.elements.errorMessage.textContent = message;
      this.elements.errorToast.hidden = false;

      // Clear existing timeout
      if (this.errorToastTimeout) {
        clearTimeout(this.errorToastTimeout);
      }

      // Auto-hide after 5 seconds
      this.errorToastTimeout = setTimeout(() => {
        this.elements.errorToast.hidden = true;
      }, 5000);
    }
  }

  hideError() {
    if (this.elements.errorToast) {
      this.elements.errorToast.hidden = true;
    }
    if (this.errorToastTimeout) {
      clearTimeout(this.errorToastTimeout);
      this.errorToastTimeout = null;
    }
  }

  handlesMatch(targetStart, targetEnd) {
    if (!Array.isArray(this.lastLoopHandles) || this.lastLoopHandles.length !== 2) {
      return false;
    }

    const [currentStart, currentEnd] = this.lastLoopHandles.map(value => Number(value));
    if (!Number.isFinite(currentStart) || !Number.isFinite(currentEnd)) {
      return false;
    }

    const epsilon = 0.001;
    return (
      Math.abs(currentStart - targetStart) <= epsilon &&
      Math.abs(currentEnd - targetEnd) <= epsilon
    );
  }

  parseHandleValues(values) {
    if (!Array.isArray(values) || values.length !== 2) {
      return null;
    }

    const parsed = values.map(value => Number(value));
    return parsed.every(Number.isFinite) ? parsed : null;
  }

  normalizeLoopHandles(rawStart, rawEnd) {
    const range = this.loopSliderRange ?? {
      min: 0,
      max: Math.max(0, rawStart, rawEnd),
    };

    const clamp = value => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return range.min;
      }
      if (numeric < range.min) {
        return range.min;
      }
      if (numeric > range.max) {
        return range.max;
      }
      return numeric;
    };

    const clampedStart = clamp(rawStart);
    const clampedEnd = clamp(rawEnd);
    const normalizedStart = Math.min(clampedStart, clampedEnd);
    const normalizedEnd = Math.max(clampedStart, clampedEnd);
    return [normalizedStart, normalizedEnd];
  }

  isFallbackSliderActive() {
    return (
      !!this.resolveLoopSliderElement() &&
      !!this.elements.loopSlider.querySelector('.fallback-slider')
    );
  }

  updateFallbackHandles(start, end) {
    if (!this.resolveLoopSliderElement()) {
      return;
    }

    const startInput = this.elements.loopSlider.querySelector('#loopStartRange');
    const endInput = this.elements.loopSlider.querySelector('#loopEndRange');

    if (startInput) {
      startInput.value = start;
    }
    if (endInput) {
      endInput.value = end;
    }
  }

  enqueueLoopHandleSync() {
    if (!this.pendingLoopHandles) {
      this.cancelLoopHandleSync();
      return;
    }

    if (this.loopHandleSyncId !== null) {
      return;
    }

    this.loopHandleSyncId = setTimeout(() => {
      this.loopHandleSyncId = null;
      this.flushPendingLoopHandles();
    }, 0);
  }

  cancelLoopHandleSync() {
    if (this.loopHandleSyncId !== null) {
      clearTimeout(this.loopHandleSyncId);
      this.loopHandleSyncId = null;
    }
  }

  flushPendingLoopHandles() {
    if (!this.pendingLoopHandles) {
      this.cancelLoopHandleSync();
      return;
    }

    if (!this.resolveLoopSliderElement()) {
      this.enqueueLoopHandleSync();
      return;
    }

    const [pendingStart, pendingEnd] = this.pendingLoopHandles;
    const [normalizedStart, normalizedEnd] = this.normalizeLoopHandles(pendingStart, pendingEnd);

    if (this.isFallbackSliderActive()) {
      this.updateFallbackHandles(normalizedStart, normalizedEnd);
      this.lastLoopHandles = [normalizedStart, normalizedEnd];
      this.pendingLoopHandles = [normalizedStart, normalizedEnd];
      return;
    }

    const sliderInstance = this.elements.loopSlider?.noUiSlider;

    if (sliderInstance && this.loopSlider === sliderInstance) {
      try {
        if (!this.handlesMatch(normalizedStart, normalizedEnd)) {
          this.loopSlider.set([normalizedStart, normalizedEnd]);
        }
        this.lastLoopHandles = [normalizedStart, normalizedEnd];
        this.pendingLoopHandles = null;
        this.lastLoopHandleError = null;
        this.cancelLoopHandleSync();
      } catch (error) {
        console.warn('Retrying loop slider handles sync:', error);
        this.lastLoopHandleError = error;
        this.pendingLoopHandles = [normalizedStart, normalizedEnd];
        this.enqueueLoopHandleSync();
      }
    } else {
      this.enqueueLoopHandleSync();
    }
  }

  resolveLoopSliderElement() {
    if (this.elements.loopSlider && document.body.contains(this.elements.loopSlider)) {
      return this.elements.loopSlider;
    }

    const found = document.getElementById('loopSlider');
    if (found) {
      this.elements.loopSlider = found;
      return this.elements.loopSlider;
    }

    return null;
  }

  // Event listener registration
  onFileSelect(callback) {
    if (this.elements.fileInput) {
      this.elements.fileInput.addEventListener('change', callback);
    }
  }

  onFileClear(callback) {
    if (this.elements.fileClearBtn) {
      this.elements.fileClearBtn.addEventListener('click', callback);
    }
  }

  onDragOver(callback) {
    if (this.elements.dropZone) {
      this.elements.dropZone.addEventListener('dragover', callback);
    }
  }

  onDragLeave(callback) {
    if (this.elements.dropZone) {
      this.elements.dropZone.addEventListener('dragleave', callback);
    }
  }

  onDrop(callback) {
    if (this.elements.dropZone) {
      this.elements.dropZone.addEventListener('drop', callback);
    }
  }

  onPlayToggle(callback) {
    if (this.elements.playBtn) {
      this.elements.playBtn.addEventListener('click', callback);
    }
  }

  onSeek(callback) {
    if (this.elements.progressBar) {
      this.elements.progressBar.addEventListener('click', callback);
    }
  }

  onVolumeChange(callback) {
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.addEventListener('input', callback);
    }
  }

  onMuteToggle(callback) {
    if (this.elements.muteBtn) {
      this.elements.muteBtn.addEventListener('click', callback);
    }
  }

  onLoopReset(callback) {
    if (this.elements.loopResetBtn) {
      this.elements.loopResetBtn.addEventListener('click', callback);
    }
  }

  onKeyboard(callback) {
    document.addEventListener('keydown', callback);
  }

  // Utility methods
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  handleSeekClick(e, duration, onSeek) {
    if (!this.elements.progressBar || !duration || !onSeek) return;

    const rect = this.elements.progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;

    onSeek(time);
  }

  handleVolumeChange(e, onVolumeChange) {
    if (!onVolumeChange) return;

    const volume = e.target.value / 100;
    // Update CSS variable for real-time visual feedback
    e.target.style.setProperty('--slider-progress', e.target.value + '%');
    onVolumeChange(volume);
  }

  // Drag and drop styling
  addDragOverStyle() {
    if (this.elements.dropZone) {
      this.elements.dropZone.classList.add('dragover');
    }
  }

  removeDragOverStyle() {
    if (this.elements.dropZone) {
      this.elements.dropZone.classList.remove('dragover');
    }
  }
}

export default UIController;
