/* eslint-disable no-new */
import Spy from './spy';
import { getCompareDates } from '../../modules/compare/selectors';

jest.mock('ol/render', () => ({
  getRenderPixel: jest.fn((event, pixel) => pixel),
}));

jest.mock('../../modules/compare/selectors', () => ({
  getCompareDates: jest.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeLayer = () => ({
  on: jest.fn(),
  un: jest.fn(),
  get: jest.fn(() => null),
});

const makeLayerGroup = (layers) => ({
  on: jest.fn(),
  un: jest.fn(),
  get: jest.fn((key) => (key === 'layers' ? { getArray: () => layers } : null)),
});

const makeMap = (layer0, layer1) => ({
  on: jest.fn(),
  un: jest.fn(),
  render: jest.fn(),
  getEventPixel: jest.fn(() => [50, 50]),
  getLayers: jest.fn(() => ({
    getArray: jest.fn(() => [layer0, layer1]),
  })),
});

const makeStore = (overrides = {}) => {
  const state = {
    compare: {
      isCompareA: true,
      ...overrides.compare,
    },
    ...overrides,
  };
  return { getState: jest.fn(() => state) };
};

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = '<div id="wv-map"></div>';
  getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2020-06-01' });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Constructor ────────────────────────────────────────────────────────────

describe('Spy constructor', () => {
  test('sets mapCase to the wv-map element', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    const instance = new Spy(map, store);

    expect(instance.mapCase).toBe(document.getElementById('wv-map'));
  });

  test('sets this.map to the provided olMap', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    const instance = new Spy(map, store);

    expect(instance.map).toBe(map);
  });

  test('sets isBInside from state.compare.isCompareA', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore({ compare: { isCompareA: false } });

    const instance = new Spy(map, store);

    expect(instance.isBInside).toBe(false);
  });

  test('calls create() during construction', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    const createSpy = jest.spyOn(Spy.prototype, 'create');
    new Spy(map, store);

    expect(createSpy).toHaveBeenCalledWith(store);
    createSpy.mockRestore();
  });
});

// ─── addSpy ─────────────────────────────────────────────────────────────────

describe('addSpy', () => {
  test('appends a label span to the mapCase', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    new Spy(map, store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label).not.toBeNull();
  });

  test('label is initially hidden', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    new Spy(map, store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.display).toBe('none');
  });

  test('registers mousemove listener on mapCase', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const addEventSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

    new Spy(map, store);

    const mousemoveCalls = addEventSpy.mock.calls.filter(([event]) => event === 'mousemove');
    expect(mousemoveCalls.length).toBeGreaterThan(0);
    addEventSpy.mockRestore();
  });

  test('registers mouseleave listener on mapCase', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const addEventSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

    new Spy(map, store);

    const mouseleaveCalls = addEventSpy.mock.calls.filter(([event]) => event === 'mouseleave');
    expect(mouseleaveCalls.length).toBeGreaterThan(0);
    addEventSpy.mockRestore();
  });

  test('registers mouseenter listener on mapCase', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const addEventSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');

    new Spy(map, store);

    const mouseenterCalls = addEventSpy.mock.calls.filter(([event]) => event === 'mouseenter');
    expect(mouseenterCalls.length).toBeGreaterThan(0);
    addEventSpy.mockRestore();
  });

  test('registers pointerdrag listener on map', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    new Spy(map, store);

    expect(map.on).toHaveBeenCalledWith('pointerdrag', expect.any(Function));
  });

  test('label innerHTML reflects isCompareA=true (shows B)', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore({ compare: { isCompareA: true } });

    new Spy(map, store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.innerHTML).toContain('B');
  });

  test('label innerHTML reflects isCompareA=false (shows A)', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore({ compare: { isCompareA: false } });

    new Spy(map, store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.innerHTML).toContain('A');
  });
});

// ─── updateSpy ──────────────────────────────────────────────────────────────

