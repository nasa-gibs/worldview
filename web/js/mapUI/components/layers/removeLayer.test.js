/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedRemoveLayer from './removeLayer';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayerGroup: jest.fn(),
}));

import { getActiveLayerGroup } from '../../../modules/layers/selectors';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockOlLayer = { id: 'mock-ol-layer' };

function buildMockLayerGroup() {
  return {
    getLayers: jest.fn(() => ({
      remove: jest.fn(),
    })),
  };
}

function buildStore(compareOverride = {}) {
  return mockStore({
    compare: {
      active: false,
      activeString: 'active',
      ...compareOverride,
    },
    map: { ui: { selected: {} } },
  });
}

function buildProps(overrides = {}) {
  return {
    action: { layersToRemove: [{ id: 'MODIS_Terra_CorrectedReflectance_TrueColor' }] },
    findLayer: jest.fn(() => mockOlLayer),
    ui: { selected: { removeLayer: jest.fn() } },
    updateLayerVisibilities: jest.fn(),
    ...overrides,
  };
}

function renderComponent(props, store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <ConnectedRemoveLayer {...props} />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RemoveLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveLayerGroup.mockReturnValue(null);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const props = buildProps({ action: {} });
      const { container } = renderComponent(props);
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect guard: no layersToRemove ────────────────────────────────────

  describe('useEffect guard: action.layersToRemove is absent', () => {
    it('does NOT call findLayer when action has no layersToRemove', () => {
      const props = buildProps({ action: {} });
      renderComponent(props);
      expect(props.findLayer).not.toHaveBeenCalled();
    });

    it('does NOT call updateLayerVisibilities when action has no layersToRemove', () => {
      const props = buildProps({ action: {} });
      renderComponent(props);
      expect(props.updateLayerVisibilities).not.toHaveBeenCalled();
    });

    it('does NOT call ui.selected.removeLayer when action has no layersToRemove', () => {
      const props = buildProps({ action: {} });
      renderComponent(props);
      expect(props.ui.selected.removeLayer).not.toHaveBeenCalled();
    });
  });

  // ── removeLayer: compare NOT active ───────────────────────────────────────

  describe('removeLayer: compare not active (ui.selected.removeLayer path)', () => {
    it('calls findLayer with each def and compare.activeString', () => {
      const store = buildStore({ active: false, activeString: 'active' });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.findLayer).toHaveBeenCalledWith(
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
        'active',
      );
    });

    it('calls ui.selected.removeLayer with the resolved OL layer', () => {
      const store = buildStore({ active: false, activeString: 'active' });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.ui.selected.removeLayer).toHaveBeenCalledWith(mockOlLayer);
    });

    it('does NOT call getActiveLayerGroup when compare is not active', () => {
      const store = buildStore({ active: false });
      const props = buildProps();
      renderComponent(props, store);
      expect(getActiveLayerGroup).not.toHaveBeenCalled();
    });

    it('calls updateLayerVisibilities after removing all layers', () => {
      const store = buildStore({ active: false });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('calls removeLayer for each def in layersToRemove', () => {
      const store = buildStore({ active: false, activeString: 'active' });
      const props = buildProps({
        action: {
          layersToRemove: [
            { id: 'MODIS_Terra_CorrectedReflectance_TrueColor' },
            { id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor' },
          ],
        },
      });
      renderComponent(props, store);
      expect(props.findLayer).toHaveBeenCalledTimes(2);
      expect(props.ui.selected.removeLayer).toHaveBeenCalledTimes(2);
    });

    it('calls updateLayerVisibilities exactly once even when removing multiple layers', () => {
      const store = buildStore({ active: false });
      const props = buildProps({
        action: {
          layersToRemove: [
            { id: 'layer-a' },
            { id: 'layer-b' },
            { id: 'layer-c' },
          ],
        },
      });
      renderComponent(props, store);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });
  });

  // ── removeLayer: compare IS active ────────────────────────────────────────

  describe('removeLayer: compare active (layerGroup.getLayers().remove path)', () => {
    it('calls getActiveLayerGroup with the map and compare state from the store', () => {
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const store = buildStore({ active: true, activeString: 'active' });
      const props = buildProps();
      renderComponent(props, store);
      expect(getActiveLayerGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          map: expect.anything(),
          compare: expect.objectContaining({ active: true }),
        }),
      );
    });

    it('does NOT call ui.selected.removeLayer when compare is active', () => {
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const store = buildStore({ active: true });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.ui.selected.removeLayer).not.toHaveBeenCalled();
    });

    it('calls updateLayerVisibilities after removing in compare mode', () => {
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const store = buildStore({ active: true });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('does NOT call layerGroup.getLayers().remove when getActiveLayerGroup returns null', () => {
      getActiveLayerGroup.mockReturnValue(null);
      const store = buildStore({ active: true });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.ui.selected.removeLayer).not.toHaveBeenCalled();
    });

    it('still calls updateLayerVisibilities when layerGroup is null', () => {
      getActiveLayerGroup.mockReturnValue(null);
      const store = buildStore({ active: true });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.updateLayerVisibilities).toHaveBeenCalledTimes(1);
    });

    it('calls findLayer with compare.activeString from the store', () => {
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const store = buildStore({ active: true, activeString: 'activeB' });
      const props = buildProps();
      renderComponent(props, store);
      expect(props.findLayer).toHaveBeenCalledWith(
        expect.anything(),
        'activeB',
      );
    });
  });

  // ── mapStateToProps ────────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    it('passes compare from the store to the component', () => {
      const store = buildStore({ active: true, activeString: 'activeB' });
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const props = buildProps();
      renderComponent(props, store);
      expect(props.findLayer).toHaveBeenCalledWith(
        expect.anything(),
        'activeB',
      );
    });

    it('passes map from the store to getActiveLayerGroup', () => {
      const mockLayerGroup = buildMockLayerGroup();
      getActiveLayerGroup.mockReturnValue(mockLayerGroup);
      const store = buildStore({ active: true });
      const props = buildProps();
      renderComponent(props, store);
      expect(getActiveLayerGroup).toHaveBeenCalledWith(
        expect.objectContaining({ map: expect.anything() }),
      );
    });
  });
});
