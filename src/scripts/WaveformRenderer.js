/**
 * WaveformRenderer - Handles waveform visualization and interaction
 */
class WaveformRenderer {
  constructor(canvas, playheadElement, loopRegionElement) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.playheadElement = playheadElement;
    this.loopRegionElement = loopRegionElement;
    this.waveformData = null;
    this.duration = 0;
    this.onSeekCallback = null;
    
    if (this.canvas) {
      this.initializeEventListeners();
    }
  }

  initializeEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('resize', () => this.resize());
  }

  setSeekCallback(callback) {
    this.onSeekCallback = callback;
  }

  generate(audioBuffer) {
    if (!audioBuffer || !this.canvas) return;
    
    this.duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    const samples = this.canvas.width;
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
    
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.waveformData) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const halfHeight = height / 2;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.waveformData.length; i++) {
      const x = i;
      const y = halfHeight - (this.waveformData[i] * halfHeight * 0.8);
      
      if (i === 0) {
        this.ctx.moveTo(x, halfHeight);
      }
      
      this.ctx.lineTo(x, y);
    }
    
    // Mirror bottom half
    for (let i = this.waveformData.length - 1; i >= 0; i--) {
      const x = i;
      const y = halfHeight + (this.waveformData[i] * halfHeight * 0.8);
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(94, 75, 182, 0.3)';
    this.ctx.fill();
    this.ctx.stroke();
  }

  resize() {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    if (this.waveformData) {
      this.draw();
    }
  }

  updatePlayhead(currentTime) {
    if (!this.playheadElement || !this.canvas || !this.duration) return;
    
    const width = this.canvas.getBoundingClientRect().width;
    const position = (currentTime / this.duration) * width;
    this.playheadElement.style.left = position + 'px';
    this.playheadElement.classList.add('active');
  }

  hidePlayhead() {
    if (this.playheadElement) {
      this.playheadElement.classList.remove('active');
    }
  }

  updateLoopRegion(loopStart, loopEnd) {
    if (!this.loopRegionElement || !this.canvas || !this.duration) return;
    
    const width = this.canvas.getBoundingClientRect().width;
    const startPercent = loopStart / this.duration;
    const endPercent = loopEnd / this.duration;
    
    this.loopRegionElement.style.left = (startPercent * width) + 'px';
    this.loopRegionElement.style.width = ((endPercent - startPercent) * width) + 'px';
    this.loopRegionElement.classList.add('active');
  }

  handleClick(e) {
    if (!this.duration || !this.onSeekCallback) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * this.duration;
    
    this.onSeekCallback(time);
  }
}

export default WaveformRenderer;