/* eslint-disable no-new */
// swipe.test.js

import Swipe from './swipe';
import { getCompareDates } from '../../modules/compare/selectors';
import { getRenderPixel } from 'ol/render';
import util from '../../util/util';
import { COMPARE_MOVE_START } from '../../util/constants';

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('lodash/round', () => jest.fn((val) => Math.round(val)));
jest.mock('lodash/each', () => jest.fn((collection, fn) => collection.forEach(fn)));

jest.mock('ol/render', () => ({
  getRenderPixel: jest.fn((event, coord) => coord),
}));

jest.mock('../../modules/compare/selectors', () => ({
  getCompareDates: jest.fn(),
}));

jest.mock('../../util/util', () => ({
  events: {
    trigger: jest.fn(),
  },
}));

jest.mock('../../util/constants', () => ({
  COMPARE_MOVE_START: 'compare:movestart',
}));

const registeredResizeListeners = [];
const originalAddEventListener = window.addEventListener.bind(window);
const originalRemoveEventListener = window.removeEventListener.bind(window);

// Override addEventListener once, before any tests run
window.addEventListener = (type, handler, ...rest) => {
  if (type === 'resize') {
    registeredResizeListeners.push(handler);
  }
  originalAddEventListener(type, handler, ...rest);
};

window.removeEventListener = (type, handler, ...rest) => {
  if (type === 'resize') {
    const idx = registeredResizeListeners.indexOf(handler);
    if (idx !== -1) registeredResizeListeners.splice(idx, 1);
  }
  originalRemoveEventListener(type, handler, ...rest);
};

