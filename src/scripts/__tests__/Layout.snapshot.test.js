import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadDocument = () => {
  const filePath = resolve(__dirname, '../../pages/index.astro');
  const file = readFileSync(filePath, 'utf-8');
  const htmlStart = file.indexOf('<html');
  const html = htmlStart >= 0 ? file.slice(htmlStart) : file;
  const { document } = new JSDOM(html).window;
  return document;
};

describe('index.astro layout structure', () => {
  it('renders drop zone contents side by side', () => {
    const document = loadDocument();
    const dropZone = document.querySelector('.file-drop-zone');
    expect(dropZone).toBeTruthy();
    expect(dropZone?.querySelector('.file-drop-content')).toBeTruthy();
    expect(dropZone?.querySelector('.file-drop-icon svg.upload-icon')).toBeTruthy();
    expect(dropZone?.querySelector('.file-drop-text button.file-select-btn')).toBeTruthy();
  });

  it('places file info, play controls, and volume in the same row', () => {
    const document = loadDocument();
    const topRow = document.querySelector('.player-top-row');
    expect(topRow).toBeTruthy();
    expect(topRow?.querySelector('.file-info')).toBeTruthy();
    expect(topRow?.querySelector('#playBtn')).toBeTruthy();
    expect(topRow?.querySelector('.volume-control #volumeSlider')).toBeTruthy();
  });

  it('includes preset management controls with reset actions', () => {
    const document = loadDocument();
    const presetControls = document.querySelector('.preset-controls');
    expect(presetControls).toBeTruthy();
    expect(presetControls?.querySelector('#presetSelect')).toBeTruthy();
    expect(presetControls?.querySelector('#presetNameInput')).toBeTruthy();
    expect(presetControls?.querySelector('#presetSaveBtn')).toBeTruthy();
    expect(presetControls?.querySelector('#presetDeleteBtn')).toBeTruthy();
    expect(presetControls?.querySelector('#presetResetBtn')).toBeTruthy();
  });
});
