/* eslint-disable no-new */
import Spy from './spy';

jest.mock('lodash', () => ({
  each: jest.fn((arr, fn) => arr.forEach(fn)),
}));

jest.mock('ol/render', () => ({
  getRenderPixel: jest.fn((event, pos) => pos),
}));

jest.mock('../../modules/compare/selectors', () => ({
  getCompareDates: jest.fn(),
}));

import { getRenderPixel } from 'ol/render';
import { getCompareDates } from '../../modules/compare/selectors';

const makeLayer = (subLayers) => {
  const layer = {
    on: jest.fn(),
    un: jest.fn(),
    get: jest.fn((key) => {
      if (key === 'layers' && subLayers) {
        return { getArray: () => subLayers };
      }
      return undefined;
    }),
  };
  return layer;
};

const makeLayerGroup = (subLayers) => ({
  on: jest.fn(),
  un: jest.fn(),
  get: jest.fn((key) => {
    if (key === 'layers') return { getArray: () => subLayers };
    return undefined;
  }),
});

const makeMap = (layer0, layer1) => ({
  on: jest.fn(),
  un: jest.fn(),
  render: jest.fn(),
  getEventPixel: jest.fn(() => [50, 60]),
  getLayers: jest.fn(() => ({
    getArray: jest.fn(() => [layer0, layer1]),
  })),
});

const makeStore = (overrides = {}) => ({
  getState: jest.fn(() => ({
    compare: { isCompareA: true, ...overrides.compare },
    ...overrides,
  })),
});

beforeEach(() => {
  document.body.innerHTML = '<div id="wv-map"></div>';
  getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
  getRenderPixel.mockImplementation((event, pos) => pos);
  jest.clearAllMocks();
  getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
});

const buildSpy = (storeOverrides = {}, layer0, layer1) => {
  const l0 = layer0 || makeLayer(null);
  const l1 = layer1 || makeLayer(null);
  const map = makeMap(l0, l1);
  const store = makeStore(storeOverrides);
  const instance = new Spy(map, store);
  return { instance, map, store, l0, l1 };
};

describe('Spy constructor and create', () => {
  test('creates instance and appends label to mapCase', () => {
    const { instance } = buildSpy();
    expect(document.querySelector('.ab-spy-span')).not.toBeNull();
    expect(instance.map).toBeDefined();
    expect(instance.mapCase).toBe(document.getElementById('wv-map'));
  });

  test('sets isBInside from store state', () => {
    const { instance } = buildSpy({ compare: { isCompareA: false } });
    expect(instance.isBInside).toBe(false);
  });

  test('label innerHTML is set via getDateText (isCompareA true, different dates)', () => {
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    buildSpy({ compare: { isCompareA: true } });
    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toContain('B');
    expect(label.innerHTML).toContain('2021-01-01');
  });

  test('label innerHTML shows A date when isCompareA is false', () => {
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    buildSpy({ compare: { isCompareA: false } });
    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toContain('A');
    expect(label.innerHTML).toContain('2020-01-01');
  });

  test('label innerHTML shows only letter when dates are same', () => {
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2020-01-01' });
    buildSpy({ compare: { isCompareA: true } });
    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toBe('B');
  });

  test('registers mousemove, mouseleave, mouseenter on mapCase and pointerdrag on map', () => {
    const { map } = buildSpy();
    expect(map.on).toHaveBeenCalledWith('pointerdrag', expect.any(Function));
    expect(map.on).toHaveBeenCalledWith('pointerdrag', expect.any(Function));
  });
});

describe('addSpy', () => {
  test('label has correct class names', () => {
    buildSpy();
    const label = document.querySelector('.ab-spy-span.inside-label');
    expect(label).not.toBeNull();
  });

  test('label display is none initially', () => {
    buildSpy();
    const label = document.querySelector('.ab-spy-span');
    expect(label.style.display).toBe('none');
  });

  test('returns mapCase element', () => {
    const { instance } = buildSpy();
    expect(instance.mapCase).toBe(document.getElementById('wv-map'));
  });
});

describe('update', () => {
  test('updates label innerHTML when dateA changes', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    getCompareDates.mockReturnValue({ dateA: '2022-06-01', dateB: '2021-01-01' });
    instance.update(store);

    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toContain('2021-01-01');
  });

  test('updates label innerHTML when dateB changes', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2022-06-01' });
    instance.update(store);

    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toContain('2022-06-01');
  });

  test('updates label when dateA equals dateB', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2020-01-01' });
    new Spy(map, store);
    const label = document.querySelector('.ab-spy-span');
    expect(label.innerHTML).toBe('B');
  });

  test('calls destroy and create when isBInside changes', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);

    let isCompareA = true;
    const store = {
      getState: jest.fn(() => ({ compare: { isCompareA } })),
    };
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    const destroySpy = jest.spyOn(instance, 'destroy');
    const createSpy = jest.spyOn(instance, 'create');

    isCompareA = false;
    instance.update(store);

    expect(destroySpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
  });

  test('applies listeners to both layer groups when isBInside unchanged', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    expect(l0.on).toHaveBeenCalledWith('postrender', expect.any(Function));
    expect(l1.on).toHaveBeenCalledWith('prerender', expect.any(Function));
    expect(l1.on).toHaveBeenCalledWith('postrender', expect.any(Function));
  });

  test('recursively applies listeners through layer groups', () => {
    const leaf0 = makeLayer(null);
    const leaf1 = makeLayer(null);
    const group0 = makeLayerGroup([leaf0]);
    const group1 = makeLayerGroup([leaf1]);
    const map = makeMap(group0, group1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    expect(leaf0.on).toHaveBeenCalledWith('postrender', expect.any(Function));
    expect(leaf1.on).toHaveBeenCalledWith('prerender', expect.any(Function));
  });
});

