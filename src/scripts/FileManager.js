import { FILE_CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * FileManager - Handles file input, validation, and processing
 */
class FileManager {
  constructor() {
    this.onFileLoadCallback = null;
    this.onErrorCallback = null;
    this.currentFile = null;
    
    // Supported audio formats from config
    this.supportedFormats = FILE_CONFIG.SUPPORTED_FORMATS;
  }

  setCallbacks(onFileLoad, onError) {
    this.onFileLoadCallback = onFileLoad;
    this.onErrorCallback = onError;
  }

  async loadFile(file) {
    if (!this.validateFile(file)) {
      this.handleError(ERROR_MESSAGES.INVALID_FILE_TYPE);
      return null;
    }
    
    try {
      this.currentFile = file;
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      if (this.onFileLoadCallback) {
        await this.onFileLoadCallback(file, arrayBuffer);
      }
      
      return arrayBuffer;
    } catch (error) {
      this.handleError(ERROR_MESSAGES.LOAD_FAILED + ': ' + error.message);
      return null;
    }
  }

  validateFile(file) {
    if (!file) return false;
    
    // Check file type
    if (!file.type.startsWith('audio/')) {
      return false;
    }
    
    // Check if format is supported
    const isSupported = this.supportedFormats.some(format => 
      file.type.includes(format.split('/')[1])
    );
    
    if (!isSupported) {
      return false;
    }
    
    // Check file size
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      this.handleError(ERROR_MESSAGES.FILE_TOO_LARGE);
      return false;
    }
    
    return true;
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error(ERROR_MESSAGES.LOAD_FAILED));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  getCurrentFile() {
    return this.currentFile;
  }

  clearFile() {
    this.currentFile = null;
  }

  getFileInfo() {
    if (!this.currentFile) return null;
    
    return {
      name: this.currentFile.name,
      size: this.formatFileSize(this.currentFile.size),
      type: this.currentFile.type,
      lastModified: new Date(this.currentFile.lastModified)
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  handleError(message) {
    console.error('FileManager Error:', message);
    if (this.onErrorCallback) {
      this.onErrorCallback(message);
    }
  }

  // Static method to check browser support
  static checkBrowserSupport() {
    const requiredAPIs = [
      'FileReader',
      'AudioContext',
      'fetch'
    ];
    
    const unsupported = requiredAPIs.filter(api => !(api in window));
    
    if (unsupported.length > 0) {
      return {
        supported: false,
        missing: unsupported
      };
    }
    
    return { supported: true };
  }
}

export default FileManager;