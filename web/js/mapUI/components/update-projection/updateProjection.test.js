/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import * as layerConstants from '../../../modules/layers/constants';
import * as compareConstants from '../../../modules/compare/constants';
import * as paletteConstants from '../../../modules/palettes/constants';
import * as vectorStyleConstants from '../../../modules/vector-styles/constants';
import { LOCATION_POP_ACTION } from '../../../redux-location-state-customs';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../../../modules/animation/constants';
import { SET_SCREEN_INFO } from '../../../modules/screen-size/constants';
import { getLayers, getActiveLayers } from '../../../modules/layers/selectors';
import { getSelectedDate } from '../../../modules/date/selectors';
import { getLeadingExtent } from '../../../modules/map/util';
import { fly } from '../../../map/util';
import { loadLayersWithSlots } from '../../util/util';
import util from '../../../util/util';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: () => (Component) => Component,
}));

jest.mock('../../../modules/layers/selectors');
jest.mock('../../../modules/date/selectors');
jest.mock('../../../modules/map/util');
jest.mock('../../../map/util');
jest.mock('../../util/util');
jest.mock('../../../util/util', () => ({ fromQueryString: jest.fn() }));
jest.mock('ol/layer/Group', () => jest.fn().mockImplementation((opts) => opts));
jest.mock('../../../modules/map/actions', () => ({
  fitToLeadingExtent: jest.fn(),
  updateMapUI: jest.fn(),
}));
jest.mock('../../../modules/palettes/actions', () => ({
  requestPalette: jest.fn(),
}));
jest.mock('../../../modules/layers/actions', () => ({
  addTEMPODateRanges: jest.fn(),
}));

/**
 * Replicate usePrevious so it works in the JSDOM/Jest environment without
 * real React batching concerns.
 */
jest.mock('../../../util/customHooks', () => (val) => {
  const { useRef, useEffect } = require('react');
  const ref = useRef(val);
  const prev = ref.current;
  useEffect(() => {
    ref.current = val;
  });
  return prev;
});

// Import the component AFTER all mocks are registered
const UpdateProjection = require('./updateProjection').default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush all pending microtasks / resolved promises. */
const flushPromises = () => new Promise((resolve) => { Promise.resolve().then(resolve); });

/**
 * Build a minimal, fully-valid OpenLayers-like map object.
 * @param {string} targetId - unique DOM id returned by getTarget(), used by
 *   hideMap/showMap.  Give different maps different ids so the two calls
 *   don't stomp on each other.
 */
const makeMapObj = (targetId = 'map-target') => {
  const mockView = {
    fit: jest.fn(),
    setRotation: jest.fn(),
    getRotation: jest.fn().mockReturnValue(0),
    calculateExtent: jest.fn().mockReturnValue([0, 0, 10, 10]),
    getResolutionForExtent: jest.fn().mockReturnValue(1),
    getZoomForResolution: jest.fn().mockReturnValue(5),
  };
  return {
    setLayers: jest.fn(),
    getLayers: jest.fn().mockReturnValue({ getArray: jest.fn().mockReturnValue([]) }),
    getView: jest.fn().mockReturnValue(mockView),
    getTarget: jest.fn().mockReturnValue(targetId),
    getSize: jest.fn().mockReturnValue([800, 600]),
    updateSize: jest.fn(),
    setCenter: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    center: null,
    wv: { scaleImperial: {}, scaleMetric: {} },
  };
};

