/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedAddLayer from './addLayer';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../modules/layers/selectors', () => ({
  getLayers: jest.fn(() => []),
}));

jest.mock('../../../modules/layers/constants', () => ({
  ADD_LAYER: 'ADD_LAYER',
  UPDATE_DDV_LAYER: 'UPDATE_DDV_LAYER',
}));

jest.mock('../../../modules/date/actions', () => ({
  clearPreload: jest.fn(() => ({ type: 'CLEAR_PRELOAD' })),
}));

jest.mock('../../../modules/ui/constants', () => ({
  DISPLAY_STATIC_MAP: 'DISPLAY_STATIC_MAP',
}));

import { getLayers } from '../../../modules/layers/selectors';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockNewLayer = { wv: { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' } };
const mockLayerDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'wms' };

function buildMockGroupLayers(existingLayerIds = []) {
  const arr = existingLayerIds.map((id) => ({ wv: { id } }));
  return {
    getArray: jest.fn(() => [...arr]),
    removeAt: jest.fn((i) => arr.splice(i, 1)),
    insertAt: jest.fn(),
    push: jest.fn(),
    getLength: jest.fn(() => arr.length),
  };
}

function buildMockFirstLayer(group = null, granule = false) {
  return {
    get: jest.fn((key) => {
      if (key === 'group') return group;
      if (key === 'granule') return granule;
      return null;
    }),
    getLayers: jest.fn(() => buildMockGroupLayers()),
  };
}

function buildMockMapLayers(mapLayerArray = []) {
  return {
    getArray: jest.fn(() => mapLayerArray),
    insertAt: jest.fn(),
    push: jest.fn(),
    getLength: jest.fn(() => mapLayerArray.length),
    removeAt: jest.fn(),
  };
}

function buildMockSelected(mapLayersObj) {
  return {
    getLayers: jest.fn(() => mapLayersObj),
    getSize: jest.fn(() => [800, 600]),
  };
}

function buildMockUi(createLayerResult = mockNewLayer, mapLayersObj = null) {
  const layers = mapLayersObj ?? buildMockMapLayers([]);
  return {
    createLayer: jest.fn().mockResolvedValue(createLayerResult),
    selected: buildMockSelected(layers),
    processingPromise: null,
  };
}

function buildAction(type, layerDef = mockLayerDef) {
  return {
    type,
    id: layerDef.id,
    layers: [layerDef],
  };
}

function buildStore() {
  return mockStore({
    compare: {
      activeString: 'active',
      active: false,
      mode: 'compare',
    },
    date: {
      selected: new Date('2024-06-15'),
      selectedB: new Date('2024-06-14'),
    },
    layers: { active: [] },
    proj: { id: 'geographic' },
  });
}

// Props passed directly — note that clearPreload and projFilteredLayers are
// overridden by mapDispatchToProps / mapStateToProps in the connected component.
// clearPreload assertions must use store.getActions(), and projFilteredLayers
// is controlled via getLayers mock.
function buildProps(overrides = {}) {
  const ui = buildMockUi();
  return {
    action: buildAction('ADD_LAYER'),
    activeString: 'active',
    clearPreload: jest.fn(),
    compareDate: new Date('2024-06-15'),
    compareMapUi: { create: jest.fn() },
    mode: 'compare',
    preloadNextTiles: jest.fn(),
    projFilteredLayers: [mockLayerDef],
    updateLayerVisibilities: jest.fn(),
    ui,
    ...overrides,
  };
}

function renderComponent(props, store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <ConnectedAddLayer {...props} />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AddLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Default: one matching layer so projFilteredLayers index !== -1
    getLayers.mockReturnValue([mockLayerDef]);
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const props = buildProps({ action: { type: 'UNKNOWN' } });
      const { container } = renderComponent(props);
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect: action type routing ────────────────────────────────────────

  describe('useEffect: action type routing', () => {
    // clearPreload is bound via mapDispatchToProps — assert via store.getActions()
    it('dispatches CLEAR_PRELOAD when action type is ADD_LAYER and def is not granule', async () => {
      const store = buildStore();
      const props = buildProps();
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });

    it('dispatches CLEAR_PRELOAD when action type is UPDATE_DDV_LAYER', async () => {
      const store = buildStore();
      const props = buildProps({ action: buildAction('UPDATE_DDV_LAYER') });
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });

    it('does NOT dispatch CLEAR_PRELOAD for granule layers', async () => {
      const store = buildStore();
      const granuleDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'granule' };
      const props = buildProps({ action: buildAction('ADD_LAYER', granuleDef) });
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });

    it('does NOT dispatch CLEAR_PRELOAD when action type is DISPLAY_STATIC_MAP', async () => {
      const store = buildStore();
      const props = buildProps({ action: { type: 'DISPLAY_STATIC_MAP' } });
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });

    it('does not call createLayer for unknown action types', async () => {
      const props = buildProps({ action: { type: 'UNKNOWN_ACTION' } });
      renderComponent(props);
      await act(async () => {});
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });
  });

  // ── addLayer: simple (no compare group) ──────────────────────────────────

  describe('addLayer: no compare group (firstLayer.get("group") is falsy)', () => {
    function buildSimpleUi() {
      const firstLayer = { get: jest.fn(() => null) };
      const mapLayersObj = buildMockMapLayers([firstLayer]);
      mapLayersObj.getLength.mockReturnValue(5);
      return buildMockUi(mockNewLayer, mapLayersObj);
    }

    it('calls updateLayerVisibilities immediately on ADD_LAYER', async () => {
      const props = buildProps({ ui: buildSimpleUi() });
      renderComponent(props);
      await act(async () => {});
      expect(props.updateLayerVisibilities).toHaveBeenCalled();
    });

    it('calls createLayer with the layer def', async () => {
      const ui = buildSimpleUi();
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(ui.createLayer).toHaveBeenCalled();
    });

    it('calls insertAt with index 0 when adjustedIndex <= getLength()', async () => {
      const ui = buildSimpleUi();
      const mapLayersObj = ui.selected.getLayers();
      mapLayersObj.getLength.mockReturnValue(5);
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(mapLayersObj.insertAt).toHaveBeenCalledWith(0, mockNewLayer);
    });

    it('calls push when adjustedIndex > getLength()', async () => {
      const firstLayer = { get: jest.fn(() => null) };
      const mapLayersObj = buildMockMapLayers([firstLayer]);
      mapLayersObj.getLength.mockReturnValue(0);
      getLayers.mockReturnValue([
        { id: 'layer-0' },
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
        { id: 'layer-2' },
      ]);
      const ui = buildMockUi(mockNewLayer, mapLayersObj);
      const props = buildProps({
        ui,
        projFilteredLayers: [
          { id: 'layer-0' },
          { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
          { id: 'layer-2' },
        ],
      });
      renderComponent(props);
      await act(async () => {});
      expect(mapLayersObj.push).toHaveBeenCalledWith(mockNewLayer);
    });

    // projFilteredLayers comes from mapStateToProps via getLayers — control it there
    it('returns early when def.id is not found in projFilteredLayers (index === -1)', async () => {
      getLayers.mockReturnValue([{ id: 'OTHER_LAYER' }]);
      const ui = buildSimpleUi();
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(ui.createLayer).not.toHaveBeenCalled();
    });

    it('calls preloadNextTiles after layer creation', async () => {
      const ui = buildSimpleUi();
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(props.preloadNextTiles).toHaveBeenCalledTimes(1);
    });

    it('removes an existing layer with the same id before inserting', async () => {
      const existingLayer = { wv: { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' } };
      const firstLayer = { get: jest.fn(() => null) };
      const mapLayersArr = [firstLayer, existingLayer];
      const mapLayersObj = buildMockMapLayers(mapLayersArr);
      mapLayersObj.getLength.mockReturnValue(5);
      const ui = buildMockUi(mockNewLayer, mapLayersObj);
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(mapLayersObj.removeAt).toHaveBeenCalled();
    });

    it('warns and does not throw when createLayer rejects', async () => {
      const firstLayer = { get: jest.fn(() => null) };
      const mapLayersObj = buildMockMapLayers([firstLayer]);
      const ui = buildMockUi(mockNewLayer, mapLayersObj);
      ui.createLayer = jest.fn().mockRejectedValue(new Error('create failed'));
      const props = buildProps({ ui });
      renderComponent(props);
      await act(async () => {});
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('addLayer failed'),
        expect.any(Error),
      );
    });
  });

  // ── addLayer: compare group (firstLayer has group) ─────────────────────────

  describe('addLayer: compare group (firstLayer.get("group") is set)', () => {
    function buildCompareUi(activeString = 'active', existingIds = []) {
      const groupLayersObj = buildMockGroupLayers(existingIds);
      groupLayersObj.getLength.mockReturnValue(5);
      const firstLayer = buildMockFirstLayer(activeString, false);
      firstLayer.getLayers = jest.fn(() => groupLayersObj);
      const secondLayer = buildMockFirstLayer('activeB', false);
      secondLayer.getLayers = jest.fn(() => buildMockGroupLayers());
      const mapLayersObj = buildMockMapLayers([firstLayer, secondLayer]);
      const ui = {
        createLayer: jest.fn().mockResolvedValue(mockNewLayer),
        selected: buildMockSelected(mapLayersObj),
        processingPromise: null,
      };
      return { ui, groupLayersObj, firstLayer };
    }

    it('calls createLayer with date and group options', async () => {
      const { ui } = buildCompareUi();
      const props = buildProps({ ui, activeString: 'active' });
      renderComponent(props);
      await act(async () => {});
      expect(ui.createLayer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ group: 'active' }),
      );
    });

    it('calls compareMapUi.create with ui.selected and mode', async () => {
      const { ui } = buildCompareUi();
      const props = buildProps({ ui, activeString: 'active' });
      renderComponent(props);
      await act(async () => {});
      expect(props.compareMapUi.create).toHaveBeenCalledWith(
        ui.selected,
        props.mode,
      );
    });

    it('inserts the new layer into groupLayers via insertAt', async () => {
      const { ui, groupLayersObj } = buildCompareUi();
      const props = buildProps({ ui, activeString: 'active' });
      renderComponent(props);
      await act(async () => {});
      expect(groupLayersObj.insertAt).toHaveBeenCalledWith(
        expect.any(Number),
        mockNewLayer,
      );
    });

    it('removes existing duplicate and adjusts index when existingIndex < index', async () => {
      getLayers.mockReturnValue([
        { id: 'other-layer' },
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
      ]);
      const { ui, groupLayersObj } = buildCompareUi('active', [
        'other-layer',
        'MODIS_Terra_CorrectedReflectance_TrueColor',
      ]);
      const props = buildProps({
        ui,
        activeString: 'active',
        projFilteredLayers: [
          { id: 'other-layer' },
          { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
        ],
      });
      renderComponent(props);
      await act(async () => {});
      expect(groupLayersObj.removeAt).toHaveBeenCalled();
    });

    it('pushes to groupLayers when adjustedIndex > getLength()', async () => {
      getLayers.mockReturnValue([
        { id: 'a' },
        { id: 'b' },
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
      ]);
      const { ui, groupLayersObj } = buildCompareUi();
      groupLayersObj.getLength.mockReturnValue(0);
      const props = buildProps({
        ui,
        activeString: 'active',
        projFilteredLayers: [
          { id: 'a' },
          { id: 'b' },
          { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
        ],
      });
      renderComponent(props);
      await act(async () => {});
      expect(groupLayersObj.push).toHaveBeenCalledWith(mockNewLayer);
    });

    it('uses mapLayers[1] as activelayer when firstLayer group does not match activeString', async () => {
      const groupLayersB = buildMockGroupLayers();
      groupLayersB.getLength.mockReturnValue(5);
      const firstLayer = buildMockFirstLayer('activeB', false);
      const secondLayer = buildMockFirstLayer('active', false);
      secondLayer.getLayers = jest.fn(() => groupLayersB);
      const mapLayersObj = buildMockMapLayers([firstLayer, secondLayer]);
      const ui = {
        createLayer: jest.fn().mockResolvedValue(mockNewLayer),
        selected: buildMockSelected(mapLayersObj),
        processingPromise: null,
      };
      const props = buildProps({ ui, activeString: 'active' });
      renderComponent(props);
      await act(async () => {});
      expect(groupLayersB.insertAt).toHaveBeenCalled();
    });
  });

  // ── granuleLayerAdd ────────────────────────────────────────────────────────

  describe('granuleLayerAdd', () => {
    it('does NOT dispatch CLEAR_PRELOAD for granule type', async () => {
      const store = buildStore();
      const granuleDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'granule' };
      const props = buildProps({ action: buildAction('ADD_LAYER', granuleDef) });
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });

    it('sets ui.processingPromise after granuleLayerAdd', async () => {
      const granuleDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'granule' };
      const props = buildProps({ action: buildAction('ADD_LAYER', granuleDef) });
      renderComponent(props);
      await act(async () => {});
      expect(props.ui.processingPromise).toBeDefined();
    });

    it('chains onto existing ui.processingPromise', async () => {
      const granuleDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'granule' };
      const existingPromise = Promise.resolve();
      const ui = buildMockUi();
      ui.processingPromise = existingPromise;
      const props = buildProps({ action: buildAction('ADD_LAYER', granuleDef), ui });
      renderComponent(props);
      await act(async () => {});
      expect(props.ui.processingPromise).not.toBe(existingPromise);
    });

    it('calls updateLayerVisibilities after granuleLayerAdd resolves', async () => {
      const granuleDef = { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', type: 'granule' };
      const firstLayer = { get: jest.fn(() => null) };
      const mapLayersObj = buildMockMapLayers([firstLayer]);
      mapLayersObj.getLength.mockReturnValue(5);
      const ui = buildMockUi(mockNewLayer, mapLayersObj);
      const props = buildProps({ action: buildAction('ADD_LAYER', granuleDef), ui });
      renderComponent(props);
      await act(async () => {});
      await ui.processingPromise;
      expect(props.updateLayerVisibilities).toHaveBeenCalled();
    });
  });

  // ── addStaticLayer ─────────────────────────────────────────────────────────

  describe('addStaticLayer', () => {
    it('calls createLayer with no arguments for DISPLAY_STATIC_MAP', async () => {
      const ui = buildMockUi();
      const props = buildProps({ action: { type: 'DISPLAY_STATIC_MAP' }, ui });
      renderComponent(props);
      await act(async () => {});
      expect(ui.createLayer).toHaveBeenCalledWith();
    });

    it('calls insertAt(0, newLayer) on ui.selected.getLayers()', async () => {
      const mapLayersObj = buildMockMapLayers([]);
      const ui = buildMockUi(mockNewLayer, mapLayersObj);
      const props = buildProps({ action: { type: 'DISPLAY_STATIC_MAP' }, ui });
      renderComponent(props);
      await act(async () => {});
      expect(mapLayersObj.insertAt).toHaveBeenCalledWith(0, mockNewLayer);
    });
  });

  // ── mapStateToProps ────────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    it('calls getLayers to populate projFilteredLayers', () => {
      const store = buildStore();
      const props = buildProps({ action: { type: 'UNKNOWN' } });
      renderComponent(props, store);
      expect(getLayers).toHaveBeenCalled();
    });

    it('sets compareDate to selected when compare is not active', () => {
      const store = mockStore({
        compare: { activeString: 'active', active: false, mode: 'compare' },
        date: { selected: new Date('2024-01-01'), selectedB: new Date('2024-06-01') },
        layers: { active: [] },
        proj: { id: 'geographic' },
      });
      const props = buildProps({ action: { type: 'UNKNOWN' } });
      renderComponent(props, store);
      expect(getLayers).toHaveBeenCalled();
    });

    it('sets compareDate to selectedB when compare is active and activeString is "activeB"', () => {
      const store = mockStore({
        compare: { activeString: 'activeB', active: true, mode: 'compare' },
        date: { selected: new Date('2024-01-01'), selectedB: new Date('2024-06-01') },
        layers: { active: [] },
        proj: { id: 'geographic' },
      });
      const props = buildProps({ action: { type: 'UNKNOWN' } });
      renderComponent(props, store);
      expect(getLayers).toHaveBeenCalled();
    });
  });

  // ── mapDispatchToProps ─────────────────────────────────────────────────────

  describe('mapDispatchToProps', () => {
    it('dispatches CLEAR_PRELOAD when ADD_LAYER is triggered', async () => {
      const store = buildStore();
      const props = buildProps();
      renderComponent(props, store);
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'CLEAR_PRELOAD' }),
      );
    });
  });
});
