import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('nouislider/dist/nouislider.css', () => ({}), { virtual: true });

const createMock = vi.hoisted(() => vi.fn());

vi.mock('nouislider', () => {
  return {
    default: {
      create: createMock,
    },
  };
});

import UIController from '../UIController.js';

const waitForLoopHandleFlush = async controller => {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (controller.pendingLoopHandles === null && controller.loopHandleSyncId === null) {
      return;
    }
    // Give queued timers a chance to run before rechecking state
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('Timed out waiting for loop handle flush');
};

describe('UIController loop slider', () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockImplementation((element, options) => {
      const sliderState = {
        values: options.start.map(value => Number(value)),
        range: {
          min: Number(options.range?.min ?? 0),
          max: Number(options.range?.max ?? Number.POSITIVE_INFINITY),
        },
      };
      const listeners = {};

      const setSpy = vi.fn(values => {
        const [start, end] = values.map(value => Number(value));
        if (start < sliderState.range.min || end > sliderState.range.max) {
          throw new Error(
            `Handles out of range: [${start}, ${end}] not within [${
              sliderState.range.min
            }, ${sliderState.range.max}]`
          );
        }
        const margin = options.margin ?? 0;
        if (margin > 0 && Math.abs(end - start) < margin) {
          throw new Error(`Loop handles violate margin ${margin}`);
        }
        sliderState.values = [start, end];
        if (listeners.update) {
          listeners.update(
            sliderState.values.map(value => value.toString()),
            undefined,
            sliderState.values
          );
        }
      });

      const onSpy = vi.fn((event, handler) => {
        listeners[event] = handler;
      });

      element.noUiSlider = {
        on: onSpy,
        set: setSpy,
        get: vi.fn(() => sliderState.values.map(value => value.toString())),
        __listeners: listeners,
      };
    });

    document.body.innerHTML = `
      <div id="loopSliderContainer">
        <div id="loopSlider"></div>
      </div>
    `;
    createMock.mockClear();
  });

  it('initializes slider without enforcing a minimum loop margin', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();

      ui.initializeLoopSlider(30, () => {});

      expect(createMock).toHaveBeenCalledTimes(1);
      const [, options] = createMock.mock.calls[0];
      expect(options.margin ?? 0).toBe(0);

      expect(() => ui.setLoopHandles(10, 10)).not.toThrow();
      await waitForLoopHandleFlush(ui);
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('skips redundant updates when requested handles match current slider state', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.initializeLoopSlider(30, () => {});

      const slider = ui.loopSlider;
      expect(slider.set).toHaveBeenCalledTimes(0);

      ui.setLoopHandles(12, 18);
      await waitForLoopHandleFlush(ui);

      expect(slider.set).toHaveBeenCalledTimes(1);
      expect(slider.set).toHaveBeenLastCalledWith([12, 18]);

      slider.set.mockClear();
      ui.setLoopHandles(12, 18);

      await waitForLoopHandleFlush(ui);

      expect(slider.set).not.toHaveBeenCalled();
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('updates cached handles when the slider fires update events', () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.initializeLoopSlider(30, () => {});

      const slider = ui.loopSlider;
      expect(slider.__listeners.update).toBeTypeOf('function');

      slider.__listeners.update(['5', '10'], undefined, [5, 10]);

      slider.set.mockClear();
      ui.setLoopHandles(5, 10);
      expect(slider.set).not.toHaveBeenCalled();
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('clamps requested handles to the slider range before setting', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.initializeLoopSlider(30, () => {});

      const slider = ui.loopSlider;
      ui.setLoopHandles(5, 10);
      await waitForLoopHandleFlush(ui);
      slider.set.mockClear();

      ui.setLoopHandles(-5, 45);
      await waitForLoopHandleFlush(ui);

      expect(slider.set).toHaveBeenCalledTimes(1);
      expect(slider.set).toHaveBeenLastCalledWith([0, 30]);
      expect(ui.lastLoopHandles).toEqual([0, 30]);
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('queues pending handles when the loop slider element is missing', () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.elements.loopSlider = null;
      ui.loopSlider = null;

      ui.setLoopHandles(2, 8);

      expect(ui.pendingLoopHandles).toEqual([2, 8]);
      expect(ui.lastLoopHandles).toBeNull();

      ui.cancelLoopHandleSync();
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('re-queries the loop slider element if the cached reference is stale', () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();

      document.body.innerHTML = `
        <div class="loop-slider-container">
          <div id="loopSlider"></div>
        </div>
      `;

      ui.elements.loopSlider = null;

      expect(() => ui.initializeLoopSlider(20, () => {})).not.toThrow();
      expect(createMock).toHaveBeenCalledTimes(1);
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('initializes the slider after pending handles were queued before DOM ready', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      document.body.innerHTML = `
        <div class="loop-slider-container">
          <div id="loopSlider"></div>
        </div>
      `;

      ui.elements.loopSlider = null;
      ui.loopSlider = null;

      ui.setLoopHandles(2, 8);

      expect(() => ui.initializeLoopSlider(10, () => {})).not.toThrow();
      expect(ui.loopSlider).toBeDefined();
      expect(ui.lastLoopHandles).toEqual([2, 8]);

      await waitForLoopHandleFlush(ui);
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('retries applying loop handles if the slider rejects the initial set', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.initializeLoopSlider(30, () => {});

      const slider = ui.loopSlider;
      const originalSet = slider.set;
      let shouldThrow = true;

      slider.set = vi.fn(values => {
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error('transient');
        }
        return originalSet(values);
      });

      ui.setLoopHandles(4, 12);
      await waitForLoopHandleFlush(ui);

      expect(slider.set).toHaveBeenCalledTimes(2);
      expect(slider.set).toHaveBeenLastCalledWith([4, 12]);
      expect(ui.pendingLoopHandles).toBeNull();
    } finally {
      eventSpy.mockRestore();
    }
  });

  it('defers handle updates to the scheduled flush to avoid reentrant set calls', async () => {
    const eventSpy = vi
      .spyOn(UIController.prototype, 'initializeEventListeners')
      .mockImplementation(() => {});

    try {
      const ui = new UIController();
      ui.initializeLoopSlider(30, () => {});

      const slider = ui.loopSlider;
      expect(slider.set).toHaveBeenCalledTimes(0);

      ui.setLoopHandles(4, 12);

      expect(slider.set).toHaveBeenCalledTimes(0);
      expect(ui.pendingLoopHandles).toEqual([4, 12]);

      await waitForLoopHandleFlush(ui);

      expect(slider.set).toHaveBeenCalledTimes(1);
      expect(slider.set).toHaveBeenLastCalledWith([4, 12]);
      expect(ui.pendingLoopHandles).toBeNull();
    } finally {
      eventSpy.mockRestore();
    }
  });
});
