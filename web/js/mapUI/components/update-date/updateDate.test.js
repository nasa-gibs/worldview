/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as dateConstants from '../../../modules/date/constants';
import * as layerConstants from '../../../modules/layers/constants';
import {
  getActiveLayers,
  getAllActiveLayers,
  getActiveLayerGroup,
  getGranuleCount,
} from '../../../modules/layers/selectors';
import { setStyleFunction } from '../../../modules/vector-styles/selectors';
import { getSelectedDate } from '../../../modules/date/selectors';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: () => (Component) => Component,
}));

jest.mock('../../../modules/layers/selectors');
jest.mock('../../../modules/vector-styles/selectors');
jest.mock('../../../modules/date/selectors');

const UpdateDate = require('./updateDate').default;

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const makeCollection = (arr = []) => {
  const items = [...arr];
  return {
    getArray: () => items,
    setAt: jest.fn((index, val) => { items[index] = val; }),
  };
};

const makeLayer = (id, type = 'tile', period = 'daily', extra = {}) => ({
  wv: {
    id,
    def: { id, type, period, ...(extra.def || {}) },
    ...(extra.wv || {}),
  },
  get: jest.fn((key) => (key === 'group' ? extra.group : undefined)),
  ...(extra.getLayers ? { getLayers: extra.getLayers } : {}),
});

const makeDef = (id, type = 'tile', period = 'daily', extra = {}) => ({
  id,
  type,
  period,
  visible: true,
  ...extra,
});

const buildProps = (overrides = {}) => {
  const createdLayer = { wv: { id: 'layer-1', def: { id: 'layer-1' } } };
  const createLayer = jest.fn().mockResolvedValue(createdLayer);

  const ui = {
    createLayer,
    processingPromise: null,
    selected: null,
    dateUpdateSeq: 0,
    cmrRebuildSeq: 0,
  };

  return {
    action: { type: dateConstants.SELECT_DATE, outOfStep: false },
    activeLayers: [],
    activeString: 'active',
    compareMapUi: { update: jest.fn() },
    config: { vectorStyles: null },
    dateCompareState: { date: {}, compare: { activeString: 'active' } },
    getGranuleOptions: jest.fn().mockReturnValue({}),
    granuleState: {},
    isCompareActive: false,
    layerState: {},
    preloadNextTiles: jest.fn(),
    allActiveLayersState: {},
    ui,
    updateLayerVisibilities: jest.fn(),
    vectorStyleState: {},
    ...overrides,
  };
};

const setupDefaultMocks = (layerId = 'layer-1', type = 'tile', period = 'daily') => {
  const mapLayer = makeLayer(layerId, type, period);
  const collection = makeCollection([mapLayer]);
  const layerGroup = { getLayers: () => collection };

  getActiveLayerGroup.mockReturnValue(layerGroup);
  getAllActiveLayers.mockReturnValue([makeDef(layerId, type, period)]);
  getActiveLayers.mockReturnValue([]);
  getGranuleCount.mockReturnValue(20);
  getSelectedDate.mockReturnValue(new Date('2023-01-01'));

  return { mapLayer, collection, layerGroup };
};

const renderComponent = (props) => render(<UpdateDate {...props} />);

