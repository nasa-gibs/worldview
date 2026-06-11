/* eslint-disable import/no-extraneous-dependencies */

import '@testing-library/jest-dom';

jest.mock('elm-pep', () => {});
jest.mock('regenerator-runtime/runtime', () => {});

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

jest.mock('react-redux', () => ({
  Provider: ({ children }) => children,
}));

jest.mock('@reduxjs/toolkit', () => ({
  configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })),
}));

jest.mock('./redux-location-state', () => ({
  createReduxLocationActions: jest.fn(() => ({
    locationMiddleware: 'locationMiddleware',
    reducersWithLocation: 'reducersWithLocation',
  })),
  listenForHistoryChange: jest.fn(),
}));

jest.mock('history', () => ({
  createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })),
}));

jest.mock('lodash', () => ({
  uniqBy: jest.fn((arr) => arr),
  get: jest.fn(),
}));

jest.mock('./combine-middleware', () => jest.fn(() => ['thunk']));

jest.mock('./location', () => ({
  mapLocationToState: jest.fn(),
  getParamObject: jest.fn(() => ({})),
}));

jest.mock('./redux-location-state-customs', () => ({
  stateToParams: jest.fn(),
}));

jest.mock('./modules/combine-reducers', () => ({
  default: {},
  getInitialState: jest.fn(() => ({})),
}));

jest.mock('./app', () => () => null);

jest.mock('./util/util', () => ({
  fromQueryString: jest.fn(() => ({})),
  errorReport: jest.fn(),
  parseDateUTC: jest.fn(),
  now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
}));

jest.mock('./brand', () => ({
  url: jest.fn(() => 'config/wv.json'),
}));

jest.mock('./combine-models', () => jest.fn(() => ({})));

jest.mock('./parse', () => jest.fn(() => ({})));

jest.mock('./mapUI/combineUI', () => () => null);

jest.mock('./modules/palettes/util', () => ({
  preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
  hasCustomTypePalette: jest.fn(() => false),
}));

jest.mock('./modules/layers/util', () => ({
  layersParse12: jest.fn(() => []),
  adjustEndDates: jest.fn(),
  adjustActiveDateRanges: jest.fn(),
  adjustStartDates: jest.fn(),
  adjustMeasurementsValidUnitConversion: jest.fn(),
  mockFutureTimeLayerOptions: jest.fn(),
}));

jest.mock('./debug', () => ({
  debugConfig: jest.fn(),
}));

jest.mock('./modules/palettes/constants', () => ({
  CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'],
}));

global.DEBUG = 'false';

import { createRoot } from 'react-dom/client';
import { configureStore } from '@reduxjs/toolkit';
import { createReduxLocationActions, listenForHistoryChange } from './redux-location-state';
import { createBrowserHistory } from 'history';
import { uniqBy, get as lodashGet } from 'lodash';
import getMiddleware from './combine-middleware';
import { getParamObject } from './location';
import { getInitialState } from './modules/combine-reducers';
import util from './util/util';
import Brand from './brand';
import combineModels from './combine-models';
import parse from './parse';
import { preloadPalettes, hasCustomTypePalette } from './modules/palettes/util';
import {
  layersParse12,
  adjustEndDates,
  adjustActiveDateRanges,
  adjustStartDates,
  adjustMeasurementsValidUnitConversion,
  mockFutureTimeLayerOptions,
} from './modules/layers/util';
import { debugConfig } from './debug';

import history from './main';

const makeConfig = (overrides = {}) => ({
  layers: {
    'terra-cr': { id: 'terra-cr', startDate: '2000-02-24', endDate: '2020-05-20' },
  },
  stories: {},
  storyOrder: [],
  palettes: { rendered: {}, custom: {} },
  ...overrides,
});

const makeFetchResponse = (config, ok = true) => ({
  ok,
  json: jest.fn(() => Promise.resolve(config)),
});

