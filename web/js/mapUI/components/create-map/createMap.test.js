/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedCreateMap from './createMap';
import { saveRotation } from '../../../map/util';
import { granuleFootprint } from '../../../map/granule/util';
import {
  MAP_DISABLE_CLICK_ZOOM,
  MAP_ENABLE_CLICK_ZOOM,
  MAP_DRAG,
  MAP_MOVE_START,
  MAP_ZOOMING,
} from '../../../util/constants';
import { MAP_LOADING } from '../../../modules/loading/actions';

// ─── Mock Dependencies ────────────────────────────────────────────────────────

const eventHandlers = {};

jest.mock('../../../util/util', () => ({
  __esModule: true,
  default: {
    events: {
      trigger: jest.fn(),
      on: jest.fn(),
    },
  },
}));

// Re-import util AFTER the mock so we can reference the mock's functions directly
import util from '../../../util/util';

jest.mock('../../../map/util', () => ({
  saveRotation: jest.fn(),
}));

jest.mock('../../../map/granule/util', () => ({
  granuleFootprint: jest.fn(() => ({ mockFootprint: true })),
}));

jest.mock('../../../modules/map/actions', () => ({
  refreshRotation: jest.fn((r) => ({ type: 'REFRESH_ROTATION', rotation: r })),
  updateRenderedState: jest.fn(() => ({ type: 'UPDATE_RENDERED_STATE' })),
  updateMapUI: jest.fn((ui, r) => ({ type: 'UPDATE_MAP_UI', ui, rotation: r })),
}));

jest.mock('../../../modules/loading/actions', () => ({
  startLoading: jest.fn((key) => ({ type: 'START_LOADING', key })),
  stopLoading: jest.fn((key) => ({ type: 'STOP_LOADING', key })),
  MAP_LOADING: 'MAP_LOADING',
}));

jest.mock('ol/Map');
jest.mock('ol/View');
jest.mock('ol/Kinetic');
jest.mock('ol/control/ScaleLine');
jest.mock('ol/interaction/PinchRotate');
jest.mock('ol/interaction/DragRotate');
jest.mock('ol/interaction/DoubleClickZoom', () =>
  jest.fn().mockImplementation(() => ({ setActive: jest.fn() })),
);
jest.mock('ol/interaction/PinchZoom');
jest.mock('ol/interaction/DragPan');
jest.mock('ol/interaction/MouseWheelZoom');
jest.mock('ol/interaction/DragZoom');
jest.mock('ol/proj', () => ({ get: jest.fn((crs) => crs) }));
jest.mock('ol/events/condition', () => ({ altKeyOnly: jest.fn() }));

// ─── OlMap / OlView mock setup ────────────────────────────────────────────────

import OlMap from 'ol/Map';
import OlView from 'ol/View';

function buildMockView() {
  const viewListeners = {};
  const allViewListeners = {};

  return {
    on: jest.fn((event, cb) => {
      // Store the latest handler (used by most tests)
      viewListeners[event] = cb;
      // Also accumulate all handlers (used for change:resolution which is registered twice)
      if (!allViewListeners[event]) allViewListeners[event] = [];
      allViewListeners[event].push(cb);
    }),
    getRotation: jest.fn(() => 0),
    changed: jest.fn(),
    listeners: viewListeners,
    allListeners: allViewListeners,
  };
}

function buildMockMap(mockView) {
  const mapListeners = {};
  return {
    on: jest.fn((event, cb) => { mapListeners[event] = cb; }),
    un: jest.fn(),
    getView: jest.fn(() => mockView),
    addInteraction: jest.fn(),
    wv: {},
    proj: null,
    listeners: mapListeners,
  };
}

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

const mockGeographicProj = {
  id: 'geographic',
  crs: 'EPSG:4326',
  resolutions: [0.5625],
  startCenter: [0, 0],
  startZoom: 2,
  numZoomLevels: 8,
  maxExtent: [-180, -90, 180, 90],
};