describe('UpdateDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore?.();
  });

  describe('renders null', () => {
    it('returns null from render', () => {
      setupDefaultMocks();
      const props = buildProps();
      const { container } = renderComponent(props);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('actionSwitch — unknown action type', () => {
    it('returns undefined and does not call updateLayerVisibilities', () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: 'UNKNOWN_ACTION' } });
      renderComponent(props);
      expect(props.updateLayerVisibilities).not.toHaveBeenCalled();
    });
  });

  describe('actionSwitch — SELECT_DATE', () => {
    it('calls updateLayerVisibilities immediately', () => {
      setupDefaultMocks();
      const props = buildProps();
      renderComponent(props);
      expect(props.updateLayerVisibilities).toHaveBeenCalled();
    });

    it('calls createLayer for a visible temporal layer', async () => {
      setupDefaultMocks();
      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalled();
    });

    it('calls preloadNextTiles when outOfStep is false', async () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: dateConstants.SELECT_DATE, outOfStep: false } });
      renderComponent(props);
      await flushPromises();
      expect(props.preloadNextTiles).toHaveBeenCalled();
    });

    it('does not call preloadNextTiles when outOfStep is true', async () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: dateConstants.SELECT_DATE, outOfStep: true } });
      renderComponent(props);
      await flushPromises();
      expect(props.preloadNextTiles).not.toHaveBeenCalled();
    });

    it('waits for processingPromise before calling updateDate', async () => {
      setupDefaultMocks();
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });
      const props = buildProps();
      props.ui.processingPromise = processingPromise;
      renderComponent(props);
      expect(props.ui.createLayer).not.toHaveBeenCalled();
      resolveFn();
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalled();
    });

    it('clears processingPromise when it is still the same promise after resolution', async () => {
      setupDefaultMocks();
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });
      const props = buildProps();
      props.ui.processingPromise = processingPromise;
      renderComponent(props);
      resolveFn();
      await flushPromises();
      expect(props.ui.processingPromise).toBeNull();
    });

    it('does not clear processingPromise when it changed during await', async () => {
      setupDefaultMocks();
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });
      const props = buildProps();
      props.ui.processingPromise = processingPromise;
      renderComponent(props);
      const newPromise = Promise.resolve();
      props.ui.processingPromise = newPromise;
      resolveFn();
      await flushPromises();
      expect(props.ui.processingPromise).toBe(newPromise);
    });

    it('skips non-visible layers', async () => {
      const mapLayer = makeLayer('layer-1', 'tile', 'daily');
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));
      getAllActiveLayers.mockReturnValue([makeDef('layer-1', 'tile', 'daily', { visible: false })]);

      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });

    it('skips layers not found in the map layer collection', async () => {
      const collection = makeCollection([]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));
      getAllActiveLayers.mockReturnValue([makeDef('missing-layer', 'tile', 'daily')]);

      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });

    it('skips setAt if a newer appliedSeq already exists on the layer', async () => {
      // dateUpdateSeq starts at 0, increments to 1 inside updateDate (mySeq=1).
      // appliedSeq must be strictly greater than mySeq to trigger the skip, so use 9999.
      const mapLayer = {
        wv: { id: 'layer-1', def: { id: 'layer-1', type: 'tile', period: 'daily' }, appliedSeq: 9999 },
      };
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([makeDef('layer-1', 'tile', 'daily')]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(collection.setAt).not.toHaveBeenCalled();
    });

    it('handles granule-type layers using getGranuleCount', async () => {
      const granuleLayer = makeLayer('granule-1', 'granule', 'daily');
      const collection = makeCollection([granuleLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([makeDef('granule-1', 'granule', 'daily')]);
      getActiveLayers.mockReturnValue([]);
      getGranuleCount.mockReturnValue(20);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(getGranuleCount).toHaveBeenCalledWith(props.granuleState, 'granule-1');
    });

    it('uses previousLayer option for non-granule temporal layers', async () => {
      setupDefaultMocks();
      const props = buildProps();
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ previousLayer: expect.anything() }),
      );
    });

    it('calls setStyleFunction for layers with vectorStyles config', async () => {
      const def = { ...makeDef('layer-1', 'tile', 'daily'), vectorStyle: { id: 'vs-1' } };
      const mapLayer = makeLayer('layer-1', 'tile', 'daily');
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([def]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps();
      props.config = { vectorStyles: { 'vs-1': {} } };

      renderComponent(props);
      await flushPromises();
      expect(setStyleFunction).toHaveBeenCalled();
    });

    it('does not call setStyleFunction when config has no vectorStyles', async () => {
      const def = { ...makeDef('layer-1', 'tile', 'daily'), vectorStyle: { id: 'vs-1' } };
      const mapLayer = makeLayer('layer-1', 'tile', 'daily');
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([def]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps();
      props.config = { vectorStyles: null };

      renderComponent(props);
      await flushPromises();
      expect(setStyleFunction).not.toHaveBeenCalled();
    });

    it('increments dateUpdateSeq on each updateDate call', async () => {
      setupDefaultMocks();
      const props = buildProps();
      props.ui.dateUpdateSeq = 0;
      renderComponent(props);
      await flushPromises();
      expect(props.ui.dateUpdateSeq).toBe(1);
    });

    it('does not call updateLayerVisibilities a second time when stale after createLayer', async () => {
      setupDefaultMocks();
      const props = buildProps();
      let called = false;
      props.ui.createLayer = jest.fn().mockImplementation(async () => {
        props.ui.dateUpdateSeq += 1;
        called = true;
        return { wv: {} };
      });

      renderComponent(props);
      await flushPromises();
      expect(called).toBe(true);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('skips freshIndex update when freshIndex is -1 after await in non-compare mode', async () => {
      const layer = makeLayer('layer-1', 'tile', 'daily');
      let items = [layer];
      const collection = {
        getArray: () => items,
        setAt: jest.fn(),
      };
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([makeDef('layer-1', 'tile', 'daily')]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps();
      props.ui.createLayer = jest.fn().mockImplementation(async () => {
        items = [];
        return { wv: {} };
      });

      renderComponent(props);
      await flushPromises();
      expect(collection.setAt).not.toHaveBeenCalled();
    });
  });

  describe('actionSwitch — TOGGLE_LAYER_VISIBILITY', () => {
    it('calls updateDate with outOfStep=false', async () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: layerConstants.TOGGLE_LAYER_VISIBILITY } });
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalled();
    });
  });

  describe('actionSwitch — TOGGLE_OVERLAY_GROUP_VISIBILITY', () => {
    it('calls updateDate with outOfStep=false', async () => {
      setupDefaultMocks();
      const props = buildProps({
        action: { type: layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY },
      });
      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalled();
    });
  });

  describe('actionSwitch — ADD_GRANULE_DATE_RANGES', () => {
    it('calls updateLayerVisibilities immediately', () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: layerConstants.ADD_GRANULE_DATE_RANGES } });
      renderComponent(props);
      expect(props.updateLayerVisibilities).toHaveBeenCalled();
    });

    it('increments cmrRebuildSeq', () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: layerConstants.ADD_GRANULE_DATE_RANGES } });
      props.ui.cmrRebuildSeq = 0;
      renderComponent(props);
      expect(props.ui.cmrRebuildSeq).toBe(1);
    });

    it('calls updateLayerVisibilities a second time after rebuild when not stale', async () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: layerConstants.ADD_GRANULE_DATE_RANGES } });
      renderComponent(props);
      await flushPromises();
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(2);
    });

    it('does not call updateLayerVisibilities a second time when stale', async () => {
      setupDefaultMocks();
      const props = buildProps({ action: { type: layerConstants.ADD_GRANULE_DATE_RANGES } });
      props.ui.cmrRebuildSeq = 0;
      renderComponent(props);
      props.ui.cmrRebuildSeq = 99;
      await flushPromises();
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('calls rebuildEmptyNonCompareGranules and rebuilds a pending granule', async () => {
      const granuleLayerWv = {
        id: 'g-1',
        def: { id: 'g-1', type: 'granule' },
        pendingCmrRebuild: true,
        cmrRebuildAttempts: 0,
      };
      const olLayer = { wv: granuleLayerWv };
      const collection = makeCollection([olLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getGranuleCount.mockReturnValue(20);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: false,
      });
      const createdLayer = { wv: { id: 'g-1', def: { id: 'g-1' } } };
      props.ui.createLayer = jest.fn().mockResolvedValue(createdLayer);
      props.ui.selected = {};

      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).toHaveBeenCalled();
    });

    it('skips non-compare granule rebuild when ui.selected is null', async () => {
      const granuleLayerWv = {
        id: 'g-1',
        def: { id: 'g-1', type: 'granule' },
        pendingCmrRebuild: true,
        cmrRebuildAttempts: 0,
      };
      const collection = makeCollection([{ wv: granuleLayerWv }]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: false,
      });
      props.ui.selected = null;

      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });

    it('skips granule rebuild when cmrRebuildAttempts >= MAX_CMR_REBUILD_ATTEMPTS (3)', async () => {
      const granuleLayerWv = {
        id: 'g-1',
        def: { id: 'g-1', type: 'granule' },
        pendingCmrRebuild: true,
        cmrRebuildAttempts: 3,
      };
      const collection = makeCollection([{ wv: granuleLayerWv }]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: false,
      });
      props.ui.selected = {};

      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });

    it('skips non-compare granule rebuild when layer is not a granule type', async () => {
      const layerWv = {
        id: 'tile-1',
        def: { id: 'tile-1', type: 'tile' },
        pendingCmrRebuild: true,
        cmrRebuildAttempts: 0,
      };
      const collection = makeCollection([{ wv: layerWv }]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: false,
      });
      props.ui.selected = {};

      renderComponent(props);
      await flushPromises();
      expect(props.ui.createLayer).not.toHaveBeenCalled();
    });

    it('calls rebuildAllEmptyCompareGranules when compare is active', async () => {
      const granuleLayerWv = {
        id: 'g-1',
        def: { id: 'g-1', type: 'granule' },
        pendingCmrRebuild: true,
        cmrRebuildAttempts: 0,
      };
      const olLayer = { wv: granuleLayerWv, get: jest.fn() };
      const groupCollection = makeCollection([olLayer]);
      const groupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'active' : undefined)),
        getLayers: () => groupCollection,
      };
      const allGroupsCollection = makeCollection([groupLayer]);

      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const createdLayer = { wv: { id: 'g-1', def: { id: 'g-1' } } };
      const createLayer = jest.fn().mockResolvedValue(createdLayer);

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      await flushPromises();
      expect(createLayer).toHaveBeenCalled();
    });

    it('rebuilds both active and activeB compare granule groups', async () => {
      const makeGranuleGroup = (groupName) => {
        const olLayer = {
          wv: {
            id: `g-${groupName}`,
            def: { id: `g-${groupName}`, type: 'granule' },
            pendingCmrRebuild: true,
            cmrRebuildAttempts: 0,
          },
          get: jest.fn(),
        };
        const groupCollection = makeCollection([olLayer]);
        return {
          get: jest.fn((k) => (k === 'group' ? groupName : undefined)),
          getLayers: () => groupCollection,
        };
      };

      const activeGroup = makeGranuleGroup('active');
      const activeBGroup = makeGranuleGroup('activeB');
      const allGroupsCollection = makeCollection([activeGroup, activeBGroup]);

      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const createLayer = jest.fn().mockResolvedValue({ wv: { id: 'g', def: { id: 'g' } } });

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      await flushPromises();
      expect(createLayer).toHaveBeenCalledTimes(2);
    });

    it('skips compare group not found in allGroups', async () => {
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const createLayer = jest.fn().mockResolvedValue({ wv: {} });
      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => makeCollection([]) };

      renderComponent(props);
      await flushPromises();
      expect(createLayer).not.toHaveBeenCalled();
    });

    it('waits for processingPromise before rebuilding compare granules', async () => {
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });

      const olLayer = {
        wv: {
          id: 'g-1',
          def: { id: 'g-1', type: 'granule' },
          pendingCmrRebuild: true,
          cmrRebuildAttempts: 0,
        },
        get: jest.fn(),
      };
      const groupCollection = makeCollection([olLayer]);
      const groupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'active' : undefined)),
        getLayers: () => groupCollection,
      };
      const allGroupsCollection = makeCollection([groupLayer]);

      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const createLayer = jest.fn().mockResolvedValue({ wv: { id: 'g-1', def: { id: 'g-1' } } });

      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.processingPromise = processingPromise;
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      expect(createLayer).not.toHaveBeenCalled();
      resolveFn();
      await flushPromises();
      expect(createLayer).toHaveBeenCalled();
    });

    it('skips compare rebuild when stale after processingPromise resolves', async () => {
      let resolveFn;
      const processingPromise = new Promise((resolve) => { resolveFn = resolve; });

      const olLayer = {
        wv: {
          id: 'g-1',
          def: { id: 'g-1', type: 'granule' },
          pendingCmrRebuild: true,
          cmrRebuildAttempts: 0,
        },
        get: jest.fn(),
      };
      const groupCollection = makeCollection([olLayer]);
      const groupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'active' : undefined)),
        getLayers: () => groupCollection,
      };
      const allGroupsCollection = makeCollection([groupLayer]);

      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const createLayer = jest.fn().mockResolvedValue({ wv: {} });
      const props = buildProps({
        action: { type: layerConstants.ADD_GRANULE_DATE_RANGES },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.processingPromise = processingPromise;
      props.ui.cmrRebuildSeq = 0;
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      props.ui.cmrRebuildSeq = 99;
      resolveFn();
      await flushPromises();
      expect(createLayer).not.toHaveBeenCalled();
    });
  });

  describe('compare mode — updateCompareLayer', () => {
    const buildCompareProps = (layerDef) => {
      const mapLayer = makeLayer(layerDef.id, layerDef.type, layerDef.period);
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([layerDef]);
      getActiveLayers.mockReturnValue([]);
      getGranuleCount.mockReturnValue(20);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const freshOlLayer = { wv: { id: layerDef.id, def: { id: layerDef.id } }, get: jest.fn() };
      const activeGroupCollection = makeCollection([freshOlLayer]);
      const activeGroupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'active' : undefined)),
        getLayers: () => activeGroupCollection,
      };
      const allGroupsCollection = makeCollection([activeGroupLayer]);

      const createdLayer = { wv: { id: layerDef.id, def: { id: layerDef.id } } };
      const createLayer = jest.fn().mockResolvedValue(createdLayer);

      const props = buildProps({
        action: { type: dateConstants.SELECT_DATE, outOfStep: false },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      return {
        props, createdLayer, createLayer, activeGroupCollection,
      };
    };

    it('calls createLayer for a temporal tile compare layer', async () => {
      const { props, createLayer } = buildCompareProps(makeDef('layer-1', 'tile', 'daily'));
      renderComponent(props);
      await flushPromises();
      expect(createLayer).toHaveBeenCalled();
    });

    it('calls createLayer for a granule compare layer', async () => {
      const { props, createLayer } = buildCompareProps(makeDef('granule-1', 'granule', 'daily'));
      renderComponent(props);
      await flushPromises();
      expect(createLayer).toHaveBeenCalled();
    });

    it('calls compareMapUi.update after successfully setting the layer', async () => {
      const { props } = buildCompareProps(makeDef('layer-1', 'tile', 'daily'));
      renderComponent(props);
      await flushPromises();
      expect(props.compareMapUi.update).toHaveBeenCalledWith('active');
    });

    it('uses selectedB date key when group is activeB', async () => {
      const layerDef = makeDef('layer-1', 'tile', 'daily');
      const mapLayer = makeLayer('layer-1', 'tile', 'daily');
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([layerDef]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const freshOlLayer = { wv: { id: 'layer-1', def: { id: 'layer-1' } }, get: jest.fn() };
      const activeBGroupCollection = makeCollection([freshOlLayer]);
      const activeBGroupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'activeB' : undefined)),
        getLayers: () => activeBGroupCollection,
      };
      const allGroupsCollection = makeCollection([activeBGroupLayer]);

      const createLayer = jest.fn().mockResolvedValue({ wv: { id: 'layer-1', def: { id: 'layer-1' } } });

      const props = buildProps({
        action: { type: dateConstants.SELECT_DATE, outOfStep: false },
        isCompareActive: true,
        activeString: 'activeB',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      await flushPromises();
      expect(getSelectedDate).toHaveBeenCalledWith(props.dateCompareState, 'selectedB');
    });

    it('skips setAt when freshIndex is -1 after await', async () => {
      const layerDef = makeDef('layer-1', 'tile', 'daily');
      const mapLayer = makeLayer('layer-1', 'tile', 'daily');
      const collection = makeCollection([mapLayer]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([layerDef]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const emptyGroupCollection = makeCollection([]);
      const activeGroupLayer = {
        get: jest.fn((k) => (k === 'group' ? 'active' : undefined)),
        getLayers: () => emptyGroupCollection,
      };
      const allGroupsCollection = makeCollection([activeGroupLayer]);

      const createLayer = jest.fn().mockResolvedValue({ wv: { id: 'layer-1', def: { id: 'layer-1' } } });

      const props = buildProps({
        action: { type: dateConstants.SELECT_DATE, outOfStep: false },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.createLayer = createLayer;
      props.ui.selected = { getLayers: () => allGroupsCollection };

      renderComponent(props);
      await flushPromises();
      expect(emptyGroupCollection.setAt).not.toHaveBeenCalled();
    });

    it('skips setAt when existing layer has a higher appliedSeq', async () => {
      const { props, activeGroupCollection } = buildCompareProps(makeDef('layer-1', 'tile', 'daily'));
      const existingLayer = activeGroupCollection.getArray()[0];
      existingLayer.wv = { ...existingLayer.wv, appliedSeq: 9999 };

      renderComponent(props);
      await flushPromises();
      expect(activeGroupCollection.setAt).not.toHaveBeenCalled();
    });

    it('does not call compareMapUi.update when ui.selected is null and layers collection is empty', async () => {
      const layerDef = makeDef('layer-1', 'tile', 'daily');
      const collection = makeCollection([]);
      getActiveLayerGroup.mockReturnValue({ getLayers: () => collection });
      getAllActiveLayers.mockReturnValue([layerDef]);
      getActiveLayers.mockReturnValue([]);
      getSelectedDate.mockReturnValue(new Date('2023-01-01'));

      const props = buildProps({
        action: { type: dateConstants.SELECT_DATE, outOfStep: false },
        isCompareActive: true,
        activeString: 'active',
      });
      props.ui.selected = null;

      renderComponent(props);
      await flushPromises();
      expect(props.compareMapUi.update).not.toHaveBeenCalled();
    });
  });
});