describe('updateSpy', () => {
  test('updates label position and calls map.render when pixel is provided', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    map.render.mockClear();
    instance.updateSpy({ pixel: [100, 200] });

    expect(map.render).toHaveBeenCalled();
    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.top).not.toBe('');
    expect(label.style.left).not.toBe('');
  });

  test('falls back to map.getEventPixel when pixel is not provided', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    map.render.mockClear();
    instance.updateSpy({});

    expect(map.getEventPixel).toHaveBeenCalled();
    expect(map.render).toHaveBeenCalled();
  });

  test('label top is calculated correctly from pixel', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.updateSpy({ pixel: [100, 200] });

    const DEFAULT_RADIUS = 140;
    const offSetXandY = Math.sqrt((DEFAULT_RADIUS * DEFAULT_RADIUS) / 2);
    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.top).toBe(`${200 + offSetXandY - 10}px`);
  });

  test('label left is calculated correctly from pixel', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.updateSpy({ pixel: [100, 200] });

    const DEFAULT_RADIUS = 140;
    const offSetXandY = Math.sqrt((DEFAULT_RADIUS * DEFAULT_RADIUS) / 2);
    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.left).toBe(`${100 + offSetXandY - 5}px`);
  });
});

// ─── hideSpy ────────────────────────────────────────────────────────────────

describe('hideSpy', () => {
  test('hides label and calls map.render', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    map.render.mockClear();
    instance.hideSpy({});

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.display).toBe('none');
    expect(map.render).toHaveBeenCalled();
  });
});

// ─── showSpy ────────────────────────────────────────────────────────────────

describe('showSpy', () => {
  test('shows label and calls map.render', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.hideSpy({});
    map.render.mockClear();
    instance.showSpy();

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.style.display).toBe('block');
    expect(map.render).toHaveBeenCalled();
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('update', () => {
  test('updates label innerHTML when dateA changes', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    getCompareDates.mockReturnValue({ dateA: '2021-01-01', dateB: '2020-06-01' });
    instance.update(store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.innerHTML).toContain('2020-06-01');
  });

  test('updates label innerHTML when dateB changes', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-12-01' });
    instance.update(store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label.innerHTML).toContain('2021-12-01');
  });

  test('updates label innerHTML when dates are the same', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2020-01-01' });
    new Spy(map, store);

    const label = document.querySelector('.ab-spy-span.inside-label');
    // same date means no date text appended
    expect(label.innerHTML).not.toContain('monospace');
  });

  test('applies layer listeners during update', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();

    new Spy(map, store);

    expect(layer0.on).toHaveBeenCalled();
    expect(layer1.on).toHaveBeenCalled();
  });

  test('calls destroy and create when isBInside changes', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore({ compare: { isCompareA: true } });
    const instance = new Spy(map, store);

    const destroySpy = jest.spyOn(instance, 'destroy');
    const createSpy = jest.spyOn(instance, 'create');

    // Flip isCompareA
    store.getState.mockReturnValue({
      compare: { isCompareA: false },
    });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2020-06-01' });

    instance.update(store);

    expect(destroySpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
  });

  test('does not call destroy when isBInside has not changed', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore({ compare: { isCompareA: true } });
    const instance = new Spy(map, store);

    const destroySpy = jest.spyOn(instance, 'destroy');

    instance.update(store);

    expect(destroySpy).not.toHaveBeenCalled();
  });
});

// ─── destroy ────────────────────────────────────────────────────────────────

describe('destroy', () => {
  test('removes label from mapCase', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.destroy();

    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label).toBeNull();
  });

  test('calls map.un to remove pointerdrag listener', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    map.un.mockClear();
    instance.destroy();

    expect(map.un).toHaveBeenCalledWith('pointerdrag', expect.any(Function));
  });

  test('removes listeners from top layers', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.destroy();

    expect(layer1.un).toHaveBeenCalledWith('prerender', expect.any(Function));
    expect(layer1.un).toHaveBeenCalledWith('postrender', expect.any(Function));
  });

  test('removes listeners from bottom layers', () => {
    const layer0 = makeLayer();
    const layer1 = makeLayer();
    const map = makeMap(layer0, layer1);
    const store = makeStore();
    const instance = new Spy(map, store);

    instance.destroy();

    expect(layer0.un).toHaveBeenCalledWith('postrender', expect.any(Function));
  });
});

// ─── applyEventsToBaseLayers (via layer groups) ──────────────────────────────

describe('applyEventsToBaseLayers recursion', () => {
  test('recursively applies listeners to nested layer groups', () => {
    const leafLayer0 = makeLayer();
    const leafLayer1 = makeLayer();
    const nestedGroup = makeLayerGroup([leafLayer0]);
    const topGroup = makeLayerGroup([nestedGroup, leafLayer1]);
    const map = makeMap(topGroup, makeLayer());
    const store = makeStore();

    new Spy(map, store);

    expect(leafLayer0.on).toHaveBeenCalled();
  });
});
