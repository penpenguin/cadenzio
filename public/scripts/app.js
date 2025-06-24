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
    
    // Waveform properties
    this.waveformCanvas = null;
    this.waveformCtx = null;
    this.waveformData = null;
    this.waveformPlayhead = null;
    this.waveformLoopRegion = null;
    
    // Visualizer properties
    this.visualizerCanvas = null;
    this.visualizerCtx = null;
    this.analyserNode = null;
    this.animationId = null;
    this.particles = [];
    this.frequencyData = null;
    this.bufferLength = 0;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.initializeVisualizer();
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
    
    // Waveform elements
    this.waveformCanvas = document.getElementById('waveformCanvas');
    this.waveformCtx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null;
    this.waveformPlayhead = document.getElementById('waveformPlayhead');
    this.waveformLoopRegion = document.getElementById('waveformLoopRegion');
  }

  initializeEventListeners() {
    // File selection
    this.fileSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });
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
    
    // Waveform controls
    if (this.waveformCanvas) {
      this.waveformCanvas.addEventListener('click', (e) => this.handleWaveformClick(e));
      window.addEventListener('resize', () => this.resizeWaveform());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  async initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      
      // Create analyser node for visualizer
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.bufferLength = this.analyserNode.frequencyBinCount;
      this.frequencyData = new Uint8Array(this.bufferLength);
      
      // Connect nodes: source -> gain -> analyser -> destination
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
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
      this.generateWaveform();
    } catch (error) {
      this.showError('ファイルの読み込みに失敗しました: ' + error.message);
      this.clearFile();
    }
  }

  setupPlayer() {
    this.playerSection.hidden = false;
    this.durationEl.textContent = this.formatTime(this.duration);
    
    // Initialize waveform canvas
    this.resizeWaveform();
    
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
      
      this.updateLoopRegion();
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
    
    // Start visualizer
    this.startVisualizer();
  }

  pause() {
    if (!this.sourceNode) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.sourceNode.stop();
    this.sourceNode = null;
    
    this.isPlaying = false;
    this.playIcon.hidden = false;
    this.pauseIcon.hidden = true;
    
    // Stop visualizer
    this.stopVisualizer();
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
    
    // Stop visualizer
    this.stopVisualizer();
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
      
      // Update waveform playhead
      if (this.waveformPlayhead && this.waveformCanvas) {
        const width = this.waveformCanvas.getBoundingClientRect().width;
        const position = (currentTime / this.duration) * width;
        this.waveformPlayhead.style.left = position + 'px';
        this.waveformPlayhead.classList.add('active');
      }
    } else if (this.waveformPlayhead) {
      this.waveformPlayhead.classList.remove('active');
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

  // Waveform visualization methods
  generateWaveform() {
    if (!this.audioBuffer || !this.waveformCanvas) return;
    
    const channelData = this.audioBuffer.getChannelData(0);
    const samples = this.waveformCanvas.width;
    const blockSize = Math.floor(channelData.length / samples);
    const filteredData = [];
    
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }
    
    // Normalize
    const max = Math.max(...filteredData);
    this.waveformData = filteredData.map(n => n / max);
    
    this.drawWaveform();
    this.updateLoopRegion();
  }

  drawWaveform() {
    if (!this.waveformCtx || !this.waveformData) return;
    
    const width = this.waveformCanvas.width;
    const height = this.waveformCanvas.height;
    const halfHeight = height / 2;
    
    // Clear canvas
    this.waveformCtx.clearRect(0, 0, width, height);
    
    // Draw waveform
    this.waveformCtx.beginPath();
    this.waveformCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.waveformCtx.lineWidth = 1;
    
    for (let i = 0; i < this.waveformData.length; i++) {
      const x = i;
      const y = halfHeight - (this.waveformData[i] * halfHeight * 0.8);
      
      if (i === 0) {
        this.waveformCtx.moveTo(x, halfHeight);
      }
      
      this.waveformCtx.lineTo(x, y);
    }
    
    // Mirror bottom half
    for (let i = this.waveformData.length - 1; i >= 0; i--) {
      const x = i;
      const y = halfHeight + (this.waveformData[i] * halfHeight * 0.8);
      this.waveformCtx.lineTo(x, y);
    }
    
    this.waveformCtx.closePath();
    this.waveformCtx.fillStyle = 'rgba(94, 75, 182, 0.3)';
    this.waveformCtx.fill();
    this.waveformCtx.stroke();
  }

  resizeWaveform() {
    if (!this.waveformCanvas) return;
    
    const rect = this.waveformCanvas.getBoundingClientRect();
    this.waveformCanvas.width = rect.width * window.devicePixelRatio;
    this.waveformCanvas.height = rect.height * window.devicePixelRatio;
    this.waveformCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    if (this.waveformData) {
      this.generateWaveform();
    }
  }

  handleWaveformClick(e) {
    if (!this.audioBuffer) return;
    
    const rect = this.waveformCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * this.duration;
    
    this.pauseTime = time;
    
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  updateLoopRegion() {
    if (!this.waveformLoopRegion || !this.waveformCanvas) return;
    
    const width = this.waveformCanvas.getBoundingClientRect().width;
    const startPercent = this.loopStart / this.duration;
    const endPercent = this.loopEnd / this.duration;
    
    this.waveformLoopRegion.style.left = (startPercent * width) + 'px';
    this.waveformLoopRegion.style.width = ((endPercent - startPercent) * width) + 'px';
    this.waveformLoopRegion.classList.add('active');
  }

  // Visualizer methods
  initializeVisualizer() {
    this.visualizerCanvas = document.getElementById('visualizerCanvas');
    if (!this.visualizerCanvas) return;
    
    this.visualizerCtx = this.visualizerCanvas.getContext('2d');
    this.resizeVisualizer();
    
    // Initialize particles
    this.createParticles();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeVisualizer());
  }

  resizeVisualizer() {
    if (!this.visualizerCanvas) return;
    
    this.visualizerCanvas.width = window.innerWidth;
    this.visualizerCanvas.height = window.innerHeight;
  }

  createParticles() {
    const particleCount = 50;
    this.particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        hue: Math.random() * 60 + 260, // Purple to red range
        brightness: 50
      });
    }
  }

  startVisualizer() {
    if (!this.visualizerCtx || this.animationId) return;
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.drawVisualizer();
    };
    
    animate();
  }

  stopVisualizer() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear canvas
    if (this.visualizerCtx) {
      this.visualizerCtx.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
    }
  }

  drawVisualizer() {
    if (!this.visualizerCtx || !this.analyserNode) return;
    
    const width = this.visualizerCanvas.width;
    const height = this.visualizerCanvas.height;
    
    // Get frequency data
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    
    // Calculate average frequency for reactive effects
    let average = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      average += this.frequencyData[i];
    }
    average = average / this.bufferLength;
    
    // Clear with fade effect
    this.visualizerCtx.fillStyle = 'rgba(15, 15, 35, 0.1)';
    this.visualizerCtx.fillRect(0, 0, width, height);
    
    // Draw frequency bars
    const barWidth = width / this.bufferLength * 2.5;
    let x = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const barHeight = (this.frequencyData[i] / 255) * height * 0.7;
      
      // Apply volume scaling
      const volumeScale = this.gainNode ? this.gainNode.gain.value : 1;
      const scaledHeight = barHeight * volumeScale;
      
      // Create gradient for bars
      const gradient = this.visualizerCtx.createLinearGradient(0, height - scaledHeight, 0, height);
      gradient.addColorStop(0, `hsla(${280 - i * 0.5}, 70%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${280 - i * 0.5}, 70%, 40%, 0.3)`);
      
      this.visualizerCtx.fillStyle = gradient;
      this.visualizerCtx.fillRect(x, height - scaledHeight, barWidth - 2, scaledHeight);
      
      // Mirror effect
      this.visualizerCtx.fillStyle = `hsla(${280 - i * 0.5}, 70%, 50%, 0.1)`;
      this.visualizerCtx.fillRect(x, 0, barWidth - 2, scaledHeight * 0.3);
      
      x += barWidth;
    }
    
    // Update and draw particles
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx * (1 + average / 100);
      particle.y += particle.vy * (1 + average / 100);
      
      // Wrap around edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      
      // Update brightness based on audio
      particle.brightness = 50 + (average / 255) * 50;
      
      // Draw particle
      this.visualizerCtx.beginPath();
      this.visualizerCtx.arc(particle.x, particle.y, particle.size * (1 + average / 200), 0, Math.PI * 2);
      this.visualizerCtx.fillStyle = `hsla(${particle.hue}, 70%, ${particle.brightness}%, 0.5)`;
      this.visualizerCtx.fill();
      
      // Add glow effect
      this.visualizerCtx.shadowBlur = 20;
      this.visualizerCtx.shadowColor = `hsla(${particle.hue}, 70%, ${particle.brightness}%, 0.3)`;
      this.visualizerCtx.fill();
      this.visualizerCtx.shadowBlur = 0;
    });
  }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AudioLoopPlayer();
});