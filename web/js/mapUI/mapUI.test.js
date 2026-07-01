/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { getActiveLayers, isRenderable, getGranuleLayer } from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { getNextDateTime } from '../modules/date/util';
import { promiseImageryForTime } from '../modules/map/util';
import { updateVectorSelection } from '../modules/vector-styles/util';
import util from '../util/util';
import { REDUX_ACTION_DISPATCHED } from '../util/constants';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { CLEAR_ROTATE, REFRESH_ROTATE } from '../modules/map/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import * as dateConstants from '../modules/date/constants';
import * as layerConstants from '../modules/layers/constants';

let mockCaptured = {};

jest.mock('./components/layers/addLayer', () => (props) => { mockCaptured.AddLayer = props; return null; });
jest.mock('./components/layers/removeLayer', () => (props) => { mockCaptured.RemoveLayer = props; return null; });
jest.mock('./components/create-map/createMap', () => (props) => { mockCaptured.CreateMap = props; return null; });
jest.mock('./components/granule-hover/granuleHover', () => (props) => { mockCaptured.GranuleHover = props; return null; });
jest.mock('./components/markers/markers', () => (props) => { mockCaptured.Markers = props; return null; });
jest.mock('./components/update-date/updateDate', () => (props) => { mockCaptured.UpdateDate = props; return null; });
jest.mock('./components/update-opacity/updateOpacity', () => (props) => { mockCaptured.UpdateOpacity = props; return null; });
jest.mock('./components/update-projection/updateProjection', () => (props) => { mockCaptured.UpdateProjection = props; return null; });
jest.mock('./components/mouse-move-events/mouseMoveEvents', () => (props) => { mockCaptured.MouseMoveEvents = props; return null; });
jest.mock('./components/buffer-quick-animate/bufferQuickAnimate', () => (props) => { mockCaptured.BufferQuickAnimate = props; return null; });
jest.mock('./components/kiosk/kiosk-animations/kiosk-animations', () => (props) => { mockCaptured.KioskAnimations = props; return null; });
jest.mock('./components/kiosk/tile-measurement/tile-measurement', () => (props) => { mockCaptured.TileMeasurement = props; return null; });
jest.mock('./components/kiosk/travel-mode/travelMode', () => (props) => { mockCaptured.TravelMode = props; return null; });
jest.mock('./components/eic/eic', () => (props) => { mockCaptured.EIC = props; return null; });
jest.mock('./components/update-collections/updateCollections', () => (props) => { mockCaptured.UpdateCollections = props; return null; });
jest.mock('./components/dev-test-mode/dev-test-button', () => (props) => { mockCaptured.DevTestButton = props; return null; });

jest.mock('../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => []),
  isRenderable: jest.fn(() => true),
  getGranuleLayer: jest.fn(() => undefined),
}));
jest.mock('../modules/date/selectors', () => ({ getSelectedDate: jest.fn(() => new Date('2023-01-01')) }));
jest.mock('../modules/date/util', () => ({ getNextDateTime: jest.fn(() => new Date('2023-01-02')) }));
jest.mock('../modules/map/util', () => ({ promiseImageryForTime: jest.fn(() => Promise.resolve()) }));
jest.mock('../modules/vector-styles/util', () => ({ updateVectorSelection: jest.fn() }));
jest.mock('../modules/map/actions', () => ({ updateMapExtent: jest.fn(() => ({ type: 'UPDATE_MAP_EXTENT' })) }));
jest.mock('../modules/date/actions', () => ({
  clearPreload: jest.fn(() => ({ type: 'CLEAR_PRELOAD' })),
  setPreload: jest.fn(() => ({ type: 'SET_PRELOAD' })),
}));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    events: { on: jest.fn(), off: jest.fn(), trigger: jest.fn() },
    warn: jest.fn(),
  },
}));

const ConnectedMapUI = require('./mapUI').default;

const mockStore = configureMockStore();

const collection = (arr) => ({
  forEach: (fn) => arr.forEach(fn),
  getArray: () => arr,
});

const makeMap = (layers = [], isRendered = true) => {
  const view = { calculateExtent: jest.fn(() => [0, 0, 10, 10]), animate: jest.fn() };
  return {
    getView: () => view,
    getLayers: () => collection(layers),
    isRendered: () => isRendered,
  };
};