describe('destroy', () => {
  test('removes child label and unregisters listeners', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    const mapCase = document.getElementById('wv-map');
    expect(mapCase.querySelector('.ab-spy-span')).not.toBeNull();

    instance.destroy();

    expect(mapCase.querySelector('.ab-spy-span')).toBeNull();
    expect(map.un).toHaveBeenCalledWith('pointerdrag', expect.any(Function));
  });

  test('calls un on layers that had listeners applied', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    instance.destroy();

    expect(l1.un).toHaveBeenCalledWith('prerender', expect.any(Function));
    expect(l1.un).toHaveBeenCalledWith('postrender', expect.any(Function));
  });
});

describe('updateSpy', () => {
  test('uses e.pixel when available', () => {
    const { instance, map } = buildSpy();
    instance.updateSpy({ pixel: [100, 200] });
    expect(map.render).toHaveBeenCalled();
    const label = document.querySelector('.ab-spy-span');
    expect(label.style.top).toContain('px');
    expect(label.style.left).toContain('px');
  });

  test('falls back to map.getEventPixel when e.pixel is absent', () => {
    const { instance, map } = buildSpy();
    const fakeEvent = {};
    map.getEventPixel.mockReturnValue([30, 40]);
    instance.updateSpy(fakeEvent);
    expect(map.getEventPixel).toHaveBeenCalledWith(fakeEvent);
    expect(map.render).toHaveBeenCalled();
  });

  test('computes label position based on radius offset', () => {
    const { instance } = buildSpy();
    instance.updateSpy({ pixel: [0, 0] });
    const label = document.querySelector('.ab-spy-span');
    const offset = Math.sqrt((140 * 140) / 2);
    expect(label.style.top).toBe(`${offset - 10}px`);
    expect(label.style.left).toBe(`${offset - 5}px`);
  });
});

describe('hideSpy', () => {
  test('sets label display to none and renders map', () => {
    const { instance, map } = buildSpy();
    instance.showSpy();
    instance.hideSpy({});
    const label = document.querySelector('.ab-spy-span');
    expect(label.style.display).toBe('none');
    expect(map.render).toHaveBeenCalled();
  });
});

describe('showSpy', () => {
  test('sets label display to block and renders map', () => {
    const { instance, map } = buildSpy();
    instance.showSpy();
    const label = document.querySelector('.ab-spy-span');
    expect(label.style.display).toBe('block');
    expect(map.render).toHaveBeenCalled();
  });
});

describe('clip and inverseClip canvas operations', () => {
  const makeCtx = () => ({
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    clip: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
    lineWidth: 0,
    strokeStyle: '',
  });

  const triggerPrerender = (layer, event) => {
    const call = layer.on.mock.calls.find(([evt]) => evt === 'prerender');
    if (call) call[1](event);
  };

  const triggerPostrender = (layer, event, index = 0) => {
    const calls = layer.on.mock.calls.filter(([evt]) => evt === 'postrender');
    if (calls[index]) calls[index][1](event);
  };

  test('clip: calls save, beginPath, clip and ctx operations when mousePosition is null initially', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    const ctx = makeCtx();
    triggerPrerender(l1, { context: ctx });
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.clip).toHaveBeenCalled();
  });

  test('clip: draws arc when mousePosition is set', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    instance.updateSpy({ pixel: [50, 50] });

    getRenderPixel
      .mockReturnValueOnce([50, 50])
      .mockReturnValueOnce([190, 50]);

    const ctx = makeCtx();
    triggerPrerender(l1, { context: ctx });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  test('restore: calls ctx.restore on postrender', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    const ctx = makeCtx();
    triggerPostrender(l1, { context: ctx }, 0);
    expect(ctx.restore).toHaveBeenCalled();
  });

  test('inverseClip: calls save, beginPath when mousePosition is null', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    const ctx = makeCtx();
    triggerPostrender(l0, { context: ctx }, 0);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
  });

  test('inverseClip: draws arc and clears rect when mousePosition is set', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    const instance = new Spy(map, store);

    instance.updateSpy({ pixel: [50, 50] });

    getRenderPixel
      .mockReturnValueOnce([50, 50])
      .mockReturnValueOnce([190, 50]);

    const ctx = makeCtx();
    triggerPostrender(l0, { context: ctx }, 0);
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.clip).toHaveBeenCalled();
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  test('restore on l0 postrender second call', () => {
    const l0 = makeLayer(null);
    const l1 = makeLayer(null);
    const map = makeMap(l0, l1);
    const store = makeStore({ compare: { isCompareA: true } });
    getCompareDates.mockReturnValue({ dateA: '2020-01-01', dateB: '2021-01-01' });
    new Spy(map, store);

    const ctx = makeCtx();
    triggerPostrender(l0, { context: ctx }, 1);
    expect(ctx.restore).toHaveBeenCalled();
  });
});