const mockPolarProj = {
  id: 'arctic',
  crs: 'EPSG:3413',
  resolutions: [8192],
  startCenter: [0, 0],
  startZoom: 1,
  numZoomLevels: 6,
  maxExtent: [-4194304, -4194304, 4194304, 4194304],
};

const mockWebmercProj = {
  id: 'webmerc',
  crs: 'EPSG:3857',
  resolutions: [156543],
  startCenter: [0, 0],
  startZoom: 2,
  numZoomLevels: 10,
  maxExtent: [-20037508, -20037508, 20037508, 20037508],
};

function buildDefaultProps(projections = { geographic: mockGeographicProj }) {
  const mockView = buildMockView();
  const mockMap = buildMockMap(mockView);

  OlMap.mockImplementation(() => mockMap);
  OlView.mockImplementation(() => mockView);

  const mockSelectedMap = { getView: jest.fn(() => mockView) };

  const ui = {
    proj: {},
    selected: mockSelectedMap,
    mapIsbeingDragged: false,
    mapIsbeingZoomed: false,
  };

  return {
    mockMap,
    mockView,
    props: {
      config: {
        initialIsMobile: false,
        projections,
      },
      isMapSet: false,
      preloadForCompareMode: jest.fn(),
      setGranuleFootprints: jest.fn(),
      setMap: jest.fn(),
      setUI: jest.fn(),
      // These are overridden by mapDispatchToProps in the connected component,
      // so they will never be called directly — kept here only to satisfy propTypes
      startLoading: jest.fn(),
      stopLoading: jest.fn(),
      updateMapUI: jest.fn(),
      updateRenderedState: jest.fn(),
      updateRotation: jest.fn(),
      ui,
      updateExtent: jest.fn(),
    },
  };
}

const mockStore = configureMockStore();