const buildState = (overrides = {}) => {
  const { date: dateOverrides, ui: uiOverrides, ...rest } = overrides;
  return {
    compare: { active: false, activeString: 'active' },
    config: {},
    date: {
      arrowDown: undefined,
      lastArrowDirection: undefined,
      lastPreloadDate: null,
      preloaded: false,
      selected: new Date('2023-01-01'),
      selectedB: new Date('2023-01-02'),
      ...dateOverrides,
    },
    embed: {},
    layers: {},
    map: {},
    palettes: {},
    proj: { id: 'geographic' },
    vectorStyles: {},
    ui: {
      eic: '', travelMode: '', displayStaticMap: false, ...uiOverrides,
    },
    ...rest,
  };
};

const buildOwnProps = (over = {}) => {
  const selected = over.selected || makeMap();
  const props = {
    compareMapUi: {},
    config: {},
    layerCreationQueue: { add: jest.fn() },
    layerQueue: { add: jest.fn() },
    models: {},
    setUI: jest.fn(),
    ui: { selected, selectedVectors: {}, dislayStaticMap: false },
    ...over,
  };
  delete props.selected;
  return props;
};

const renderComponent = (ownProps = {}, state) => {
  const store = mockStore(state || buildState());
  const props = buildOwnProps(ownProps);
  const result = render(
    <Provider store={store}>
      <ConnectedMapUI {...props} />
    </Provider>,
  );
  return { store, props, ...result };
};

const getSubscriber = () => {
  const call = util.events.on.mock.calls.find((c) => c[0] === REDUX_ACTION_DISPATCHED);
  return call && call[1];
};

const child = (key) => mockCaptured[key];

beforeEach(() => {
  jest.clearAllMocks();
  mockCaptured = {};
  getActiveLayers.mockReturnValue([]);
  isRenderable.mockReturnValue(true);
  getGranuleLayer.mockReturnValue(undefined);
  getSelectedDate.mockReturnValue(new Date('2023-01-01'));
  getNextDateTime.mockReturnValue(new Date('2023-01-02'));
  promiseImageryForTime.mockResolvedValue();
});

describe('MapUI rendering', () => {
  it('mounts without errors and renders child components', () => {
    renderComponent();
    expect(child('CreateMap')).toBeDefined();
    expect(child('UpdateProjection')).toBeDefined();
    expect(child('Markers')).toBeDefined();
  });

  it('derives state props from the store (mapStateToProps)', () => {
    renderComponent();
    expect(child('UpdateProjection').ui).toBeDefined();
    expect(child('CreateMap').config).toBeDefined();
  });

  it('renders EIC / kiosk children when EIC mode is active', () => {
    const state = buildState({
      ui: { eic: 'on', travelMode: 'on', displayStaticMap: false },
    });
    renderComponent({}, state);
    expect(child('EIC')).toBeDefined();
    expect(child('KioskAnimations')).toBeDefined();
    expect(child('TileMeasurement')).toBeDefined();
    expect(child('TravelMode')).toBeDefined();
  });

  it('runs mapStateToProps for varied store state without throwing', () => {
    const state = buildState({
      ui: { eic: 'on', travelMode: 'on', displayStaticMap: true },
      compare: { active: true, activeString: 'activeB' },
      date: {
        arrowDown: 'left',
        lastArrowDirection: 'left',
        lastPreloadDate: new Date('2023-01-01'),
        preloaded: true,
      },
    });
    expect(() => renderComponent({}, state)).not.toThrow();
  });

  it('registers and removes the REDUX_ACTION_DISPATCHED listener', () => {
    const { unmount } = renderComponent();
    expect(util.events.on).toHaveBeenCalledWith(REDUX_ACTION_DISPATCHED, expect.any(Function));
    unmount();
    expect(util.events.off).toHaveBeenCalledWith(REDUX_ACTION_DISPATCHED, expect.any(Function));
  });

  it('dispatches updateMapExtent + clearPreload through mapDispatchToProps', () => {
    const { store } = renderComponent();
    act(() => { child('CreateMap').updateExtent(); });
    expect(store.getActions()).toContainEqual({ type: 'UPDATE_MAP_EXTENT' });
    expect(store.getActions()).toContainEqual({ type: 'CLEAR_PRELOAD' });
  });
});