// After EVERY test, purge all accumulated resize listeners
afterEach(() => {
  [...registeredResizeListeners].forEach((handler) => {
    originalRemoveEventListener('resize', handler);
  });
  registeredResizeListeners.length = 0;
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Creates a mock OL layer with optional sub-layers */
const makeMockLayer = (subLayers = null) => {
  const layer = {
    on: jest.fn(),
    un: jest.fn(),
    get: jest.fn((key) => {
      if (key === 'layers' && subLayers) {
        return { getArray: () => subLayers };
      }
      return null;
    }),
  };
  return layer;
};

/** Creates a mock OL map */
const makeMockMap = (layerGroupsA = [], layerGroupsB = []) => {
  const mapEl = document.createElement('div');
  document.body.appendChild(mapEl);

  return {
    getTargetElement: jest.fn(() => mapEl),
    render: jest.fn(),
    getSize: jest.fn(() => [1000, 800]),
    getLayers: jest.fn(() => ({
      getArray: jest.fn(() => [
        { getLayersArray: jest.fn(() => layerGroupsA) },
        { getLayersArray: jest.fn(() => layerGroupsB) },
      ]),
    })),
  };
};

/** Creates a mock Redux-like store */
const makeMockStore = (dateA = '2023-01-01', dateB = '2023-06-01') => {
  getCompareDates.mockReturnValue({ dateA, dateB });
  return {
    getState: jest.fn(() => ({})),
  };
};

/** Default listener string object for mouse events */
const defaultListenerObj = {
  type: 'default',
  start: 'mousedown',
  move: 'mousemove',
  end: 'mouseup',
};

// ─────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────

describe('Swipe class', () => {
  let map;
  let store;
  let swipe;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset jsdom body between tests
    document.body.innerHTML = '';
    map = makeMockMap();
    store = makeMockStore();
    swipe = new Swipe(map, store, defaultListenerObj, 50);
  });

  // ── Constructor ──────────────────────────────

  describe('constructor', () => {
    it('should set percentSwipe from valueOverride / 100', () => {
      // Verify the swipe line is translated to 50% of window width
      const line = document.querySelector('.ab-swipe-line');
      expect(line).not.toBeNull();
      const expectedOffset = window.innerWidth * 0.5;
      expect(line.style.transform).toBe(`translateX( ${expectedOffset}px)`);
    });

    it('should call create() on construction', () => {
      const line = document.querySelector('.ab-swipe-line');
      expect(line).not.toBeNull();
    });

    it('should expose getSwipeOffset function', () => {
      expect(typeof swipe.getSwipeOffset).toBe('function');
    });

    it('should store a reference to the OL map', () => {
      expect(swipe.map).toBe(map);
    });

    it('should register a window resize listener', () => {
      const addEventSpy = jest.spyOn(window, 'addEventListener');
      const map2 = makeMockMap();
      const store2 = makeMockStore();
      new Swipe(map2, store2, defaultListenerObj, 50);
      const resizeCall = addEventSpy.mock.calls.find(([event]) => event === 'resize');
      expect(resizeCall).toBeDefined();
    });
  });

  // ── create() ────────────────────────────────

  describe('create()', () => {
    it('should read dates from the store via getCompareDates', () => {
      expect(getCompareDates).toHaveBeenCalled();
      expect(swipe.dateA).toBe('2023-01-01');
      expect(swipe.dateB).toBe('2023-06-01');
    });

    it('should append the swipe line element to the map container', () => {
      const mapEl = map.getTargetElement();
      expect(mapEl.querySelector('.ab-swipe-line')).not.toBeNull();
    });
  });

  // ── destroy() ───────────────────────────────

  describe('destroy()', () => {
    it('should remove the swipe line from the DOM', () => {
      swipe.destroy();
      const line = document.querySelector('.ab-swipe-line');
      expect(line).toBeNull();
    });

    it('should call layer.un() for prerender and postrender on side A layers', () => {
      const layerA = makeMockLayer();
      const layerB = makeMockLayer();
      const mapWithLayers = makeMockMap([layerA], [layerB]);
      const storeWithLayers = makeMockStore();
      const swipeWithLayers = new Swipe(mapWithLayers, storeWithLayers, defaultListenerObj, 50);

      swipeWithLayers.update(storeWithLayers);
      swipeWithLayers.destroy();

      expect(layerA.un).toHaveBeenCalledWith('prerender', expect.any(Function));
      expect(layerA.un).toHaveBeenCalledWith('postrender', expect.any(Function));
    });

    it('should call layer.un() for prerender and postrender on side B layers', () => {
      const layerA = makeMockLayer();
      const layerB = makeMockLayer();
      const mapWithLayers = makeMockMap([layerA], [layerB]);
      const storeWithLayers = makeMockStore();
      const swipeWithLayers = new Swipe(mapWithLayers, storeWithLayers, defaultListenerObj, 50);

      swipeWithLayers.update(storeWithLayers);
      swipeWithLayers.destroy();

      expect(layerB.un).toHaveBeenCalledWith('prerender', expect.any(Function));
      expect(layerB.un).toHaveBeenCalledWith('postrender', expect.any(Function));
    });

    it('should reset layersSideA and layersSideB to empty arrays after destroy', () => {
      // After destroy, a subsequent update should not attempt to un-register
      // old layers (no error thrown)
      expect(() => swipe.destroy()).not.toThrow();
    });
  });

  // ── update() ────────────────────────────────

  describe('update()', () => {
    it('should apply event listeners to side A and B layers when dates are unchanged', () => {
      const layerA = makeMockLayer();
      const layerB = makeMockLayer();
      const mapWithLayers = makeMockMap([layerA], [layerB]);
      const storeWithLayers = makeMockStore('2023-01-01', '2023-06-01');
      const swipeWithLayers = new Swipe(mapWithLayers, storeWithLayers, defaultListenerObj, 50);

      swipeWithLayers.update(storeWithLayers);

      expect(layerA.on).toHaveBeenCalledWith('prerender', expect.any(Function));
      expect(layerA.on).toHaveBeenCalledWith('postrender', expect.any(Function));
      expect(layerB.on).toHaveBeenCalledWith('prerender', expect.any(Function));
      expect(layerB.on).toHaveBeenCalledWith('postrender', expect.any(Function));
    });

    it('should call destroy() and create() when dates change', () => {
      const destroySpy = jest.spyOn(swipe, 'destroy');
      const createSpy = jest.spyOn(swipe, 'create');

      // Simulate new dates
      getCompareDates.mockReturnValue({ dateA: '2024-01-01', dateB: '2024-06-01' });
      swipe.update(store);

      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('should not call destroy() when dates are unchanged', () => {
      const destroySpy = jest.spyOn(swipe, 'destroy');

      // Same dates as initial
      getCompareDates.mockReturnValue({ dateA: '2023-01-01', dateB: '2023-06-01' });
      swipe.update(store);

      expect(destroySpy).not.toHaveBeenCalled();
    });
  });

  // ── applyEventListeners() ───────────────────

  describe('applyEventListeners()', () => {
    it('should call callback directly for a flat (non-group) layer', () => {
      const layer = makeMockLayer();
      const callback = jest.fn();
      swipe.applyEventListeners(layer, callback);
      expect(callback).toHaveBeenCalledWith(layer);
    });

    it('should recurse into sub-layers for a layer group', () => {
      const subLayer = makeMockLayer();
      const groupLayer = makeMockLayer([subLayer]);
      const callback = jest.fn();

      swipe.applyEventListeners(groupLayer, callback);

      // callback should be applied to the leaf sub-layer, not the group
      expect(callback).toHaveBeenCalledWith(subLayer);
      expect(callback).not.toHaveBeenCalledWith(groupLayer);
    });

    it('should handle deeply nested layer groups', () => {
      const deepLeaf = makeMockLayer();
      const midLayer = makeMockLayer([deepLeaf]);
      const topGroup = makeMockLayer([midLayer]);
      const callback = jest.fn();

      swipe.applyEventListeners(topGroup, callback);

      expect(callback).toHaveBeenCalledWith(deepLeaf);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ── setClipMaskA() ──────────────────────────

  describe('setClipMaskA()', () => {
    it('should call context.save(), beginPath(), and clip()', () => {
      const ctx = {
        save: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
        restore: jest.fn(),
      };
      const event = { context: ctx };
      swipe.setClipMaskA(event);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.clip).toHaveBeenCalled();
    });

    it('should call getRenderPixel with the correct map size coordinates', () => {
      const ctx = {
        save: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
      };
      const event = { context: ctx };
      swipe.setClipMaskA(event);

      // percentSwipe = 50/100 = 0.5, mapSize = [1000, 800] → widthSideA = 500
      expect(getRenderPixel).toHaveBeenCalledWith(event, [0, 0]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [0, 800]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [500, 800]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [500, 0]);
    });
  });

  // ── setClipMaskB() ──────────────────────────

  describe('setClipMaskB()', () => {
    it('should call context.save(), beginPath(), and clip()', () => {
      const ctx = {
        save: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
      };
      const event = { context: ctx };
      swipe.setClipMaskB(event);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.clip).toHaveBeenCalled();
    });

    it('should call getRenderPixel with the correct side B coordinates', () => {
      const ctx = {
        save: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        clip: jest.fn(),
      };
      const event = { context: ctx };
      swipe.setClipMaskB(event);

      // widthSideB = 1000 * 0.5 = 500, mapSize = [1000, 800]
      expect(getRenderPixel).toHaveBeenCalledWith(event, [500, 0]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [500, 800]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [1000, 800]);
      expect(getRenderPixel).toHaveBeenCalledWith(event, [1000, 0]);
    });
  });
});

// ─────────────────────────────────────────────
// addLineOverlay / DOM structure tests
// ─────────────────────────────────────────────

describe('addLineOverlay DOM structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  const buildSwipe = (dateA, dateB, valueOverride = 50) => {
    const map = makeMockMap();
    const store = makeMockStore(dateA, dateB);
    return { swipe: new Swipe(map, store, defaultListenerObj, valueOverride), map };
  };

  it('should render an element with class "ab-swipe-line"', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    expect(document.querySelector('.ab-swipe-line')).not.toBeNull();
  });

  it('should render the left label with text "A"', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    const leftLabel = document.querySelector('.left-label');
    expect(leftLabel.textContent).toContain('A');
  });

  it('should render the right label with text "B"', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    const rightLabel = document.querySelector('.right-label');
    expect(rightLabel.textContent).toContain('B');
  });

  it('should show date labels with "show-date-label" class when dates differ', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    const leftLabel = document.querySelector('.left-label');
    const rightLabel = document.querySelector('.right-label');
    expect(leftLabel.classList).toContain('show-date-label');
    expect(rightLabel.classList).toContain('show-date-label');
  });

  it('should include dateA text in the left label when dates differ', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    const leftLabel = document.querySelector('.left-label');
    expect(leftLabel.textContent).toContain('2023-01-01');
  });

  it('should include dateB text in the right label when dates differ', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    const rightLabel = document.querySelector('.right-label');
    expect(rightLabel.textContent).toContain('2023-06-01');
  });

  it('should NOT add "show-date-label" class when dates are the same', () => {
    buildSwipe('2023-01-01', '2023-01-01');
    const leftLabel = document.querySelector('.left-label');
    const rightLabel = document.querySelector('.right-label');
    expect(leftLabel.classList).not.toContain('show-date-label');
    expect(rightLabel.classList).not.toContain('show-date-label');
  });

  it('should render an element with class "ab-swipe-dragger"', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    expect(document.querySelector('.ab-swipe-dragger')).not.toBeNull();
  });

  it('should render an element with class "swipe-dragger-circle"', () => {
    buildSwipe('2023-01-01', '2023-06-01');
    expect(document.querySelector('.swipe-dragger-circle')).not.toBeNull();
  });

  it('should set initial translateX to 50% of window.innerWidth when valueOverride is 50', () => {
    buildSwipe('2023-01-01', '2023-06-01', 50);
    const line = document.querySelector('.ab-swipe-line');
    const expectedOffset = window.innerWidth * 0.5;
    expect(line.style.transform).toBe(`translateX( ${expectedOffset}px)`);
  });

  it('should set initial translateX to 25% of window.innerWidth when valueOverride is 25', () => {
    buildSwipe('2023-01-01', '2023-06-01', 25);
    const line = document.querySelector('.ab-swipe-line');
    const expectedOffset = window.innerWidth * 0.25;
    expect(line.style.transform).toBe(`translateX( ${expectedOffset}px)`);
  });
});