const buildProps = (overrides = {}) => {
  const geographicMap = makeMapObj('map-geographic');
  const arcticMap = makeMapObj('map-arctic');
  const webmercMap = makeMapObj('map-webmerc');

  const ui = {
    selected: geographicMap,
    proj: {
      geographic: geographicMap,
      arctic: arcticMap,
      webmerc: webmercMap,
    },
    createLayer: jest.fn().mockResolvedValue({ wv: {} }),
    cache: { clear: jest.fn() },
    processingPromise: null,
  };

  return {
    action: { type: 'UNKNOWN_ACTION' },
    activeLayers: [],
    compare: {
      active: false,
      activeString: 'active',
      isCompareA: true,
      mode: 'swipe',
    },
    compareMode: 'swipe',
    compareMapUi: {
      active: false,
      destroy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    config: {
      features: { compare: true },
      pageLoadTime: new Date(),
    },
    dateCompareState: {},
    fitToLeadingExtent: jest.fn(),
    getGranuleOptions: jest.fn().mockReturnValue({}),
    layerCreationQueue: {},
    isKioskModeActive: false,
    isMobile: false,
    layerState: {},
    map: {},
    models: { map: {} },
    preloadForCompareMode: jest.fn(),
    // Both shapes used by the component:
    //   updateProjection()  → proj.id
    //   start branch        → proj.selected.id
    proj: { id: 'geographic', selected: { id: 'geographic' } },
    projectionTrigger: 0,
    updateExtent: jest.fn(),
    updateLayerVisibilities: jest.fn(),
    updateMapUI: jest.fn(),
    ui,
    renderedPalettes: {},
    requestPalette: jest.fn(),
    addTEMPODateRanges: jest.fn(),
    ...overrides,
  };
};

const renderComponent = (props) => render(<UpdateProjection {...props} />);

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('UpdateProjection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLayers.mockReturnValue([]);
    getActiveLayers.mockReturnValue([]);
    getSelectedDate.mockReturnValue(new Date('2023-01-01'));
    getLeadingExtent.mockReturnValue(null);
    fly.mockReturnValue(undefined);
    loadLayersWithSlots.mockResolvedValue(undefined);
    util.fromQueryString.mockReturnValue({});
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('renders null', () => {
    it('returns null — component mounts without visible DOM output', () => {
      const { container } = renderComponent(buildProps());
      expect(container.firstChild).toBeNull();
    });
  });

  // ── actionSwitch — unknown / default ──────────────────────────────────────

  describe('actionSwitch — default / unknown action', () => {
    it('does not call any side-effect functions for an unknown action', () => {
      const props = buildProps({ action: { type: 'UNKNOWN' } });
      renderComponent(props);
      expect(props.updateLayerVisibilities).not.toHaveBeenCalled();
      expect(props.preloadForCompareMode).not.toHaveBeenCalled();
    });
  });

  // ── actionSwitch — STOP_ANIMATION / EXIT_ANIMATION ────────────────────────

  describe('actionSwitch — STOP_ANIMATION / EXIT_ANIMATION', () => {
    it('does not call reloadLayers when there are no vector layers', async () => {
      const props = buildProps({
        action: { type: STOP_ANIMATION },
        activeLayers: [{ type: 'tile', id: 'tile-1' }],
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });

    it('calls reloadLayers when vector layers are present (STOP_ANIMATION)', async () => {
      getLayers.mockReturnValue([{ id: 'vec-1' }]);
      const props = buildProps({
        action: { type: STOP_ANIMATION },
        activeLayers: [{ type: 'vector', id: 'vec-1' }],
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('handles EXIT_ANIMATION the same as STOP_ANIMATION with vector layers', async () => {
      getLayers.mockReturnValue([{ id: 'vec-1' }]);
      const props = buildProps({
        action: { type: EXIT_ANIMATION },
        activeLayers: [{ type: 'vector', id: 'vec-1' }],
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('waits for an existing processingPromise before reloading', async () => {
      getLayers.mockReturnValue([{ id: 'vec-1' }]);
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });
      const props = buildProps({
        action: { type: STOP_ANIMATION },
        activeLayers: [{ type: 'vector', id: 'vec-1' }],
      });
      props.ui.processingPromise = processingPromise;
      renderComponent(props);
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
      resolveFn();
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('still reloads even when the existing processingPromise rejects', async () => {
      getLayers.mockReturnValue([{ id: 'vec-1' }]);
      const props = buildProps({
        action: { type: STOP_ANIMATION },
        activeLayers: [{ type: 'vector', id: 'vec-1' }],
      });
      props.ui.processingPromise = Promise.reject(new Error('boom'));
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });
  });

  // ── actionSwitch — LOCATION_POP_ACTION ────────────────────────────────────

  describe('actionSwitch — LOCATION_POP_ACTION', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('calls updateExtent after the 200 ms timeout', async () => {
      util.fromQueryString.mockReturnValue({});
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: {},
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(props.updateExtent).toHaveBeenCalled();
    });

    it('calls flyToNewExtent when state has v, no e, and an extent exists', async () => {
      util.fromQueryString.mockReturnValue({ v: '0,0,10,10' });
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: { extent: [0, 0, 10, 10] },
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(fly).toHaveBeenCalled();
    });

    it('does NOT call flyToNewExtent when e is present in parsed state', async () => {
      util.fromQueryString.mockReturnValue({ v: '0,0,10,10', e: 'event-id' });
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: { extent: [0, 0, 10, 10] },
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(fly).not.toHaveBeenCalled();
    });

    it('does NOT call flyToNewExtent when no extent is in map state', async () => {
      util.fromQueryString.mockReturnValue({ v: '0,0,10,10' });
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: {},
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(fly).not.toHaveBeenCalled();
    });

    it('uses map.rotation as the rotate argument when set', async () => {
      util.fromQueryString.mockReturnValue({ v: '0,0,10,10' });
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: { extent: [0, 0, 10, 10], rotation: 1.5 },
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(fly).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        1.5,
      );
    });
  });

  // ── actionSwitch — UPDATE_GRANULE_LAYER_OPTIONS ───────────────────────────

  describe('actionSwitch — UPDATE_GRANULE_LAYER_OPTIONS', () => {
    it('calls reloadLayers (loadLayersWithSlots) with granule options', async () => {
      getLayers.mockReturnValue([{ id: 'granule-1' }]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_GRANULE_LAYER_OPTIONS, id: 'granule-1' },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });
  });

  // ── actionSwitch — RESET_GRANULE_LAYER_OPTIONS ────────────────────────────

  describe('actionSwitch — RESET_GRANULE_LAYER_OPTIONS', () => {
    it('calls reloadLayers with reset granule options', async () => {
      getLayers.mockReturnValue([{ id: 'granule-1' }]);
      const props = buildProps({
        action: { type: layerConstants.RESET_GRANULE_LAYER_OPTIONS, id: 'granule-1' },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });
  });

  // ── actionSwitch — compareConstants.CHANGE_STATE ─────────────────────────

  describe('actionSwitch — CHANGE_STATE (compare)', () => {
    it('calls reloadLayers when compareMode is spy', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({
        action: { type: compareConstants.CHANGE_STATE },
        compareMode: 'spy',
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('does NOT call reloadLayers when compareMode is not spy', async () => {
      const props = buildProps({
        action: { type: compareConstants.CHANGE_STATE },
        compareMode: 'swipe',
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });
  });

  // ── actionSwitch — REORDER / TOGGLE_ON_OFF / CHANGE_MODE ─────────────────

  describe('actionSwitch — REORDER_LAYERS / REORDER_OVERLAY_GROUPS / TOGGLE_ON_OFF / CHANGE_MODE', () => {
    [
      layerConstants.REORDER_LAYERS,
      layerConstants.REORDER_OVERLAY_GROUPS,
      compareConstants.TOGGLE_ON_OFF,
      compareConstants.CHANGE_MODE,
    ].forEach((type) => {
      it(`calls reloadLayers AND preloadForCompareMode for ${type}`, async () => {
        getLayers.mockReturnValue([{ id: 'layer-1' }]);
        const props = buildProps({ action: { type } });
        renderComponent(props);
        await act(async () => { await flushPromises(); });
        expect(loadLayersWithSlots).toHaveBeenCalled();
        expect(props.preloadForCompareMode).toHaveBeenCalled();
      });
    });
  });

  // ── actionSwitch — TOGGLE_OVERLAY_GROUPS ─────────────────────────────────

  describe('actionSwitch — TOGGLE_OVERLAY_GROUPS', () => {
    it('calls reloadLayers', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });
  });

  // ── actionSwitch — palette / event actions (setTimeout 100 ms) ────────────

  describe('actionSwitch — palette and layer-event actions (setTimeout 100 ms)', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    [
      paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH,
      paletteConstants.SET_CUSTOM,
      paletteConstants.SET_DISABLED_CLASSIFICATION,
      paletteConstants.CLEAR_CUSTOM,
      layerConstants.ADD_LAYERS_FOR_EVENT,
    ].forEach((type) => {
      it(`does not fire immediately, fires after 100 ms for ${type}`, async () => {
        getLayers.mockReturnValue([{ id: 'layer-1' }]);
        const props = buildProps({ action: { type } });
        renderComponent(props);
        expect(loadLayersWithSlots).not.toHaveBeenCalled();
        jest.advanceTimersByTime(100);
        await act(async () => { await flushPromises(); });
        expect(loadLayersWithSlots).toHaveBeenCalled();
      });
    });
  });

  // ── actionSwitch — vector-style / screen-info actions (onResize) ──────────

  describe('actionSwitch — vector style and screen-info actions (onResize)', () => {
    [
      vectorStyleConstants.SET_FILTER_RANGE,
      vectorStyleConstants.SET_VECTORSTYLE,
      vectorStyleConstants.CLEAR_VECTORSTYLE,
      SET_SCREEN_INFO,
    ].forEach((type) => {
      it(`calls addControl on non-mobile for ${type}`, () => {
        const props = buildProps({ action: { type }, isMobile: false });
        renderComponent(props);
        expect(props.ui.selected.addControl).toHaveBeenCalled();
      });

      it(`calls removeControl on mobile for ${type}`, () => {
        const props = buildProps({ action: { type }, isMobile: true });
        renderComponent(props);
        expect(props.ui.selected.removeControl).toHaveBeenCalled();
      });
    });
  });

  // ── reloadLayers — non-compare mode ──────────────────────────────────────

  describe('reloadLayers — non-compare mode', () => {
    it('destroys compareMapUi when it was active but compare is now inactive', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: false, activeString: 'active', isCompareA: true, mode: 'swipe',
        },
        compareMapUi: { active: true, destroy: jest.fn(), create: jest.fn() },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.destroy).toHaveBeenCalled();
    });

    it('does NOT destroy compareMapUi when it is already inactive', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compareMapUi: { active: false, destroy: jest.fn(), create: jest.fn() },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.destroy).not.toHaveBeenCalled();
    });

    it('clears the cache when saveCache is falsy (TOGGLE_OVERLAY_GROUPS)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.ui.cache.clear).toHaveBeenCalled();
    });

    it('calls setLayers([]) on ui.selected (clearLayers)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.ui.selected.setLayers).toHaveBeenCalledWith([]);
    });

    it('passes updateLayerVisibilities into loadLayersWithSlots', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      const callArgs = loadLayersWithSlots.mock.calls[0][0];
      expect(callArgs.updateLayerVisibilities).toBe(props.updateLayerVisibilities);
    });

    it('passes TEMPO tempoCallback when layer id includes TEMPO', async () => {
      getLayers.mockReturnValue([{ id: 'TEMPO_NO2_Vertical-Column_Daily_v03' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      const callArgs = loadLayersWithSlots.mock.calls[0][0];
      const options = callArgs.getLayerOptions({ id: 'TEMPO_NO2_Vertical-Column_Daily_v03' });
      expect(options.tempoCallback).toBe(props.addTEMPODateRanges);
    });

    it('does NOT attach tempoCallback for non-TEMPO layers', async () => {
      getLayers.mockReturnValue([{ id: 'regular-layer' }]);
      const props = buildProps({ action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS } });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      const callArgs = loadLayersWithSlots.mock.calls[0][0];
      const options = callArgs.getLayerOptions({ id: 'regular-layer' });
      expect(options.tempoCallback).toBeUndefined();
    });

    it('passes the layerCreationQueue when saveCache is false (TOGGLE_OVERLAY_GROUPS)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const queue = { push: jest.fn() };
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        layerCreationQueue: queue,
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      const callArgs = loadLayersWithSlots.mock.calls[0][0];
      expect(callArgs.queue).toBe(queue);
    });

    it('passes queue as null when called from updateProjection with start=true (saveCache=false → queue used; saveCache=true → null)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const queue = { push: jest.fn() };
      const initialLayers = [{ id: 'layer-1', type: 'tile' }];
      const props = buildProps({
        activeLayers: initialLayers,
        action: { type: 'UNKNOWN' },
        layerCreationQueue: queue,
      });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      const updatedLayers = [
        { id: 'layer-1', type: 'tile' },
        { id: 'layer-2', type: 'tile' },
      ];
      rerender(<UpdateProjection {...props} activeLayers={updatedLayers} />);
      await act(async () => { await flushPromises(); });
      const callArgs = loadLayersWithSlots.mock.calls[0][0];
      expect(callArgs.queue).toBeNull();
    });
  });

  // ── reloadLayers — compare mode ───────────────────────────────────────────

  describe('reloadLayers — compare mode', () => {
    it('calls compareMapUi.create when compare is active', async () => {
      getActiveLayers.mockReturnValue([]);
      getLayers.mockReturnValue([]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: true, activeString: 'active', isCompareA: true, mode: 'swipe',
        },
        config: { features: { compare: true } },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.create).toHaveBeenCalled();
    });

    it('reverses stateArray when compare is not A and mode is spy', async () => {
      getActiveLayers.mockReturnValue([]);
      getLayers.mockReturnValue([]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: true, activeString: 'activeB', isCompareA: false, mode: 'spy',
        },
        config: { features: { compare: true } },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.create).toHaveBeenCalled();
    });

    it('calls requestPalette for compare-group layers that have a palette', async () => {
      getActiveLayers.mockReturnValue([]);
      getLayers.mockReturnValue([{ id: 'pal-layer', palette: true }]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: true, activeString: 'active', isCompareA: true, mode: 'swipe',
        },
        config: { features: { compare: true } },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.requestPalette).toHaveBeenCalledWith('pal-layer');
    });

    it('attaches tempoCallback for TEMPO layers in compare mode', async () => {
      getActiveLayers.mockReturnValue([]);
      getLayers.mockReturnValue([{ id: 'TEMPO_NO2_Daily_v03' }]);
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: true, activeString: 'active', isCompareA: true, mode: 'swipe',
        },
        config: { features: { compare: true } },
      });
      renderComponent(props);
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.create).toHaveBeenCalled();
    });

    it('chains onto an in-flight processingPromise in compare mode', async () => {
      getActiveLayers.mockReturnValue([]);
      getLayers.mockReturnValue([]);
      let resolvePrev;
      const prevPromise = new Promise((resolve) => { resolvePrev = resolve; });
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUPS },
        compare: {
          active: true, activeString: 'active', isCompareA: true, mode: 'swipe',
        },
        config: { features: { compare: true } },
      });
      props.ui.processingPromise = prevPromise;
      renderComponent(props);
      expect(props.compareMapUi.create).not.toHaveBeenCalled();
      resolvePrev();
      await act(async () => { await flushPromises(); });
      expect(props.compareMapUi.create).toHaveBeenCalled();
    });
  });

  // ── updateProjection — projectionTrigger === 0 (no-op) ───────────────────

  describe('projectionTrigger — no-op when 0', () => {
    it('does not call updateMapUI when projectionTrigger is 0', () => {
      const props = buildProps({ projectionTrigger: 0 });
      renderComponent(props);
      expect(props.updateMapUI).not.toHaveBeenCalled();
    });
  });

  // ── updateProjection — with start=true (projectionTrigger === 1) ──────────

  describe('updateProjection — start=true (projectionTrigger === 1)', () => {
    it('sets ui.selected from ui.proj[proj.id]', () => {
      const props = buildProps({ projectionTrigger: 1 });
      renderComponent(props);
      expect(props.ui.selected).toBe(props.ui.proj.geographic);
    });

    it('calls updateMapUI with the ui object', () => {
      const props = buildProps({ projectionTrigger: 1 });
      renderComponent(props);
      expect(props.updateMapUI).toHaveBeenCalledWith(props.ui, expect.any(Number));
    });

    it('calls mapObj.updateSize()', () => {
      const props = buildProps({ projectionTrigger: 1 });
      renderComponent(props);
      expect(props.ui.selected.updateSize).toHaveBeenCalled();
    });

    it('calls updateExtent and onResize (addControl) after projection update', () => {
      const props = buildProps({ projectionTrigger: 1 });
      renderComponent(props);
      expect(props.updateExtent).toHaveBeenCalled();
      expect(props.ui.selected.addControl).toHaveBeenCalled();
    });

    it('fits to models.map.extent when it is set', () => {
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: { extent: [0, 0, 10, 10] } },
      });
      renderComponent(props);
      expect(props.ui.selected.getView().fit).toHaveBeenCalledWith(
        [0, 0, 10, 10],
        expect.objectContaining({ constrainResolution: false }),
      );
    });

    it('uses getLeadingExtent for geographic projection when no models.map.extent', () => {
      getLeadingExtent.mockReturnValue([0, 0, 20, 20]);
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: {} },
        proj: { id: 'geographic', selected: { id: 'geographic' } },
      });
      renderComponent(props);
      expect(props.ui.selected.getView().fit).toHaveBeenCalled();
    });

    it('calls fitToLeadingExtent callback after fit for geographic projection', () => {
      getLeadingExtent.mockReturnValue([0, 0, 20, 20]);
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: {} },
        proj: { id: 'geographic', selected: { id: 'geographic' } },
      });
      renderComponent(props);
      const fitCall = props.ui.selected.getView().fit.mock.calls[0][1];
      fitCall.callback();
      expect(props.fitToLeadingExtent).toHaveBeenCalled();
    });

    it('calls setRotation callback for non-geographic projection when extent exists', () => {
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: { extent: [0, 0, 10, 10], rotation: 0.5 } },
        proj: { id: 'arctic', selected: { id: 'arctic' } },
      });
      renderComponent(props);
      const arcticMap = props.ui.proj.arctic;
      const fitCall = arcticMap.getView().fit.mock.calls[0][1];
      fitCall.callback();
      expect(arcticMap.getView().setRotation).toHaveBeenCalledWith(0.5);
    });

    it('calls setRotation directly (no fit) for non-geographic when no extent but rotation exists', () => {
      getLeadingExtent.mockReturnValue(null);
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: { rotation: 0.5 } },
        proj: { id: 'arctic', selected: { id: 'arctic' } },
      });
      renderComponent(props);
      expect(props.ui.proj.arctic.getView().setRotation).toHaveBeenCalledWith(0.5);
    });

    it('does NOT call setRotation for geographic projection', () => {
      getLeadingExtent.mockReturnValue(null);
      const props = buildProps({
        projectionTrigger: 1,
        models: { map: { rotation: 0.5 } },
        proj: { id: 'geographic', selected: { id: 'geographic' } },
      });
      renderComponent(props);
      expect(props.ui.selected.getView().setRotation).not.toHaveBeenCalled();
    });

    it('restores previousCenter on the map when it is set', () => {
      const props = buildProps({ projectionTrigger: 1 });
      props.ui.proj.geographic.center = [10, 20];
      renderComponent(props);
      expect(props.ui.selected.setCenter).toHaveBeenCalledWith([10, 20]);
    });

    it('hides the OLD map element before switching (hideMap)', () => {
      const oldEl = document.createElement('div');
      oldEl.id = 'map-geographic';
      document.body.appendChild(oldEl);

      const newEl = document.createElement('div');
      newEl.id = 'map-arctic';
      document.body.appendChild(newEl);

      const props = buildProps({
        projectionTrigger: 1,
        proj: { id: 'arctic', selected: { id: 'arctic' } },
      });

      renderComponent(props);

      expect(oldEl.style.display).toBe('none');

      document.body.removeChild(oldEl);
      document.body.removeChild(newEl);
    });

    it('shows the NEW map element after switching (showMap)', () => {
      const oldEl = document.createElement('div');
      oldEl.id = 'map-geographic';
      document.body.appendChild(oldEl);

      const newEl = document.createElement('div');
      newEl.id = 'map-arctic';
      newEl.style.display = 'none';
      document.body.appendChild(newEl);

      const props = buildProps({
        projectionTrigger: 1,
        proj: { id: 'arctic', selected: { id: 'arctic' } },
      });

      renderComponent(props);

      expect(newEl.style.display).toBe('block');

      document.body.removeChild(oldEl);
      document.body.removeChild(newEl);
    });
  });

  // ── updateProjection — without start (projectionTrigger > 1) ─────────────

  describe('updateProjection — start=false (projectionTrigger > 1)', () => {
    it('calls updateExtent and onResize but does NOT call fit', () => {
      const props = buildProps({ projectionTrigger: 2 });
      renderComponent(props);
      expect(props.updateExtent).toHaveBeenCalled();
      expect(props.ui.selected.getView().fit).not.toHaveBeenCalled();
    });

    it('uses current view rotation (not models.map.rotation) when start is false', () => {
      const props = buildProps({
        projectionTrigger: 2,
        proj: { id: 'arctic', selected: { id: 'arctic' } },
        models: { map: { rotation: 99 } },
      });
      props.ui.proj.arctic.getView().getRotation.mockReturnValue(0.3);
      renderComponent(props);
      expect(props.updateMapUI).toHaveBeenCalledWith(props.ui, 0.3);
    });
  });

  // ── renderedPalettes useEffect ────────────────────────────────────────────

  describe('renderedPalettes useEffect', () => {
    it('does NOT reload when palette count stays the same', async () => {
      const props = buildProps({
        renderedPalettes: { palette1: {} },
        action: { type: 'UNKNOWN' },
      });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      rerender(<UpdateProjection {...props} renderedPalettes={{ palette1: { updated: true } }} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });

    it('reloads when a new palette is added', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const props = buildProps({
        renderedPalettes: {},
        action: { type: 'UNKNOWN' },
      });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      rerender(<UpdateProjection {...props} renderedPalettes={{ palette1: {} }} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('skips reload when ui.selected is falsy', async () => {
      const props = buildProps({
        renderedPalettes: {},
        action: { type: 'UNKNOWN' },
      });
      props.ui.selected = null;
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      rerender(<UpdateProjection {...props} renderedPalettes={{ palette1: {} }} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });
  });

  // ── activeLayers useEffect ────────────────────────────────────────────────

  describe('activeLayers useEffect', () => {
    it('reloads when a new layer is added (length change)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }, { id: 'layer-2' }]);
      const initialLayers = [{ id: 'layer-1', type: 'tile' }];
      const props = buildProps({ activeLayers: initialLayers, action: { type: 'UNKNOWN' } });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      const updatedLayers = [
        { id: 'layer-1', type: 'tile' },
        { id: 'layer-2', type: 'tile' },
      ];
      rerender(<UpdateProjection {...props} activeLayers={updatedLayers} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('does NOT reload when layer count is unchanged and no new L2 date ranges', async () => {
      const layers = [{ id: 'layer-1', type: 'tile' }];
      const props = buildProps({ activeLayers: layers, action: { type: 'UNKNOWN' } });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      rerender(<UpdateProjection {...props} activeLayers={[...layers]} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });

    it('reloads when an L2 layer gains new date ranges (and prev was undefined)', async () => {
      getLayers.mockReturnValue([{ id: 'L2-layer' }]);
      const initialLayers = [{ id: 'L2-layer', granuleDateRanges: undefined }];
      const props = buildProps({ activeLayers: initialLayers, action: { type: 'UNKNOWN' } });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      const updatedLayers = [{ id: 'L2-layer', granuleDateRanges: ['2023-01-01'] }];
      rerender(<UpdateProjection {...props} activeLayers={updatedLayers} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).toHaveBeenCalled();
    });

    it('skips reload when ui.selected is falsy', async () => {
      const props = buildProps({ activeLayers: [], action: { type: 'UNKNOWN' } });
      props.ui.selected = null;
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      rerender(<UpdateProjection {...props} activeLayers={[{ id: 'new-layer', type: 'tile' }]} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });

    it('skips reload on A↔B tab switch (activeString change while compare is active)', async () => {
      getLayers.mockReturnValue([{ id: 'layer-1' }]);
      const initialLayers = [{ id: 'layer-1', type: 'tile' }];
      const compare = {
        active: true, activeString: 'active', isCompareA: true, mode: 'swipe',
      };
      const props = buildProps({
        activeLayers: initialLayers,
        compare,
        action: { type: 'UNKNOWN' },
      });
      const { rerender } = renderComponent(props);
      await act(async () => { await flushPromises(); });
      jest.clearAllMocks();
      loadLayersWithSlots.mockResolvedValue(undefined);
      const updatedCompare = { ...compare, activeString: 'activeB' };
      rerender(<UpdateProjection {...props} compare={updatedCompare} />);
      await act(async () => { await flushPromises(); });
      expect(loadLayersWithSlots).not.toHaveBeenCalled();
    });
  });

  // ── flyToNewExtent ────────────────────────────────────────────────────────

  describe('flyToNewExtent (via LOCATION_POP_ACTION)', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('computes the midpoint coordinate correctly and calls fly', async () => {
      util.fromQueryString.mockReturnValue({ v: '0,0,10,10' });
      const props = buildProps({
        action: { type: LOCATION_POP_ACTION, payload: { search: '' } },
        map: { extent: [0, 0, 10, 10] },
      });
      renderComponent(props);
      jest.advanceTimersByTime(200);
      await act(async () => { await flushPromises(); });
      expect(fly).toHaveBeenCalledWith(
        expect.anything(),
        props.proj,
        [5, 5],
        props.isKioskModeActive,
        expect.any(Number),
        0,
      );
    });
  });
});