describe('subscribeToStore', () => {
  it('handles CHANGE_PROJECTION and a variety of action types without throwing', () => {
    renderComponent();
    const subscriber = getSubscriber();
    [
      CHANGE_PROJECTION,
      layerConstants.ADD_LAYER,
      layerConstants.REMOVE_LAYER,
      dateConstants.SELECT_DATE,
      layerConstants.UPDATE_OPACITY,
      'UNKNOWN_ACTION_TYPE',
    ].forEach((type) => {
      act(() => { subscriber({ type }); });
    });
    expect(getSubscriber()).toBeDefined();
  });

  it('animates the view back to 0 on CLEAR_ROTATE', () => {
    const selected = makeMap();
    renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { getSubscriber()({ type: CLEAR_ROTATE }); });
    expect(selected.getView().animate).toHaveBeenCalledWith({ duration: 500, rotation: 0 });
  });

  it('animates to the requested rotation on REFRESH_ROTATE', () => {
    const selected = makeMap();
    renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { getSubscriber()({ type: REFRESH_ROTATE, rotation: 1.2 }); });
    expect(selected.getView().animate).toHaveBeenCalledWith({ rotation: 1.2, duration: 500 });
  });

  it('runs updateVectorSelections on SET_SELECTED_VECTORS', () => {
    const { props } = renderComponent();
    act(() => {
      getSubscriber()({
        type: vectorStyleConstants.SET_SELECTED_VECTORS,
        payload: { layerA: true },
      });
    });
    expect(updateVectorSelection).toHaveBeenCalled();
    expect(props.ui.selectedVectors).toEqual({ layerA: true });
  });

  it('preloads tiles on CHANGE_INTERVAL', () => {
    const { props } = renderComponent();
    act(() => { getSubscriber()({ type: dateConstants.CHANGE_INTERVAL }); });
    expect(props.layerQueue.add).toHaveBeenCalled();
  });

  it('handles ARROW_DOWN', () => {
    renderComponent();
    expect(() => act(() => { getSubscriber()({ type: dateConstants.ARROW_DOWN }); })).not.toThrow();
  });
});

describe('updateExtent', () => {
  it('updates the map extent and clears preload when the map is rendered', () => {
    const selected = makeMap([], true);
    const { store } = renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { child('CreateMap').updateExtent(); });
    expect(store.getActions()).toContainEqual({ type: 'UPDATE_MAP_EXTENT' });
    expect(store.getActions()).toContainEqual({ type: 'CLEAR_PRELOAD' });
  });

  it('does not clear preload when the map is not rendered', () => {
    const selected = makeMap([], false);
    const { store } = renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { child('CreateMap').updateExtent(); });
    expect(store.getActions()).toContainEqual({ type: 'UPDATE_MAP_EXTENT' });
    expect(store.getActions()).not.toContainEqual({ type: 'CLEAR_PRELOAD' });
  });
});

describe('updateLayerVisibilities', () => {
  it('returns early when no map is selected', () => {
    renderComponent({ ui: { selected: null, selectedVectors: {} } });
    expect(() => act(() => { child('RemoveLayer').updateLayerVisibilities(); })).not.toThrow();
  });

  it('sets visibility for a plain (non-compare, non-granule) layer', () => {
    const layer = {
      wv: { id: 'l1', group: 'active' },
      get: (k) => ({ date: undefined, granuleGroup: undefined, group: undefined }[k]),
      setVisible: jest.fn(),
      getLayers: () => collection([]),
    };
    const selected = makeMap([layer]);
    renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { child('RemoveLayer').updateLayerVisibilities(); });
    expect(layer.setVisible).toHaveBeenCalledWith(true);
  });

  it('handles compare-group layers with granule subgroups', () => {
    isRenderable.mockReturnValue(false);
    const granuleTile = {
      wv: { id: 'g-tile', group: 'active' },
      get: () => undefined,
      setVisible: jest.fn(),
      getLayers: () => collection([]),
    };
    const granuleSubLayer = {
      wv: { id: 'g-sub', group: 'active' },
      get: (k) => (k === 'granuleGroup' ? true : undefined),
      setVisible: jest.fn(),
      getLayers: () => collection([granuleTile]),
    };
    const noWvSubLayer = {
      wv: null,
      get: () => undefined,
      setVisible: jest.fn(),
      getLayers: () => collection([]),
    };
    const groupLayer = {
      wv: null,
      get: (k) => (k === 'group' ? 'active' : undefined),
      setVisible: jest.fn(),
      getLayers: () => collection([noWvSubLayer, granuleSubLayer]),
    };
    const selected = makeMap([groupLayer]);
    renderComponent({ ui: { selected, selectedVectors: {} } });
    act(() => { child('RemoveLayer').updateLayerVisibilities(); });
    expect(groupLayer.setVisible).toHaveBeenCalledWith(true);
    expect(granuleSubLayer.setVisible).toHaveBeenCalledWith(true);
    expect(granuleTile.setVisible).toHaveBeenCalled();
  });
});

