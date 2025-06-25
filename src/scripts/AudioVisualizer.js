import { VISUALIZER_CONFIG } from './constants.js';

/**
 * AudioVisualizer - Background audio reactive visualization
 */
class AudioVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.animationId = null;
    this.particles = [];
    this.isRunning = false;
    
    // Configuration from constants
    this.config = VISUALIZER_CONFIG;
    
    if (this.canvas) {
      this.initialize();
    }
  }

  initialize() {
    this.resize();
    this.createParticles();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.config.PARTICLE_COUNT; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * this.config.PARTICLE_VELOCITY_RANGE,
        vy: (Math.random() - 0.5) * this.config.PARTICLE_VELOCITY_RANGE,
        size: Math.random() * (this.config.PARTICLE_SIZE_MAX - this.config.PARTICLE_SIZE_MIN) + this.config.PARTICLE_SIZE_MIN,
        hue: Math.random() * this.config.HUE_RANGE + (this.config.HUE_BASE - this.config.HUE_RANGE),
        brightness: 50
      });
    }
  }

  start(audioEngine) {
    if (!this.ctx || this.isRunning) return;
    
    this.audioEngine = audioEngine;
    this.isRunning = true;
    
    const animate = () => {
      if (!this.isRunning) return;
      
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    
    animate();
  }

  stop() {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    if (!this.ctx || !this.audioEngine) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Get audio data
    const frequencyData = this.audioEngine.getFrequencyData();
    const average = this.audioEngine.getAverageFrequency();
    const volume = this.audioEngine.gainNode ? this.audioEngine.gainNode.gain.value : 1;
    
    if (!frequencyData) return;
    
    // Natural fade effect
    this.ctx.fillStyle = `rgba(15, 15, 35, ${this.config.FADE_ALPHA})`;
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw frequency bars
    this.drawFrequencyBars(frequencyData, width, height, volume);
    
    // Update and draw particles
    this.updateParticles(average, width, height);
  }

  drawFrequencyBars(frequencyData, width, height, volume) {
    const barWidth = width / frequencyData.length * this.config.BAR_WIDTH_MULTIPLIER;
    let x = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * height * this.config.BAR_HEIGHT_SCALE;
      const scaledHeight = barHeight * volume;
      
      // Create gradient for bars
      const gradient = this.ctx.createLinearGradient(0, height - scaledHeight, 0, height);
      gradient.addColorStop(0, `hsla(${this.config.HUE_BASE - i * 0.5}, 70%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${this.config.HUE_BASE - i * 0.5}, 70%, 40%, 0.3)`);
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, height - scaledHeight, barWidth - 2, scaledHeight);
      
      // Mirror effect
      this.ctx.fillStyle = `hsla(${this.config.HUE_BASE - i * 0.5}, 70%, 50%, 0.1)`;
      this.ctx.fillRect(x, 0, barWidth - 2, scaledHeight * 0.3);
      
      x += barWidth;
    }
  }

  updateParticles(average, width, height) {
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
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * (1 + average / 200), 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${particle.hue}, 70%, ${particle.brightness}%, 0.5)`;
      this.ctx.fill();
      
      // Add glow effect
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = `hsla(${particle.hue}, 70%, ${particle.brightness}%, 0.3)`;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }
}

export default AudioVisualizer;