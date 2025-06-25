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
  }

  initializeEventListeners() {
    // File selection
    this.elements.fileSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.elements.fileInput.click();
    });
    
    // Drag and drop
    this.elements.dropZone.addEventListener('click', () => {
      this.elements.fileInput.click();
    });
  }

  // File UI methods
  setFileName(name) {
    if (this.elements.fileName) {
      this.elements.fileName.textContent = name;
    }
  }

  showFileInfo() {
    if (this.elements.dropZone) this.elements.dropZone.hidden = true;
    if (this.elements.fileInfo) this.elements.fileInfo.hidden = false;
  }

  hideFileInfo() {
    if (this.elements.dropZone) this.elements.dropZone.hidden = false;
    if (this.elements.fileInfo) this.elements.fileInfo.hidden = true;
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
      this.elements.volumeSlider.style.setProperty('--slider-progress', (value * 100) + '%');
    }
  }

  updateMuteButton(isMuted) {
    if (this.elements.mutePath) {
      this.elements.mutePath.hidden = !isMuted;
    }
  }

  // Loop UI methods
  initializeLoopSlider(duration, onUpdate) {
    if (!this.elements.loopSlider) {
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
    
    try {
      
      const sliderOptions = {
        start: [initialStart, initialEnd], // Set handles at 25% and 75% initially
        connect: true, // Connect between handles
        range: {
          'min': 0,
          'max': duration
        },
        step: 0.1,
        tooltips: [
          {
            to: (value) => this.formatTime(value)
          },
          {
            to: (value) => this.formatTime(value)
          }
        ],
        behaviour: 'tap-drag',
        orientation: 'horizontal',
        margin: 1, // Minimum distance between handles (1 second)
        // Explicitly set the number of handles
        handles: 2
      };
      
      noUiSlider.create(this.elements.loopSlider, sliderOptions);
      
      if (this.elements.loopSlider.noUiSlider) {
        this.elements.loopSlider.noUiSlider.on('update', onUpdate);
        this.loopSlider = this.elements.loopSlider.noUiSlider;
        
        // Verify handle count
        const handles = this.elements.loopSlider.querySelectorAll('.noUi-handle');
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
    
    const updateHandler = () => {
      const values = [
        parseFloat(startInput.value),
        parseFloat(endInput.value)
      ];
      onUpdate(values);
    };
    
    startInput.addEventListener('input', updateHandler);
    endInput.addEventListener('input', updateHandler);
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
    if (this.loopSlider) {
      try {
        this.loopSlider.set([0, duration]);
      } catch (error) {
        console.error('Failed to reset loop slider:', error);
      }
    }
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