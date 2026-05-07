/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import ConnectedGranuleHover from './granuleHover';
import { GRANULE_HOVERED, GRANULE_HOVER_UPDATE } from '../../../util/constants';

jest.mock('../../../util/util', () => ({
  __esModule: true,
  default: {
    events: {
      on: jest.fn(),
    },
  },
}));

import util from '../../../util/util';

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveGranuleFootPrints: jest.fn(),
}));

import { getActiveGranuleFootPrints } from '../../../modules/layers/selectors';

const mockStore = configureMockStore();

const mockProjectionCode = 'EPSG:4326';

const mockProjection = {
  getCode: jest.fn(() => mockProjectionCode),
};

const mockView = {
  getProjection: jest.fn(() => mockProjection),
};

const mockSelectedMap = {
  getView: jest.fn(() => mockView),
};

const mockAddFootprint = jest.fn();
const mockUpdateFootprint = jest.fn();

const mockGranuleFootprintLayer = {
  addFootprint: mockAddFootprint,
  updateFootprint: mockUpdateFootprint,
};

function buildGranuleFootprints(proj = mockProjectionCode, layer = mockGranuleFootprintLayer) {
  return { [proj]: layer };
}

function buildStore(stateOverrides = {}) {
  return mockStore({
    layers: {},
    ...stateOverrides,
  });
}

function buildProps(overrides = {}) {
  return {
    granuleFootprints: buildGranuleFootprints(),
    ui: { selected: mockSelectedMap },
    ...overrides,
  };
}

function renderComponent(props, store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <ConnectedGranuleHover {...props} />
    </Provider>,
  );
  return { ...utils, store: s };
}

function getHandler(eventName) {
  const call = util.events.on.mock.calls.find(([event]) => event === eventName);
  return call ? call[1] : null;
}