describe('findLayer', () => {
  it('finds a top-level layer by wv id', () => {
    const layer = { wv: { id: 'l1' }, get: () => undefined };
    const selected = { ...makeMap(), getLayers: () => collection([layer]) };
    renderComponent({ ui: { selected, selectedVectors: {} } });
    const found = child('RemoveLayer').findLayer({ id: 'l1' }, 'active');
    expect(found).toBe(layer);
  });

  it('descends into a compare group to find the layer', () => {
    const innerLayer = { wv: { id: 'l2' }, get: () => undefined };
    const groupLayer = {
      wv: null,
      get: (k) => (k === 'group' ? 'active' : undefined),
      getLayers: () => collection([innerLayer]),
    };
    const selected = { ...makeMap(), getLayers: () => collection([groupLayer]) };
    renderComponent({ ui: { selected, selectedVectors: {} } });
    const found = child('RemoveLayer').findLayer({ id: 'l2' }, 'active');
    expect(found).toBe(innerLayer);
  });
});

describe('getGranuleOptions', () => {
  it('returns an empty object for non-granule layers', () => {
    renderComponent();
    const result = child('UpdateProjection').getGranuleOptions({}, { id: 'l1', type: 'wmts' }, 'active');
    expect(result).toEqual({});
  });

  it('returns granule state when available', () => {
    getGranuleLayer.mockReturnValue({ dates: ['2023-01-01'], count: 20, geometry: { g: 1 } });
    renderComponent();
    const result = child('UpdateProjection').getGranuleOptions(
      {},
      { id: 'gran', count: 10, type: 'granule' },
      'active',
    );
    expect(result).toEqual({
      granuleDates: ['2023-01-01'],
      granuleCount: 20,
      geometry: { g: 1 },
    });
  });

  it('falls back to the def count and resets dates when reset matches', () => {
    getGranuleLayer.mockReturnValue({ dates: ['2023-01-01'], count: undefined, geometry: undefined });
    renderComponent();
    const result = child('UpdateProjection').getGranuleOptions(
      {},
      { id: 'gran', count: 10, type: 'granule' },
      'active',
      { reset: 'gran' },
    );
    expect(result.granuleDates).toBe(false);
    expect(result.granuleCount).toBe(10);
  });

  it('returns undefined granule fields when there is no granule state', () => {
    getGranuleLayer.mockReturnValue(undefined);
    renderComponent();
    const result = child('UpdateProjection').getGranuleOptions(
      {},
      { id: 'gran', count: 7, type: 'granule' },
      'active',
    );
    expect(result.granuleCount).toBe(7);
    expect(result.granuleDates).toBeUndefined();
  });
});

describe('preloadNextTiles', () => {
  it('does nothing when the static map is displayed', async () => {
    const { props } = renderComponent({
      ui: { selected: makeMap(), selectedVectors: {}, dislayStaticMap: true },
    });
    await act(async () => { await child('AddLayer').preloadNextTiles(); });
    expect(props.layerQueue.add).not.toHaveBeenCalled();
  });

  it('queues imagery for the next and previous dates', async () => {
    const { props } = renderComponent();
    await act(async () => { await child('AddLayer').preloadNextTiles(); });
    expect(props.layerQueue.add).toHaveBeenCalled();
  });

  it('dispatches setPreload and queues one date when preloaded with an arrow direction', async () => {
    const state = buildState({ date: { preloaded: true, lastArrowDirection: 'right' } });
    const { props, store } = renderComponent({}, state);
    await act(async () => { await child('AddLayer').preloadNextTiles(); });
    expect(store.getActions()).toContainEqual({ type: 'SET_PRELOAD' });
    expect(props.layerQueue.add).toHaveBeenCalledTimes(1);
  });
});

describe('preloadForCompareMode', () => {
  it('preloads only the active side when compare is inactive', async () => {
    const { props } = renderComponent();
    await act(async () => { await child('CreateMap').preloadForCompareMode(); });
    expect(props.layerQueue.add).toHaveBeenCalled();
  });

  it('preloads both sides when compare is active', async () => {
    const state = buildState({ compare: { active: true, activeString: 'active' } });
    const { props } = renderComponent({}, state);
    await act(async () => { await child('CreateMap').preloadForCompareMode(); });
    expect(props.layerQueue.add).toHaveBeenCalled();
  });
});
