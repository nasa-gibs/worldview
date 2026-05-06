/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import * as layerConstants from '../../../modules/layers/constants';
import { getActiveLayers } from '../../../modules/layers/selectors';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: () => (Component) => Component,
}));

jest.mock('../../../modules/layers/selectors');

const UpdateOpacity = require('./updateOpacity').default;

const buildUiSelected = (layers = []) => ({
  selected: {
    getLayers: () => ({
      getArray: () => layers,
    }),
  },
});

const buildProps = (overrides = {}) => ({
  action: { type: layerConstants.UPDATE_OPACITY, id: 'layer-1', opacity: 0.5 },
  activeLayers: [{ id: 'layer-1', type: 'tile' }],
  activeString: 'active',
  compare: {},
  findLayer: jest.fn(),
  isCompareActive: false,
  ui: buildUiSelected(),
  updateLayerVisibilities: jest.fn(),
  ...overrides,
});

const renderComponent = (props) => render(<UpdateOpacity {...props} />);

describe('UpdateOpacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveLayers.mockReturnValue([]);
  });

  describe('renders null', () => {
    it('returns null from render', () => {
      const props = buildProps();
      const { container } = renderComponent(props);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('useEffect — non UPDATE_OPACITY action', () => {
    it('does not call updateLayerVisibilities for an unrelated action type', () => {
      const props = buildProps({ action: { type: 'SOME_OTHER_ACTION' } });
      renderComponent(props);
      expect(props.updateLayerVisibilities).not.toHaveBeenCalled();
    });
  });

  describe('updateOpacity — layer not found in activeLayers', () => {
    it('calls updateLayerVisibilities and returns early when def is not found', () => {
      const props = buildProps({
        activeLayers: [],
        action: { type: layerConstants.UPDATE_OPACITY, id: 'missing-layer', opacity: 0.5 },
      });
      renderComponent(props);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
      expect(props.findLayer).not.toHaveBeenCalled();
    });
  });

  describe('updateOpacity — non-granule layer', () => {
    it('calls setOpacity on the layerGroup', () => {
      const layerGroup = { setOpacity: jest.fn() };
      const findLayer = jest.fn().mockReturnValue(layerGroup);
      const props = buildProps({ findLayer });
      renderComponent(props);
      expect(findLayer).toHaveBeenCalledWith({ id: 'layer-1', type: 'tile' }, 'active');
      expect(layerGroup.setOpacity).toHaveBeenCalledWith(0.5);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('also calls setOpacity on each sublayer when getLayersArray is available', () => {
      const sublayer1 = { setOpacity: jest.fn() };
      const sublayer2 = { setOpacity: jest.fn() };
      const layerGroup = {
        setOpacity: jest.fn(),
        getLayersArray: jest.fn().mockReturnValue([sublayer1, sublayer2]),
      };
      const findLayer = jest.fn().mockReturnValue(layerGroup);
      const props = buildProps({ findLayer });
      renderComponent(props);
      expect(sublayer1.setOpacity).toHaveBeenCalledWith(0.5);
      expect(sublayer2.setOpacity).toHaveBeenCalledWith(0.5);
    });

    it('calls updateLayerVisibilities and returns early when findLayer returns null', () => {
      const findLayer = jest.fn().mockReturnValue(null);
      const props = buildProps({ findLayer });
      renderComponent(props);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('calls updateLayerVisibilities and returns early when layerGroup has no setOpacity', () => {
      const layerGroup = {};
      const findLayer = jest.fn().mockReturnValue(layerGroup);
      const props = buildProps({ findLayer });
      renderComponent(props);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateOpacity — granule layer, non-compare mode', () => {
    it('calls setOpacity on a matching ol-layer when group and id match', () => {
      const granuleDef = { id: 'granule-1', type: 'granule' };
      const granuleLayer = {
        className_: 'ol-layer',
        wv: { id: 'granule-1', group: 'active' },
        setOpacity: jest.fn(),
      };
      const ui = buildUiSelected([granuleLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.7 },
        activeLayers: [granuleDef],
        activeString: 'active',
        compare: {},
        isCompareActive: false,
        ui,
      });
      renderComponent(props);
      expect(granuleLayer.setOpacity).toHaveBeenCalledWith(0.7);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('does not call setOpacity when the group does not match', () => {
      const granuleDef = { id: 'granule-1', type: 'granule' };
      const granuleLayer = {
        className_: 'ol-layer',
        wv: { id: 'granule-1', group: 'activeB' },
        setOpacity: jest.fn(),
      };
      const ui = buildUiSelected([granuleLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.7 },
        activeLayers: [granuleDef],
        activeString: 'active',
        isCompareActive: false,
        ui,
      });
      renderComponent(props);
      expect(granuleLayer.setOpacity).not.toHaveBeenCalled();
    });

    it('does not call setOpacity when the id does not match', () => {
      const granuleDef = { id: 'granule-1', type: 'granule' };
      const granuleLayer = {
        className_: 'ol-layer',
        wv: { id: 'different-id', group: 'active' },
        setOpacity: jest.fn(),
      };
      const ui = buildUiSelected([granuleLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.7 },
        activeLayers: [granuleDef],
        activeString: 'active',
        isCompareActive: false,
        ui,
      });
      renderComponent(props);
      expect(granuleLayer.setOpacity).not.toHaveBeenCalled();
    });

    it('skips layers that are not ol-layer class', () => {
      const granuleDef = { id: 'granule-1', type: 'granule' };
      const nonOlLayer = {
        className_: 'other-class',
        wv: { id: 'granule-1', group: 'active' },
        setOpacity: jest.fn(),
      };
      const ui = buildUiSelected([nonOlLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.7 },
        activeLayers: [granuleDef],
        activeString: 'active',
        isCompareActive: false,
        ui,
      });
      renderComponent(props);
      expect(nonOlLayer.setOpacity).not.toHaveBeenCalled();
    });
  });

  describe('updateOpacity — granule layer, compare mode', () => {
    const buildCompareGranuleLayer = ({
      compareLayerGroupId,
      tileLayerId,
      tileLayerGroup,
      compareSetOpacity = jest.fn(),
    }) => {
      const tileLayer = [{ wv: { id: tileLayerId, group: tileLayerGroup } }];
      const compareLayerGroup = {
        wv: { id: compareLayerGroupId },
        getLayers: () => ({ getArray: () => tileLayer }),
        setOpacity: compareSetOpacity,
      };
      const olLayer = {
        className_: 'ol-layer',
        getLayers: () => ({ getArray: () => [compareLayerGroup] }),
      };
      return { olLayer, compareLayerGroup, tileLayer };
    };

    it('calls setOpacity on compareLayerGroup when tileLayer id and group match', () => {
      const compareSetOpacity = jest.fn();
      const { olLayer } = buildCompareGranuleLayer({
        compareLayerGroupId: 'granule-1',
        tileLayerId: 'granule-1',
        tileLayerGroup: 'active',
        compareSetOpacity,
      });

      const ui = buildUiSelected([olLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.4 },
        activeLayers: [{ id: 'granule-1', type: 'granule' }],
        activeString: 'active',
        compare: { active: true },
        isCompareActive: true,
        ui,
      });
      renderComponent(props);
      expect(compareSetOpacity).toHaveBeenCalledWith(0.4);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('does not call setOpacity when compareLayerGroup id does not match the target id', () => {
      const compareSetOpacity = jest.fn();
      const { olLayer } = buildCompareGranuleLayer({
        compareLayerGroupId: 'different-granule',
        tileLayerId: 'granule-1',
        tileLayerGroup: 'active',
        compareSetOpacity,
      });

      const ui = buildUiSelected([olLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.4 },
        activeLayers: [{ id: 'granule-1', type: 'granule' }],
        activeString: 'active',
        compare: { active: true },
        isCompareActive: true,
        ui,
      });
      renderComponent(props);
      expect(compareSetOpacity).not.toHaveBeenCalled();
    });

    it('does not call setOpacity when tileLayer group does not match activeString', () => {
      const compareSetOpacity = jest.fn();
      const { olLayer } = buildCompareGranuleLayer({
        compareLayerGroupId: 'granule-1',
        tileLayerId: 'granule-1',
        tileLayerGroup: 'activeB',
        compareSetOpacity,
      });

      const ui = buildUiSelected([olLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.4 },
        activeLayers: [{ id: 'granule-1', type: 'granule' }],
        activeString: 'active',
        compare: { active: true },
        isCompareActive: true,
        ui,
      });
      renderComponent(props);
      expect(compareSetOpacity).not.toHaveBeenCalled();
    });

    it('does not call setOpacity when tileLayer id does not match', () => {
      const compareSetOpacity = jest.fn();
      const { olLayer } = buildCompareGranuleLayer({
        compareLayerGroupId: 'granule-1',
        tileLayerId: 'different-tile-id',
        tileLayerGroup: 'active',
        compareSetOpacity,
      });

      const ui = buildUiSelected([olLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.4 },
        activeLayers: [{ id: 'granule-1', type: 'granule' }],
        activeString: 'active',
        compare: { active: true },
        isCompareActive: true,
        ui,
      });
      renderComponent(props);
      expect(compareSetOpacity).not.toHaveBeenCalled();
    });

    it('skips compare path when compareArg is falsy even if isCompareActive is true', () => {
      const compareSetOpacity = jest.fn();
      const granuleLayer = {
        className_: 'ol-layer',
        wv: { id: 'granule-1', group: 'active' },
        setOpacity: jest.fn(),
      };
      const ui = buildUiSelected([granuleLayer]);
      const props = buildProps({
        action: { type: layerConstants.UPDATE_OPACITY, id: 'granule-1', opacity: 0.3 },
        activeLayers: [{ id: 'granule-1', type: 'granule' }],
        activeString: 'active',
        compare: null,
        isCompareActive: true,
        ui,
      });
      renderComponent(props);
      expect(compareSetOpacity).not.toHaveBeenCalled();
      expect(granuleLayer.setOpacity).toHaveBeenCalledWith(0.3);
    });
  });
});