describe('GranuleHover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    util.events.on = jest.fn();
    mockProjection.getCode.mockReturnValue(mockProjectionCode);
    getActiveGranuleFootPrints.mockReturnValue({});
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent(buildProps());
      expect(container.firstChild).toBeNull();
    });
  });

  // ── events.on registration ─────────────────────────────────────────────────

  describe('events.on registration', () => {
    it('registers a GRANULE_HOVERED handler', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledWith(GRANULE_HOVERED, expect.any(Function));
    });

    it('registers a GRANULE_HOVER_UPDATE handler', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledWith(GRANULE_HOVER_UPDATE, expect.any(Function));
    });

    it('registers exactly two event handlers', () => {
      renderComponent(buildProps());
      expect(util.events.on).toHaveBeenCalledTimes(2);
    });
  });

  // ── onGranuleHover ─────────────────────────────────────────────────────────

  describe('onGranuleHover', () => {
    it('calls addFootprint when proj exists in granuleFootprints', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', '2024-01-15');
      expect(mockAddFootprint).toHaveBeenCalledTimes(1);
    });

    it('calls addFootprint with geometry and date when platform and date are provided', () => {
      const mockGeometry = { type: 'Polygon', coordinates: [] };
      getActiveGranuleFootPrints.mockReturnValue({ '2024-01-15': mockGeometry });
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', '2024-01-15');
      expect(mockAddFootprint).toHaveBeenCalledWith(mockGeometry, '2024-01-15');
    });

    it('calls addFootprint with undefined geometry when platform is falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler(null, '2024-01-15');
      expect(mockAddFootprint).toHaveBeenCalledWith(undefined, '2024-01-15');
    });

    it('calls addFootprint with undefined geometry when date is falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', null);
      expect(mockAddFootprint).toHaveBeenCalledWith(undefined, null);
    });

    it('calls addFootprint with undefined geometry when both platform and date are falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler(null, null);
      expect(mockAddFootprint).toHaveBeenCalledWith(undefined, null);
    });

    it('does NOT call addFootprint when proj is not in granuleFootprints', () => {
      const props = buildProps({ granuleFootprints: {} });
      renderComponent(props);
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', '2024-01-15');
      expect(mockAddFootprint).not.toHaveBeenCalled();
    });

    it('calls getActiveGranuleFootPrints with state when platform and date are provided', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', '2024-01-15');
      expect(getActiveGranuleFootPrints).toHaveBeenCalledTimes(1);
    });

    it('does NOT call getActiveGranuleFootPrints when platform is falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler(null, '2024-01-15');
      expect(getActiveGranuleFootPrints).not.toHaveBeenCalled();
    });

    it('does NOT call getActiveGranuleFootPrints when date is falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', null);
      expect(getActiveGranuleFootPrints).not.toHaveBeenCalled();
    });

    it('uses the correct projection code from ui.selected', () => {
      mockProjection.getCode.mockReturnValue('EPSG:3413');
      const props = buildProps({
        granuleFootprints: { 'EPSG:3413': mockGranuleFootprintLayer },
      });
      renderComponent(props);
      const handler = getHandler(GRANULE_HOVERED);
      handler('TERRA', '2024-01-15');
      expect(mockAddFootprint).toHaveBeenCalledTimes(1);
    });
  });

  // ── onGranuleHoverUpdate ───────────────────────────────────────────────────

  describe('onGranuleHoverUpdate', () => {
    it('calls updateFootprint when proj exists, platform and date provided, and geometry exists', () => {
      const mockGeometry = { type: 'Polygon', coordinates: [] };
      getActiveGranuleFootPrints.mockReturnValue({ '2024-01-15': mockGeometry });
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', '2024-01-15');
      expect(mockUpdateFootprint).toHaveBeenCalledWith(mockGeometry, '2024-01-15');
    });

    it('does NOT call updateFootprint when proj is not in granuleFootprints', () => {
      renderComponent(buildProps({ granuleFootprints: {} }));
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', '2024-01-15');
      expect(mockUpdateFootprint).not.toHaveBeenCalled();
    });

    it('does NOT call updateFootprint when geometry is undefined (platform falsy)', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler(null, '2024-01-15');
      expect(mockUpdateFootprint).not.toHaveBeenCalled();
    });

    it('does NOT call updateFootprint when geometry is undefined (date falsy)', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', null);
      expect(mockUpdateFootprint).not.toHaveBeenCalled();
    });

    it('does NOT call updateFootprint when geometry is not found in active footprints', () => {
      getActiveGranuleFootPrints.mockReturnValue({});
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', '2024-01-15');
      expect(mockUpdateFootprint).not.toHaveBeenCalled();
    });

    it('calls getActiveGranuleFootPrints with state when platform and date are provided', () => {
      const mockGeometry = { type: 'Polygon', coordinates: [] };
      getActiveGranuleFootPrints.mockReturnValue({ '2024-01-15': mockGeometry });
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', '2024-01-15');
      expect(getActiveGranuleFootPrints).toHaveBeenCalledTimes(1);
    });

    it('does NOT call getActiveGranuleFootPrints when platform is falsy', () => {
      renderComponent(buildProps());
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler(null, '2024-01-15');
      expect(getActiveGranuleFootPrints).not.toHaveBeenCalled();
    });

    it('uses the correct projection code from ui.selected', () => {
      mockProjection.getCode.mockReturnValue('EPSG:3413');
      const mockGeometry = { type: 'Polygon', coordinates: [] };
      getActiveGranuleFootPrints.mockReturnValue({ '2024-01-15': mockGeometry });
      const props = buildProps({
        granuleFootprints: { 'EPSG:3413': mockGranuleFootprintLayer },
      });
      renderComponent(props);
      const handler = getHandler(GRANULE_HOVER_UPDATE);
      handler('TERRA', '2024-01-15');
      expect(mockUpdateFootprint).toHaveBeenCalledTimes(1);
    });
  });

  // ── mapStateToProps ────────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    it('passes the full Redux state as the "state" prop', () => {
      const customState = { layers: { active: [] }, date: { selected: new Date() } };
      const store = buildStore(customState);
      const props = buildProps();
      renderComponent(props, store);
      const handler = getHandler(GRANULE_HOVERED);
      const mockGeometry = { type: 'Polygon' };
      getActiveGranuleFootPrints.mockReturnValue({ '2024-01-15': mockGeometry });
      handler('TERRA', '2024-01-15');
      expect(getActiveGranuleFootPrints).toHaveBeenCalledWith(
        expect.objectContaining(customState),
      );
    });
  });
});
