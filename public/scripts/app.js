// Audio Player Module
class AudioLoopPlayer {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.duration = 0;
    
    this.initializeElements();
    this.initializeEventListeners();
  }

  initializeElements() {
    // File elements
    this.fileInput = document.getElementById('fileInput');
    this.dropZone = document.getElementById('dropZone');
    this.fileInfo = document.getElementById('fileInfo');
    this.fileName = document.getElementById('fileName');
    this.fileSelectBtn = document.querySelector('.file-select-btn');
    this.fileClearBtn = document.querySelector('.file-clear-btn');
    
    // Player elements
    this.playerSection = document.getElementById('playerSection');
    this.playBtn = document.getElementById('playBtn');
    this.playIcon = document.querySelector('.play-icon');
    this.pauseIcon = document.querySelector('.pause-icon');
    this.currentTimeEl = document.getElementById('currentTime');
    this.durationEl = document.getElementById('duration');
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = document.getElementById('progressFill');
    
    // Volume elements
    this.muteBtn = document.getElementById('muteBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeIcon = document.querySelector('.volume-icon');
    this.mutePath = document.querySelector('.mute-path');
    
    // Loop elements
    this.loopSlider = document.getElementById('loopSlider');
    this.loopStartEl = document.getElementById('loopStart');
    this.loopEndEl = document.getElementById('loopEnd');
    this.loopResetBtn = document.getElementById('loopResetBtn');
    
    // Error elements
    this.errorToast = document.getElementById('errorToast');
    this.errorMessage = document.getElementById('errorMessage');
  }

  initializeEventListeners() {
    // File selection
    this.fileSelectBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.fileClearBtn.addEventListener('click', () => this.clearFile());
    
    // Drag and drop
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropZone.addEventListener('dragleave', () => this.handleDragLeave());
    this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Player controls
    this.playBtn.addEventListener('click', () => this.togglePlayPause());
    this.progressBar.addEventListener('click', (e) => this.handleSeek(e));
    
    // Volume controls
    this.muteBtn.addEventListener('click', () => this.toggleMute());
    this.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));
    
    // Loop controls
    this.loopResetBtn.addEventListener('click', () => this.resetLoop());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  async initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.setVolume(this.volumeSlider.value / 100);
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    this.dropZone.classList.add('dragover');
  }

  handleDragLeave() {
    this.dropZone.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.loadFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadFile(file);
    }
  }

  async loadFile(file) {
    if (!file.type.startsWith('audio/')) {
      this.showError('選択されたファイルは音声ファイルではありません');
      return;
    }
    
    try {
      await this.initializeAudioContext();
      
      this.fileName.textContent = file.name;
      this.dropZone.hidden = true;
      this.fileInfo.hidden = false;
      
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
      
      this.setupPlayer();
    } catch (error) {
      this.showError('ファイルの読み込みに失敗しました: ' + error.message);
      this.clearFile();
    }
  }

  setupPlayer() {
    this.playerSection.hidden = false;
    this.durationEl.textContent = this.formatTime(this.duration);
    
    // Initialize loop slider
    if (this.loopSlider.noUiSlider) {
      this.loopSlider.noUiSlider.destroy();
    }
    
    noUiSlider.create(this.loopSlider, {
      start: [0, this.duration],
      connect: true,
      range: {
        'min': 0,
        'max': this.duration
      },
      step: 0.1,
      tooltips: [
        {
          to: (value) => this.formatTime(value)
        },
        {
          to: (value) => this.formatTime(value)
        }
      ]
    });
    
    this.loopSlider.noUiSlider.on('update', (values) => {
      this.loopStart = parseFloat(values[0]);
      this.loopEnd = parseFloat(values[1]);
      this.loopStartEl.textContent = this.formatTime(this.loopStart);
      this.loopEndEl.textContent = this.formatTime(this.loopEnd);
      
      if (this.sourceNode) {
        this.sourceNode.loopStart = this.loopStart;
        this.sourceNode.loopEnd = this.loopEnd;
      }
    });
    
    // Reset loop bounds
    this.loopStart = 0;
    this.loopEnd = this.duration;
    
    // Start progress update
    this.updateProgress();
  }

  clearFile() {
    this.stop();
    this.audioBuffer = null;
    this.dropZone.hidden = false;
    this.fileInfo.hidden = true;
    this.playerSection.hidden = true;
    this.fileInput.value = '';
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audioBuffer) return;
    
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
    this.playIcon.hidden = true;
    this.pauseIcon.hidden = false;
  }

  pause() {
    if (!this.sourceNode) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.sourceNode = null;
    
    this.isPlaying = false;
    this.playIcon.hidden = false;
    this.pauseIcon.hidden = true;
  }

  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;
    this.playIcon.hidden = false;
    this.pauseIcon.hidden = true;
  }

  handleSeek(e) {
    if (!this.audioBuffer) return;
    
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * this.duration;
    
    this.pauseTime = time;
    
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  updateProgress() {
    if (this.isPlaying && this.sourceNode) {
      const currentTime = (this.audioContext.currentTime - this.startTime) % this.duration;
      this.currentTimeEl.textContent = this.formatTime(currentTime);
      this.progressFill.style.width = (currentTime / this.duration * 100) + '%';
    }
    
    requestAnimationFrame(() => this.updateProgress());
  }

  toggleMute() {
    if (this.gainNode.gain.value > 0) {
      this.previousVolume = this.gainNode.gain.value;
      this.setVolume(0);
      this.volumeSlider.value = 0;
      this.mutePath.hidden = false;
    } else {
      this.setVolume(this.previousVolume || 0.5);
      this.volumeSlider.value = (this.previousVolume || 0.5) * 100;
      this.mutePath.hidden = true;
    }
  }

  handleVolumeChange(e) {
    const volume = e.target.value / 100;
    this.setVolume(volume);
    this.mutePath.hidden = volume > 0;
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  resetLoop() {
    if (this.loopSlider.noUiSlider) {
      this.loopSlider.noUiSlider.set([0, this.duration]);
    }
  }

  handleKeyboard(e) {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.seek(-5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.seek(5);
        break;
      case 'm':
        e.preventDefault();
        this.toggleMute();
        break;
    }
  }

  seek(seconds) {
    if (!this.audioBuffer) return;
    
    this.pauseTime = Math.max(0, Math.min(this.duration, this.pauseTime + seconds));
    
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorToast.hidden = false;
    
    setTimeout(() => {
      this.errorToast.hidden = true;
    }, 5000);
  }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AudioLoopPlayer();
});