function renderComponent(props) {
  const store = mockStore({});
  render(
    <Provider store={store}>
      <ConnectedCreateMap {...props} />
    </Provider>,
  );
  return { store };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Restore the events mock fns so the per-test `util.events.on` spy works
    util.events.trigger = jest.fn();
    util.events.on = jest.fn((event, cb) => {
      eventHandlers[event] = cb;
    });

    document.body.innerHTML = `
      <div id="wv-map">
        <div class="wv-map-scale-metric"></div>
        <div class="wv-map-scale-imperial"></div>
      </div>
    `;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { props } = buildDefaultProps();
      const { container } = render(
        <Provider store={mockStore({})}>
          <ConnectedCreateMap {...props} />
        </Provider>,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect / isMapSet guard ─────────────────────────────────────────────

  describe('useEffect / isMapSet guard', () => {
    it('calls setMap(true) on mount when isMapSet is false', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(props.setMap).toHaveBeenCalledWith(true);
    });

    it('does NOT call setMap when isMapSet is true', () => {
      const { props } = buildDefaultProps();
      props.isMapSet = true;
      renderComponent(props);
      expect(props.setMap).not.toHaveBeenCalled();
    });

    it('calls setUI with the updated uiCopy after map creation', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(props.setUI).toHaveBeenCalledWith(props.ui);
    });

    it('calls setGranuleFootprints after iterating over projections', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(props.setGranuleFootprints).toHaveBeenCalledTimes(1);
      expect(props.setGranuleFootprints).toHaveBeenCalledWith(
        expect.objectContaining({ [mockGeographicProj.crs]: expect.anything() }),
      );
    });

    it('creates a map for each projection in config', () => {
      const { props } = buildDefaultProps({
        geographic: mockGeographicProj,
        arctic: mockPolarProj,
      });
      renderComponent(props);
      expect(OlMap).toHaveBeenCalledTimes(2);
    });

    it('stores each created map on ui.proj keyed by projection id', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      expect(props.ui.proj[mockGeographicProj.id]).toBe(mockMap);
    });
  });

  // ── mapCreation: DOM element setup ────────────────────────────────────────

  describe('mapCreation: DOM element setup', () => {
    it('creates a map div with the correct id', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(document.getElementById(`wv-map-${mockGeographicProj.id}`)).not.toBeNull();
    });

    it('sets the data-proj attribute on the map element', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const el = document.getElementById(`wv-map-${mockGeographicProj.id}`);
      expect(el.getAttribute('data-proj')).toBe(mockGeographicProj.id);
    });

    it('adds the wv-map class to the map element', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const el = document.getElementById(`wv-map-${mockGeographicProj.id}`);
      expect(el.classList.contains('wv-map')).toBe(true);
    });

    it('sets display:none on the map element initially', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const el = document.getElementById(`wv-map-${mockGeographicProj.id}`);
      expect(el.style.display).toBe('none');
    });
  });

  // ── mapCreation: OlMap configuration ─────────────────────────────────────

  describe('mapCreation: OlMap configuration', () => {
    it('uses a fixed geographic extent [-250, -90, 250, 90] for the geographic projection', () => {
      const { props } = buildDefaultProps({ geographic: mockGeographicProj });
      renderComponent(props);
      const viewConfig = OlView.mock.calls[0][0];
      expect(viewConfig.extent).toEqual([-250, -90, 250, 90]);
    });

    it('uses proj.maxExtent for non-geographic projections', () => {
      const { props } = buildDefaultProps({ arctic: mockPolarProj });
      renderComponent(props);
      const viewConfig = OlView.mock.calls[0][0];
      expect(viewConfig.extent).toEqual(mockPolarProj.maxExtent);
    });

    it('uses proj.maxExtent for the webmerc projection', () => {
      const { props } = buildDefaultProps({ webmerc: mockWebmercProj });
      renderComponent(props);
      const viewConfig = OlView.mock.calls[0][0];
      expect(viewConfig.extent).toEqual(mockWebmercProj.maxExtent);
    });

    it('sets loadTilesWhileAnimating and loadTilesWhileInteracting to true', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const mapConfig = OlMap.mock.calls[0][0];
      expect(mapConfig.loadTilesWhileAnimating).toBe(true);
      expect(mapConfig.loadTilesWhileInteracting).toBe(true);
    });

    it('sets maxTilesLoading to 32', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const mapConfig = OlMap.mock.calls[0][0];
      expect(mapConfig.maxTilesLoading).toBe(32);
    });

    it('sets map.wv with scaleMetric and scaleImperial', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      expect(mockMap.wv).toHaveProperty('scaleMetric');
      expect(mockMap.wv).toHaveProperty('scaleImperial');
    });

    it('sets map.proj to the projection id', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      expect(mockMap.proj).toBe(mockGeographicProj.id);
    });
  });

  // ── mapCreation: rotation interactions ───────────────────────────────────

  describe('mapCreation: rotation interactions', () => {
    it('does NOT add rotation interactions for the geographic projection', () => {
      const { props, mockMap } = buildDefaultProps({ geographic: mockGeographicProj });
      renderComponent(props);
      expect(mockMap.addInteraction).not.toHaveBeenCalled();
    });

    it('does NOT add rotation interactions for the webmerc projection', () => {
      const { props, mockMap } = buildDefaultProps({ webmerc: mockWebmercProj });
      renderComponent(props);
      expect(mockMap.addInteraction).not.toHaveBeenCalled();
    });

    it('adds DragRotate and PinchRotate interactions for polar projections', () => {
      const { props, mockMap } = buildDefaultProps({ arctic: mockPolarProj });
      renderComponent(props);
      expect(mockMap.addInteraction).toHaveBeenCalledTimes(2);
    });
  });

  // ── mapCreation: granuleFootprint ─────────────────────────────────────────

  describe('mapCreation: granuleFootprint', () => {
    it('calls granuleFootprint with the map and initialIsMobile', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      expect(granuleFootprint).toHaveBeenCalledWith(mockMap, false);
    });

    it('passes initialIsMobile: true when config sets it', () => {
      const { props, mockMap } = buildDefaultProps();
      props.config.initialIsMobile = true;
      renderComponent(props);
      expect(granuleFootprint).toHaveBeenCalledWith(mockMap, true);
    });

    it('stores the granuleFootprint result keyed by proj.crs', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(props.setGranuleFootprints).toHaveBeenCalledWith(
        expect.objectContaining({
          [mockGeographicProj.crs]: { mockFootprint: true },
        }),
      );
    });
  });

  // ── Map event listeners ───────────────────────────────────────────────────

  describe('Map event listeners', () => {
    it('sets mapIsbeingDragged to true and triggers MAP_DRAG on pointerdrag', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      mockMap.listeners.pointerdrag();
      expect(props.ui.mapIsbeingDragged).toBe(true);
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_DRAG);
    });

    it('sets mapIsbeingZoomed to true and triggers MAP_ZOOMING on resolution propertychange', () => {
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.listeners.propertychange({ key: 'resolution' });
      expect(props.ui.mapIsbeingZoomed).toBe(true);
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_ZOOMING);
    });

    it('does nothing for non-resolution propertychange events', () => {
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.listeners.propertychange({ key: 'center' });
      expect(props.ui.mapIsbeingZoomed).toBe(false);
    });

    it('resets drag and zoom flags after moveend + timeout', () => {
      jest.useFakeTimers();
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      props.ui.mapIsbeingDragged = true;
      props.ui.mapIsbeingZoomed = true;
      mockMap.listeners.moveend({});
      jest.advanceTimersByTime(200);
      expect(props.ui.mapIsbeingDragged).toBe(false);
      expect(props.ui.mapIsbeingZoomed).toBe(false);
      jest.useRealTimers();
    });

    // startLoading/stopLoading are bound via mapDispatchToProps, so assert
    // via dispatched actions rather than prop spies
    it('dispatches startLoading(MAP_LOADING) on loadstart', () => {
      const { props, mockMap } = buildDefaultProps();
      const { store: renderedStore } = renderComponent(props);
      mockMap.listeners.loadstart();
      expect(renderedStore.getActions()).toContainEqual(
        expect.objectContaining({ type: 'START_LOADING', key: MAP_LOADING }),
      );
    });

    it('dispatches stopLoading(MAP_LOADING) on loadend', () => {
      const { props, mockMap } = buildDefaultProps();
      const { store } = renderComponent(props);
      mockMap.listeners.loadend();
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'STOP_LOADING', key: MAP_LOADING }),
      );
    });

    // change:resolution registers two listeners: MAP_MOVE_START trigger and
    // debouncedUpdateExtent. Use allListeners to capture and invoke both.
    it('triggers MAP_MOVE_START on view change:resolution', () => {
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.allListeners['change:resolution'].forEach((cb) => cb());
      expect(util.events.trigger).toHaveBeenCalledWith(MAP_MOVE_START);
    });

    it('calls debouncedUpdateExtent on view change:center', () => {
      jest.useFakeTimers();
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.listeners['change:center']();
      jest.advanceTimersByTime(300);
      expect(props.updateExtent).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('calls debouncedUpdateExtent on view change:resolution', () => {
      jest.useFakeTimers();
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.allListeners['change:resolution'].forEach((cb) => cb());
      jest.advanceTimersByTime(300);
      expect(props.updateExtent).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // ── rendercomplete handler ────────────────────────────────────────────────

  describe('rendercomplete handler', () => {
    // updateRenderedState/updateMapUI are bound via mapDispatchToProps, so assert
    // via dispatched actions rather than prop spies
    it('dispatches UPDATE_RENDERED_STATE on rendercomplete', () => {
      const { props, mockMap } = buildDefaultProps();
      const { store } = renderComponent(props);
      mockMap.listeners.rendercomplete();
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_RENDERED_STATE' }),
      );
    });

    it('dispatches UPDATE_MAP_UI with uiCopy and current rotation on rendercomplete', () => {
      const { props, mockMap, mockView } = buildDefaultProps();
      mockView.getRotation.mockReturnValue(1.5);
      const { store } = renderComponent(props);
      mockMap.listeners.rendercomplete();
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_MAP_UI', rotation: 1.5 }),
      );
    });

    it('schedules preloadForCompareMode via setTimeout on rendercomplete', () => {
      jest.useFakeTimers();
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      mockMap.listeners.rendercomplete();
      jest.advanceTimersByTime(250);
      expect(props.preloadForCompareMode).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it('unregisters the rendercomplete listener after it fires', () => {
      const { props, mockMap } = buildDefaultProps();
      renderComponent(props);
      mockMap.listeners.rendercomplete();
      expect(mockMap.un).toHaveBeenCalledWith('rendercomplete', expect.any(Function));
    });
  });

  // ── onRotate / view change:rotation ──────────────────────────────────────

  describe('onRotate handler', () => {
    // updateRotation is bound via mapDispatchToProps as refreshRotation, so assert
    // via dispatched actions rather than prop spies
    it('dispatches REFRESH_ROTATION with the current rotation in radians', () => {
      jest.useFakeTimers();
      const { props, mockView } = buildDefaultProps();
      mockView.getRotation.mockReturnValue(Math.PI);
      const { store } = renderComponent(props);
      mockView.listeners['change:rotation']();
      jest.advanceTimersByTime(300);
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'REFRESH_ROTATION', rotation: Math.PI }),
      );
      jest.useRealTimers();
    });

    it('calls saveRotation with converted degrees and the view', () => {
      jest.useFakeTimers();
      const { props, mockView } = buildDefaultProps();
      mockView.getRotation.mockReturnValue(Math.PI);
      renderComponent(props);
      mockView.listeners['change:rotation']();
      jest.advanceTimersByTime(300);
      expect(saveRotation).toHaveBeenCalledWith(
        Math.PI * (Math.PI / 180),
        mockView,
      );
      jest.useRealTimers();
    });

    it('calls updateExtent after rotation', () => {
      jest.useFakeTimers();
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      mockView.listeners['change:rotation']();
      jest.advanceTimersByTime(300);
      expect(props.updateExtent).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // ── util.events listeners ─────────────────────────────────────────────────

  describe('util.events listeners', () => {
    it('registers a MAP_DISABLE_CLICK_ZOOM handler', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(util.events.on).toHaveBeenCalledWith(
        MAP_DISABLE_CLICK_ZOOM,
        expect.any(Function),
      );
    });

    it('registers a MAP_ENABLE_CLICK_ZOOM handler', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      expect(util.events.on).toHaveBeenCalledWith(
        MAP_ENABLE_CLICK_ZOOM,
        expect.any(Function),
      );
    });
  });

  // ── window resize ─────────────────────────────────────────────────────────

  describe('window resize listener', () => {
    it('calls map.getView().changed() when window is resized', () => {
      const { props, mockView } = buildDefaultProps();
      renderComponent(props);
      window.dispatchEvent(new Event('resize'));
      expect(mockView.changed).toHaveBeenCalled();
    });
  });

  // ── scale bar mousemove ───────────────────────────────────────────────────

  describe('Scale bar mousemove suppression', () => {
    it('stops mousemove propagation on the metric scale bar', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const el = document.querySelector('.wv-map-scale-metric');
      const event = new MouseEvent('mousemove', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');
      el.dispatchEvent(event);
      expect(stopPropagation).toHaveBeenCalled();
    });

    it('stops mousemove propagation on the imperial scale bar', () => {
      const { props } = buildDefaultProps();
      renderComponent(props);
      const el = document.querySelector('.wv-map-scale-imperial');
      const event = new MouseEvent('mousemove', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');
      el.dispatchEvent(event);
      expect(stopPropagation).toHaveBeenCalled();
    });
  });
});