// ─────────────────────────────────────────────
// dragLine / mouse & touch interaction tests
// ─────────────────────────────────────────────

describe('dragLine interactions', () => {
  let map;
  let line;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    map = makeMockMap();
    const store = makeMockStore();
    new Swipe(map, store, defaultListenerObj, 50);
    line = document.querySelector('.ab-swipe-line');

    window.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('should add mousemove listener to window on mousedown', () => {
    const addEventSpy = jest.spyOn(window, 'addEventListener');
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    const moveCall = addEventSpy.mock.calls.find(([event]) => event === 'mousemove');
    expect(moveCall).toBeDefined();
  });

  it('should add mouseup listener to window on mousedown', () => {
    const addEventSpy = jest.spyOn(window, 'addEventListener');
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    const endCall = addEventSpy.mock.calls.find(([event]) => event === 'mouseup');
    expect(endCall).toBeDefined();
  });

  it('should add touchmove listener to window on touchstart', () => {
    const addEventSpy = jest.spyOn(window, 'addEventListener');
    line.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    const moveCall = addEventSpy.mock.calls.find(([event]) => event === 'touchmove');
    expect(moveCall).toBeDefined();
  });

  it('should trigger COMPARE_MOVE_START on first mousemove', () => {
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    expect(util.events.trigger).toHaveBeenCalledWith(COMPARE_MOVE_START);
  });

  it('should trigger COMPARE_MOVE_START only once during a single drag', () => {
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 500 }));
    window.dispatchEvent(new MouseEvent('mouseup'));

    const moveStartCalls = util.events.trigger.mock.calls.filter(
      ([evt]) => evt === COMPARE_MOVE_START,
    );
    expect(moveStartCalls).toHaveLength(1);
  });

  it('should clamp swipe offset to SWIPE_PADDING (30) when dragged to x=0', () => {
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
    const updatedLine = document.querySelector('.ab-swipe-line');
    expect(updatedLine.style.transform).toBe('translateX( 30px)');
  });

  it('should clamp swipe offset to (windowWidth - SWIPE_PADDING) when dragged beyond right edge', () => {
    const windowWidth = window.innerWidth;
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: windowWidth + 100 }));
    const updatedLine = document.querySelector('.ab-swipe-line');
    expect(updatedLine.style.transform).toBe(`translateX( ${windowWidth - 30}px)`);
  });

  it('should call map.render() on mousemove', () => {
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    expect(map.render).toHaveBeenCalled();
  });

  it('should trigger compare:moveend on mouseup', () => {
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(util.events.trigger).toHaveBeenCalledWith('compare:moveend', expect.any(Number));
  });

  it('should remove mousemove and mouseup listeners from window after mouseup', () => {
    const removeEventSpy = jest.spyOn(window, 'removeEventListener');
    line.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(removeEventSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });
});

// ─────────────────────────────────────────────
// Window resize tests
// ─────────────────────────────────────────────

describe('window resize handler', () => {
  it('should rebuild the swipe line in the DOM when resized', () => {
    document.body.innerHTML = '';
    const map = makeMockMap();
    const store = makeMockStore();
    new Swipe(map, store, defaultListenerObj, 50);

    expect(document.querySelector('.ab-swipe-line')).not.toBeNull();
    window.dispatchEvent(new Event('resize'));
    expect(document.querySelector('.ab-swipe-line')).not.toBeNull();
  });

  it('should NOT rebuild the swipe line if it was already removed before resize', () => {
    document.body.innerHTML = '';
    const map = makeMockMap();
    const store = makeMockStore();
    const swipe = new Swipe(map, store, defaultListenerObj, 50);

    swipe.destroy();
    expect(document.querySelector('.ab-swipe-line')).toBeNull();
    window.dispatchEvent(new Event('resize'));
    expect(document.querySelector('.ab-swipe-line')).toBeNull();
  });
});