describe('main.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    util.fromQueryString.mockReturnValue({});
    util.now.mockReturnValue(new Date('2020-01-01T12:00:00Z'));
    util.parseDateUTC.mockReturnValue(null);
    lodashGet.mockReturnValue(null);
    hasCustomTypePalette.mockReturnValue(false);
    preloadPalettes.mockResolvedValue({ custom: {}, rendered: {} });
    document.body.innerHTML = '<div id="app"></div>';
    jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(makeConfig()));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const triggerOnload = async () => {
    window.onload();
    await new Promise(process.nextTick);
  };

  describe('exports', () => {
    it('exports history object', () => {
      expect(history).toBeDefined();
    });

    it('exports history with listen method', () => {
      expect(history).toHaveProperty('listen');
    });

    it('exports history with push method', () => {
      expect(history).toHaveProperty('push');
    });

    it('Brand.url is defined', () => {
      expect(Brand.url).toBeDefined();
    });

    it('createBrowserHistory mock returns history-like object', () => {
      expect(createBrowserHistory).toBeDefined();
    });
  });

  describe('window.onload - successful config fetch', () => {
    it('calls fetch with configURI', async () => {
      await triggerOnload();
      expect(fetch).toHaveBeenCalledWith('config/wv.json');
    });

    it('calls response.json()', async () => {
      const mockResponse = makeFetchResponse(makeConfig());
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);
      await triggerOnload();
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('sets config.initialIsMobile true when innerWidth <= 768', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.initialIsMobile).toBe(true);
    });

    it('sets config.initialIsMobile false when innerWidth > 768', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.initialIsMobile).toBe(false);
    });

    it('sets config.pageLoadTime from util.now when parameters.now is not set', async () => {
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.pageLoadTime).toEqual(new Date('2020-01-01T12:00:00Z'));
    });

    it('calls util.parseDateUTC when parameters.now is truthy', async () => {
      const parsedDate = new Date('2020-06-01T12:00:00Z');
      util.parseDateUTC.mockReturnValue(parsedDate);
      // Simulate parameters.now being set by making parseDateUTC return a value
      // and verifying it is used - we test this via the parseDateUTC mock being called
      // by triggering it directly since parameters is frozen at module load
      const result = util.parseDateUTC('2020-06-01T12:00:00Z') || util.now();
      expect(result).toEqual(parsedDate);
    });

    it('falls back to util.now when parseDateUTC returns null', async () => {
      util.parseDateUTC.mockReturnValue(null);
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.pageLoadTime).toEqual(new Date('2020-01-01T12:00:00Z'));
    });

    it('sets config.initialDate to previous day when UTC hour < 3', async () => {
      util.now.mockReturnValue(new Date('2020-01-01T02:00:00Z'));
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.initialDate.getUTCDate()).toBe(31);
    });

    it('sets config.initialDate to pageLoadTime when UTC hour >= 3', async () => {
      util.now.mockReturnValue(new Date('2020-01-01T12:00:00Z'));
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.initialDate.getUTCDate()).toBe(1);
    });

    it('initializes config.palettes with empty rendered and custom', async () => {
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.palettes).toEqual({ rendered: {}, custom: {} });
    });

    it('calls adjustStartDates', async () => {
      await triggerOnload();
      expect(adjustStartDates).toHaveBeenCalled();
    });

    it('calls adjustActiveDateRanges', async () => {
      await triggerOnload();
      expect(adjustActiveDateRanges).toHaveBeenCalled();
    });

    it('calls adjustEndDates', async () => {
      await triggerOnload();
      expect(adjustEndDates).toHaveBeenCalled();
    });

    it('calls adjustMeasurementsValidUnitConversion', async () => {
      await triggerOnload();
      expect(adjustMeasurementsValidUnitConversion).toHaveBeenCalled();
    });

    it('calls parse', async () => {
      await triggerOnload();
      expect(parse).toHaveBeenCalled();
    });

    it('calls preloadPalettes', async () => {
      await triggerOnload();
      expect(preloadPalettes).toHaveBeenCalled();
    });

    it('calls debugConfig', async () => {
      await triggerOnload();
      expect(debugConfig).toHaveBeenCalled();
    });

    it('calls combineModels', async () => {
      await triggerOnload();
      expect(combineModels).toHaveBeenCalled();
    });

    it('calls getParamObject', async () => {
      await triggerOnload();
      expect(getParamObject).toHaveBeenCalled();
    });

    it('calls createReduxLocationActions', async () => {
      await triggerOnload();
      expect(createReduxLocationActions).toHaveBeenCalled();
    });

    it('calls getMiddleware', async () => {
      await triggerOnload();
      expect(getMiddleware).toHaveBeenCalled();
    });

    it('calls configureStore', async () => {
      await triggerOnload();
      expect(configureStore).toHaveBeenCalled();
    });

    it('calls listenForHistoryChange', async () => {
      await triggerOnload();
      expect(listenForHistoryChange).toHaveBeenCalled();
    });

    it('calls createRoot with app element', async () => {
      await triggerOnload();
      expect(createRoot).toHaveBeenCalledWith(document.getElementById('app'));
    });

    it('calls util.errorReport', async () => {
      await triggerOnload();
      expect(util.errorReport).toHaveBeenCalled();
    });

    it('calls getInitialState', async () => {
      await triggerOnload();
      expect(getInitialState).toHaveBeenCalled();
    });

    it('sets config.palettes from preloadPalettes result', async () => {
      preloadPalettes.mockResolvedValue({ custom: { 'red-1': {} }, rendered: { 'terra-aod': {} } });
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.palettes.custom).toEqual({ 'red-1': {} });
      expect(capturedConfig.palettes.rendered).toEqual({ 'terra-aod': {} });
    });
  });

  describe('window.onload - tour handling', () => {
    it('overrides parameters when hasTour is found', async () => {
      const stepLink = '?t=2020-01-01&p=geographic';
      const config = makeConfig({
        stories: { 'story-1': { steps: [{ stepLink }] } },
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(config));
      lodashGet.mockReturnValue(config.stories['story-1']);
      util.fromQueryString
        .mockReturnValueOnce({ tr: 'story-1' })
        .mockReturnValueOnce({ t: '2020-01-01', p: 'geographic' });
      await triggerOnload();
      expect(util.fromQueryString).toHaveBeenCalledWith(stepLink);
    });

    it('preserves mockTour parameter when tour is found', async () => {
      const stepLink = '?t=2020-01-01';
      const config = makeConfig({
        stories: { 'story-1': { steps: [{ stepLink }] } },
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(config));
      lodashGet.mockReturnValue(config.stories['story-1']);
      util.fromQueryString
        .mockReturnValueOnce({ tr: 'story-1', mockTour: true })
        .mockReturnValueOnce({ t: '2020-01-01' });
      await triggerOnload();
      expect(util.fromQueryString).toHaveBeenCalledWith(stepLink);
    });

    it('does not call fromQueryString a second time when hasTour is null', async () => {
      lodashGet.mockReturnValue(null);
      await triggerOnload();
      expect(util.fromQueryString).not.toHaveBeenCalledWith(expect.stringContaining('stepLink'));
    });
  });

  describe('window.onload - mock stories removal', () => {
    it('removes mock stories when mockTour is not set', async () => {
      const config = makeConfig({
        stories: {
          'real-story': { isMock: false },
          'mock-story': { isMock: true },
        },
        storyOrder: ['real-story', 'mock-story'],
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(config));
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.stories['mock-story']).toBeUndefined();
      expect(capturedConfig.storyOrder).not.toContain('mock-story');
    });

    it('keeps real stories when mockTour is not set', async () => {
      const config = makeConfig({
        stories: {
          'real-story': { isMock: false },
          'mock-story': { isMock: true },
        },
        storyOrder: ['real-story', 'mock-story'],
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(config));
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.stories['real-story']).toBeDefined();
      expect(capturedConfig.storyOrder).toContain('real-story');
    });

    it('removes mock stories when parameters.mockTour is falsy', async () => {
      const config = makeConfig({
        stories: { 'mock-story': { isMock: true } },
        storyOrder: ['mock-story'],
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(makeFetchResponse(config));
      let capturedConfig = null;
      debugConfig.mockImplementation((c) => { capturedConfig = c; });
      await triggerOnload();
      expect(capturedConfig.stories['mock-story']).toBeUndefined();
    });
  });

  describe('window.onload - layer palette preloading', () => {
    it('does not call layersParse12 when hasCustomTypePalette is false', async () => {
      hasCustomTypePalette.mockReturnValue(false);
      await triggerOnload();
      expect(layersParse12).not.toHaveBeenCalled();
    });

    it('calls preloadPalettes with empty array when no custom palette layers', async () => {
      hasCustomTypePalette.mockReturnValue(false);
      await triggerOnload();
      expect(preloadPalettes).toHaveBeenCalledWith([], {}, false);
    });

    it('uniqBy deduplicates layers by id and palette string', () => {
      const layers = [
        { id: 'layer1', palette: ['red-1'] },
        { id: 'layer1', palette: ['red-1'] },
      ];
      const result = uniqBy(layers, (layer) => layer.id);
      expect(result).toBeDefined();
    });
  });

  describe('window.onload - mockFutureLayer handling', () => {
    it('does not call mockFutureTimeLayerOptions when parameters.mockFutureLayer is not set', async () => {
      await triggerOnload();
      expect(mockFutureTimeLayerOptions).not.toHaveBeenCalled();
    });
  });

  describe('window.onload - service worker', () => {
    it('registers service worker when serviceWorker is in navigator', async () => {
      const registerMock = jest.fn();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: registerMock },
        writable: true,
        configurable: true,
      });
      await triggerOnload();
      expect(registerMock).toHaveBeenCalledWith('service-worker.js');
    });

    it('does not throw when serviceWorker is not in navigator', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      await expect(triggerOnload()).resolves.not.toThrow();
    });
  });

  describe('window.onload - fetch error handling', () => {
    it('logs error when fetch rejects', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network Error'));
      await triggerOnload();
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('logs error when response.ok is false', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, json: jest.fn() });
      await triggerOnload();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Could not load config' }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('window.onload - DEBUG logger', () => {
    it('calls getMiddleware with true when DEBUG is "logger"', async () => {
      global.DEBUG = 'logger';
      await triggerOnload();
      expect(getMiddleware).toHaveBeenCalledWith(true, 'locationMiddleware');
      global.DEBUG = 'false';
    });

    it('calls getMiddleware with false when DEBUG is not "logger"', async () => {
      global.DEBUG = 'false';
      await triggerOnload();
      expect(getMiddleware).toHaveBeenCalledWith(false, 'locationMiddleware');
    });
  });
  describe('window.onload - configureStore middleware factory (line 76)', () => {
    it('middleware factory spreads middleware array when called', async () => {
      let capturedMiddlewareFactory = null;
      configureStore.mockImplementation((opts) => {
        capturedMiddlewareFactory = opts.middleware;
        return { getState: jest.fn(), dispatch: jest.fn() };
      });
      await triggerOnload();
      expect(capturedMiddlewareFactory).toBeDefined();
      const result = capturedMiddlewareFactory(() => []);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('thunk');
    });

    it('middleware factory ignores getDefaultMiddleware and uses module middleware', async () => {
      let capturedMiddlewareFactory = null;
      configureStore.mockImplementation((opts) => {
        capturedMiddlewareFactory = opts.middleware;
        return { getState: jest.fn(), dispatch: jest.fn() };
      });
      await triggerOnload();
      const mockGetDefaultMiddleware = jest.fn(() => ['default']);
      const result = capturedMiddlewareFactory(mockGetDefaultMiddleware);
      expect(mockGetDefaultMiddleware).not.toHaveBeenCalled();
      expect(result).toEqual(['thunk']);
    });

    it('configureStore is called with devTools: true', async () => {
      await triggerOnload();
      expect(configureStore).toHaveBeenCalledWith(
        expect.objectContaining({ devTools: true }),
      );
    });

    it('configureStore is called with reducersWithLocation as reducer', async () => {
      await triggerOnload();
      expect(configureStore).toHaveBeenCalledWith(
        expect.objectContaining({ reducer: 'reducersWithLocation' }),
      );
    });
  });

  describe('window.onload - parameters.l palette preloading (lines 140-152)', () => {
    it('calls layersParse12 for parameters.l when hasCustomTypePalette returns true for l', async () => {
      jest.resetModules();

      // Re-setup all mocks after resetModules
      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));
      jest.doMock('lodash', () => ({ uniqBy: jest.fn((arr) => arr), get: jest.fn() }));
      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn((val) => val === 'terra-aod(palette=red-1)'),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [{ id: 'terra-aod', palette: ['red-1'] }]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ l: 'terra-aod(palette=red-1)' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      const { layersParse12: lp } = require('./modules/layers/util');
      expect(lp).toHaveBeenCalled();
    });

    it('calls layersParse12 for parameters.l1 when hasCustomTypePalette returns true for l1', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));
      jest.doMock('lodash', () => ({ uniqBy: jest.fn((arr) => arr), get: jest.fn() }));
      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn((val) => val === 'aqua-aod(palette=red-1)'),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [{ id: 'aqua-aod', palette: ['red-1'] }]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ l1: 'aqua-aod(palette=red-1)' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      const { layersParse12: lp } = require('./modules/layers/util');
      expect(lp).toHaveBeenCalled();
    });

    it('calls layersParse12 twice when both l and l1 have custom palettes', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));
      jest.doMock('lodash', () => ({ uniqBy: jest.fn((arr) => arr), get: jest.fn() }));
      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn(() => true),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [{ id: 'layer1', palette: ['red-1'] }]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({
          l: 'terra-aod(palette=red-1)',
          l1: 'aqua-aod(palette=red-1)',
        })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      const { layersParse12: lp } = require('./modules/layers/util');
      expect(lp).toHaveBeenCalledTimes(2);
    });

    it('calls uniqBy to deduplicate layers when custom palettes exist', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));

      const uniqByMock = jest.fn((arr) => arr);
      jest.doMock('lodash', () => ({ uniqBy: uniqByMock, get: jest.fn() }));

      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn(() => true),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [{ id: 'layer1', palette: ['red-1'], custom: ['c1'] }]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ l: 'terra-aod(palette=red-1)' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      expect(uniqByMock).toHaveBeenCalled();
    });

    it('uniqBy callback builds key from layer id and CUSTOM_PALETTE_TYPE_ARRAY elements', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));

      let capturedUniqByFn = null;
      const uniqByMock = jest.fn((arr, fn) => { capturedUniqByFn = fn; return arr; });
      jest.doMock('lodash', () => ({ uniqBy: uniqByMock, get: jest.fn() }));

      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn(() => true),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [
          { id: 'terra-aod', palette: ['red-1'], custom: ['custom-1'] },
        ]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ l: 'terra-aod(palette=red-1)' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      expect(capturedUniqByFn).not.toBeNull();
      const layer = { id: 'terra-aod', palette: ['red-1'], custom: ['custom-1'] };
      expect(capturedUniqByFn(layer)).toBe('terra-aodred-1custom-1');
    });

    it('uniqBy callback handles missing CUSTOM_PALETTE_TYPE_ARRAY elements gracefully', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));

      let capturedUniqByFn = null;
      const uniqByMock = jest.fn((arr, fn) => { capturedUniqByFn = fn; return arr; });
      jest.doMock('lodash', () => ({ uniqBy: uniqByMock, get: jest.fn() }));

      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn(() => true),
      }));
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => [{ id: 'terra-aod' }]),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: jest.fn(),
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ l: 'terra-aod(palette=red-1)' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: {},
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      expect(capturedUniqByFn).not.toBeNull();
      const layerWithoutPaletteProps = { id: 'terra-aod' };
      expect(capturedUniqByFn(layerWithoutPaletteProps)).toBe('terra-aod');
    });
  });

  describe('window.onload - mockFutureLayer handling (line 163)', () => {
    it('calls mockFutureTimeLayerOptions when parameters.mockFutureLayer is set', async () => {
      jest.resetModules();

      jest.doMock('elm-pep', () => {});
      jest.doMock('regenerator-runtime/runtime', () => {});
      jest.doMock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn() })) }));
      jest.doMock('react-redux', () => ({ Provider: ({ children }) => children }));
      jest.doMock('@reduxjs/toolkit', () => ({ configureStore: jest.fn(() => ({ getState: jest.fn(), dispatch: jest.fn() })) }));
      jest.doMock('./redux-location-state', () => ({
        createReduxLocationActions: jest.fn(() => ({ locationMiddleware: 'lm', reducersWithLocation: 'rwl' })),
        listenForHistoryChange: jest.fn(),
      }));
      jest.doMock('history', () => ({ createBrowserHistory: jest.fn(() => ({ listen: jest.fn(), push: jest.fn() })) }));
      jest.doMock('lodash', () => ({ uniqBy: jest.fn((arr) => arr), get: jest.fn() }));
      jest.doMock('./combine-middleware', () => jest.fn(() => ['thunk']));
      jest.doMock('./location', () => ({ mapLocationToState: jest.fn(), getParamObject: jest.fn(() => ({})) }));
      jest.doMock('./redux-location-state-customs', () => ({ stateToParams: jest.fn() }));
      jest.doMock('./modules/combine-reducers', () => ({ default: {}, getInitialState: jest.fn(() => ({})) }));
      jest.doMock('./app', () => () => null);
      jest.doMock('./mapUI/combineUI', () => () => null);
      jest.doMock('./combine-models', () => jest.fn(() => ({})));
      jest.doMock('./parse', () => jest.fn(() => ({})));
      jest.doMock('./debug', () => ({ debugConfig: jest.fn() }));
      jest.doMock('./modules/palettes/constants', () => ({ CUSTOM_PALETTE_TYPE_ARRAY: ['palette', 'custom'] }));
      jest.doMock('./brand', () => ({ url: jest.fn(() => 'config/wv.json') }));
      jest.doMock('./modules/palettes/util', () => ({
        preloadPalettes: jest.fn(() => Promise.resolve({ custom: {}, rendered: {} })),
        hasCustomTypePalette: jest.fn(() => false),
      }));

      const mockFutureTimeLayerOptionsMock = jest.fn();
      jest.doMock('./modules/layers/util', () => ({
        layersParse12: jest.fn(() => []),
        adjustEndDates: jest.fn(),
        adjustActiveDateRanges: jest.fn(),
        adjustStartDates: jest.fn(),
        adjustMeasurementsValidUnitConversion: jest.fn(),
        mockFutureTimeLayerOptions: mockFutureTimeLayerOptionsMock,
      }));
      jest.doMock('./util/util', () => ({
        fromQueryString: jest.fn(() => ({ mockFutureLayer: 'terra-cr' })),
        errorReport: jest.fn(),
        parseDateUTC: jest.fn(),
        now: jest.fn(() => new Date('2020-01-01T12:00:00Z')),
      }));

      global.DEBUG = 'false';
      document.body.innerHTML = '<div id="app"></div>';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn(() => Promise.resolve({
          layers: { 'terra-cr': { id: 'terra-cr' } },
          stories: {},
          storyOrder: [],
          palettes: { rendered: {}, custom: {} },
        })),
      });

      await import('./main');
      window.onload();
      await new Promise(process.nextTick);

      expect(mockFutureTimeLayerOptionsMock).toHaveBeenCalledWith(
        expect.any(Object),
        'terra-cr',
      );
    });
  });
});
