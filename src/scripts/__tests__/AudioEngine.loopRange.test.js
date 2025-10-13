import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AudioEngine from '../AudioEngine.js';

const noop = () => {};

const buildSourceNode = () => ({
  connect: vi.fn(),
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  start: vi.fn(),
  stop: vi.fn(),
});

describe('AudioEngine loop boundaries', () => {
  let originalAudioContext;
  let originalWebkitAudioContext;
  let audioContextMock;
  let createdSources;

  beforeEach(() => {
    createdSources = [];
    originalAudioContext = window.AudioContext;
    originalWebkitAudioContext = window.webkitAudioContext;

    const gainNode = {
      connect: vi.fn(),
      gain: { value: 1 },
    };

    const analyserNode = {
      connect: vi.fn(),
      fftSize: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: noop,
    };

    audioContextMock = {
      currentTime: 200,
      state: 'running',
      destination: {},
      createGain: vi.fn(() => gainNode),
      createAnalyser: vi.fn(() => analyserNode),
      createBufferSource: vi.fn(() => {
        const source = buildSourceNode();
        createdSources.push(source);
        return source;
      }),
      resume: vi.fn(),
      decodeAudioData: vi.fn(async () => ({
        duration: 100,
      })),
    };

    window.AudioContext = vi.fn(() => audioContextMock);
    delete window.webkitAudioContext;
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    window.webkitAudioContext = originalWebkitAudioContext;
    vi.restoreAllMocks();
  });

  it('resets playback to the loop start when resuming outside the loop window', async () => {
    const engine = new AudioEngine();
    await engine.loadAudioBuffer(new ArrayBuffer(8));
    engine.setLoopPoints(20, 30);
    engine.pauseTime = 85;

    await engine.play();

    expect(createdSources).toHaveLength(1);
    const source = createdSources[0];
    expect(source.loopStart).toBe(20);
    expect(source.loopEnd).toBe(30);
    expect(source.start).toHaveBeenCalledWith(0, 20);
  });

  it('snaps playback to the loop start when paused before the loop window', async () => {
    const engine = new AudioEngine();
    await engine.loadAudioBuffer(new ArrayBuffer(8));
    engine.setLoopPoints(15, 22);
    engine.pauseTime = 5;

    await engine.play();

    expect(createdSources).toHaveLength(1);
    const source = createdSources[0];
    expect(source.loopStart).toBe(15);
    expect(source.loopEnd).toBe(22);
    expect(source.start).toHaveBeenCalledWith(0, 15);
  });

  it('restarts playback at the loop start when updating the loop outside the current position', async () => {
    const engine = new AudioEngine();
    await engine.loadAudioBuffer(new ArrayBuffer(8));

    await engine.play();
    expect(createdSources).toHaveLength(1);
    const initialSource = createdSources[0];
    expect(initialSource.start).toHaveBeenCalledWith(0, 0);

    audioContextMock.currentTime = 240;

    engine.setLoopPoints(20, 32);

    expect(initialSource.stop).toHaveBeenCalledTimes(1);
    expect(createdSources).toHaveLength(2);
    const restartedSource = createdSources[1];
    expect(restartedSource.loopStart).toBe(20);
    expect(restartedSource.loopEnd).toBe(32);
    expect(restartedSource.start).toHaveBeenCalledWith(0, 20);
  });

  it('updates loop points in place when the current position is already inside the loop', async () => {
    const engine = new AudioEngine();
    await engine.loadAudioBuffer(new ArrayBuffer(8));

    await engine.play();
    const firstSource = createdSources[0];
    firstSource.start.mockClear();

    audioContextMock.currentTime = 212;

    engine.setLoopPoints(10, 40);

    expect(createdSources).toHaveLength(1);
    expect(firstSource.stop).not.toHaveBeenCalled();
    expect(firstSource.loopStart).toBe(10);
    expect(firstSource.loopEnd).toBe(40);
  });
});
