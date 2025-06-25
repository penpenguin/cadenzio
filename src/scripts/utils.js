/**
 * Utility functions for the Cadenzio application
 */

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function to limit function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format time duration in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Check if the browser supports required Web APIs
 * @returns {Object} Support status and missing APIs
 */
export function checkBrowserSupport() {
  const requiredAPIs = [
    'AudioContext',
    'FileReader',
    'requestAnimationFrame',
    'fetch'
  ];
  
  const missing = requiredAPIs.filter(api => {
    if (api === 'AudioContext') {
      return !(window.AudioContext || window.webkitAudioContext);
    }
    return !(api in window);
  });
  
  return {
    supported: missing.length === 0,
    missing: missing
  };
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone an object (simple implementation)
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension (lowercase)
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Validate audio file type
 * @param {File} file - File object to validate
 * @returns {boolean} True if valid audio file
 */
export function isValidAudioFile(file) {
  if (!file || !file.type) return false;
  
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/webm'
  ];
  
  return validTypes.some(type => file.type.includes(type.split('/')[1]));
}

/**
 * Create a debounced version of requestAnimationFrame
 * @param {Function} callback - Function to call
 * @returns {Function} Debounced animation function
 */
export function debouncedRaf(callback) {
  let rafId = null;
  
  return function(...args) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      callback.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Log with timestamp for debugging
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debugLog(message, ...args) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, ...args);
  }
}