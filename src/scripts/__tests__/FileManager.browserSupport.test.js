import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ERROR_MESSAGES, FILE_CONFIG } from '../constants.js';
import FileManager from '../FileManager.js';

beforeEach(() => {
  delete global.window;
});

afterEach(() => {
  delete global.window;
});

describe('FileManager', () => {
  it('checkBrowserSupport treats webkitAudioContext as supported', () => {
    global.window = {
      FileReader: function FileReaderMock() {},
      webkitAudioContext: function WebkitAudioContextMock() {},
      fetch: () => {},
    };

    const { supported, missing } = FileManager.checkBrowserSupport();

    expect(supported).toBe(true);
    expect(missing).toEqual([]);
  });

  it('loadFile surfaces only the file-too-large error', async () => {
    const manager = new FileManager();
    const errors = [];

    manager.setCallbacks(
      () => {
        throw new Error('onFileLoad should not be called');
      },
      message => errors.push(message)
    );

    const oversizedFile = {
      name: 'huge.wav',
      type: 'audio/wav',
      size: FILE_CONFIG.MAX_FILE_SIZE + 1,
      lastModified: Date.now(),
    };

    const result = await manager.loadFile(oversizedFile);

    expect(result).toBeNull();
    expect(errors).toEqual([ERROR_MESSAGES.FILE_TOO_LARGE]);
  });
});
