/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SearchLayerRow from './search-layer-row';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, id, className }) => (
    <span data-testid={`fa-${icon}`} id={id} className={className} />
  ),
}));

jest.mock('../renderSplitTitle', () => ({ layer }) => (
  <span data-testid="layer-title">{layer.id}</span>
));

jest.mock('../../../../modules/layers/actions', () => ({
  addLayer: jest.fn(() => ({ type: 'ADD_LAYER' })),
  removeLayer: jest.fn(() => ({ type: 'REMOVE_LAYER' })),
}));

jest.mock('../../../../modules/product-picker/actions', () => ({
  clearSingleRecentLayer: jest.fn(() => ({ type: 'CLEAR_RECENT' })),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayersMap: jest.fn(() => ({})),
}));

jest.mock('../../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => '2023-05-01'),
}));

jest.mock('../../../../modules/notifications/util', () => ({
  getLayerNoticesForLayer: jest.fn(() => null),
}));

jest.mock('../../../../util/util', () => ({
  __esModule: true,
  default: {
    encodeId: jest.fn((id) => id),
    events: { trigger: jest.fn() },
  },
}));

jest.mock('../../../../util/constants', () => ({
  JOYRIDE_INCREMENT: 'joyride:increment',
}));

// Mock reactstrap so that UncontrolledTooltip doesn't try to find DOM targets
jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick, className, color, title }) => (
    <div
      role="button"
      className={className}
      data-color={color}
      title={title}
      onClick={onClick}
    >
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockConfigureStore = configureStore([]);

const baseState = {
  productPicker: { selectedLayer: null, categoryType: 'search' },
  screenSize: { isMobileDevice: false, screenWidth: 1200 },
  notifications: {},
  date: { selected: '2023-05-01' },
  compare: { isCompareA: true },
};

const layer = {
  id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  title: 'MODIS Terra CorrectedReflectance',
};

function renderRow(ownProps = {}, stateOverrides = {}) {
  const state = {
    ...baseState,
    ...stateOverrides,
    productPicker: {
      ...baseState.productPicker,
      ...(stateOverrides.productPicker || {}),
    },
    screenSize: {
      ...baseState.screenSize,
      ...(stateOverrides.screenSize || {}),
    },
  };
  const store = mockConfigureStore(state);
  const showLayerMetadata = ownProps.showLayerMetadata || jest.fn();
  const rowLayer = ownProps.layer || layer;
  const result = render(
    <Provider store={store}>
      <SearchLayerRow
        layer={rowLayer}
        showLayerMetadata={showLayerMetadata}
      />
    </Provider>,
  );
  return { ...result, store, showLayerMetadata };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  // Clear call history on all mocks without wiping implementations.
  // (jest.clearAllMocks() in Jest 30 can wipe implementations set in
  //  jest.mock() factories, so we clear selectively instead.)
  Element.prototype.scrollIntoView.mockClear();

  const util = require('../../../../util/util').default;
  util.encodeId.mockClear();
  util.events.trigger.mockClear();

  const { addLayer } = require('../../../../modules/layers/actions');
  addLayer.mockClear();

  const { removeLayer } = require('../../../../modules/layers/actions');
  removeLayer.mockClear();

  const { clearSingleRecentLayer } = require('../../../../modules/product-picker/actions');
  clearSingleRecentLayer.mockClear();

  // Reset selectors that individual tests may override.
  const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
  getActiveLayersMap.mockReturnValue({});

  const { getLayerNoticesForLayer } = require('../../../../modules/notifications/util');
  getLayerNoticesForLayer.mockReturnValue(null);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchLayerRow', () => {
  // -------------------------------------------------------------------------
  // Row classes
  // -------------------------------------------------------------------------
  describe('row CSS classes', () => {
    it('renders base row class when layer is not selected', () => {
      const { container } = renderRow();
      const row = container.querySelector(`#${layer.id}-search-row`);
      expect(row).toBeTruthy();
      expect(row.className).toBe('search-row layers-all-layer');
    });

    it('adds "selected" class when selectedLayer matches layer', () => {
      const { container } = renderRow(
        {},
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      expect(row.className).toContain('selected');
    });

    it('does not add "selected" class when a different layer is selected', () => {
      const { container } = renderRow(
        {},
        {
          productPicker: {
            selectedLayer: { id: 'OTHER_LAYER' },
            categoryType: 'search',
          },
        },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      expect(row.className).not.toContain('selected');
    });
  });

  // -------------------------------------------------------------------------
  // Checkbox classes and SVG
  // -------------------------------------------------------------------------
  describe('checkbox state', () => {
    it('renders unchecked checkbox class without "checked" when layer is not active', () => {
      const { container } = renderRow();
      const checkboxDiv = container.querySelector('.wv-checkbox');
      expect(checkboxDiv.className).toContain('gray');
      expect(checkboxDiv.className).not.toContain('checked');
    });

    it('renders "checked" class when layer is enabled', () => {
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [layer.id]: true });

      const { container } = renderRow();
      const checkboxDiv = container.querySelector('.wv-checkbox');
      expect(checkboxDiv.className).toContain('checked');
    });

    it('does not render check SVG when layer is not enabled', () => {
      const { container } = renderRow();
      expect(container.querySelector('svg.check')).toBeNull();
    });

    it('renders check SVG when layer is enabled', () => {
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [layer.id]: true });

      const { container } = renderRow();
      expect(container.querySelector('svg.check')).toBeTruthy();
    });

    it('checkbox does not have "gray" when metadata is showing (layer selected)', () => {
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [layer.id]: true });

      const { container } = renderRow(
        {},
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      const checkboxDiv = container.querySelector('.wv-checkbox');
      expect(checkboxDiv.className).not.toContain('gray');
    });
  });

  // -------------------------------------------------------------------------
  // Chartable layer notice
  // -------------------------------------------------------------------------
  describe('chartable layer notice', () => {
    it('does not show layer-notices when no analysis and no layerNotices', () => {
      const { container } = renderRow();
      expect(container.querySelector('.layer-notices')).toBeNull();
    });

    it('shows chartable notice when analysis includes Chartable (Raster-based)', () => {
      const chartableLayer = { ...layer, analysis: ['Chartable (Raster-based)'] };
      const { container } = renderRow({ layer: chartableLayer });
      expect(container.querySelector('.chartable-icon')).toBeTruthy();
    });

    it('does not show chartable notice when analysis does not include Chartable', () => {
      const nonChartableLayer = { ...layer, analysis: ['Something else'] };
      const { container } = renderRow({ layer: nonChartableLayer });
      expect(container.querySelector('.chartable-icon')).toBeNull();
    });

    it('sets header class to include "notice" when chartable', () => {
      const chartableLayer = { ...layer, analysis: ['Chartable (Raster-based)'] };
      const { container } = renderRow({ layer: chartableLayer });
      const header = container.querySelector('button.layers-all-header');
      expect(header.className).toContain('notice');
    });
  });

  // -------------------------------------------------------------------------
  // layerNotices
  // -------------------------------------------------------------------------
  describe('layerNotices', () => {
    it('shows exclamation-triangle icon when layerNotices is set', () => {
      const { getLayerNoticesForLayer } = require('../../../../modules/notifications/util');
      getLayerNoticesForLayer.mockReturnValue('<b>Notice!</b>');

      const { getByTestId } = renderRow();
      expect(getByTestId('fa-exclamation-triangle')).toBeTruthy();
    });

    it('does not show exclamation-triangle when layerNotices is null', () => {
      const { queryByTestId } = renderRow();
      expect(queryByTestId('fa-exclamation-triangle')).toBeNull();
    });

    it('sets header class to include "notice" when layerNotices present', () => {
      const { getLayerNoticesForLayer } = require('../../../../modules/notifications/util');
      getLayerNoticesForLayer.mockReturnValue('Some notice');

      const { container } = renderRow();
      const header = container.querySelector('button.layers-all-header');
      expect(header.className).toContain('notice');
    });

    it('header class does not include "notice" when no notices and not chartable', () => {
      const { container } = renderRow();
      const header = container.querySelector('button.layers-all-header');
      expect(header.className).not.toContain('notice');
    });
  });

  // -------------------------------------------------------------------------
  // Delete button (recent layer mode)
  // -------------------------------------------------------------------------
  describe('delete button', () => {
    it('does not render delete button in search mode', () => {
      const { container } = renderRow();
      expect(container.querySelector('.recent-layer-delete')).toBeNull();
    });

    it('does not render delete button in recent mode before hover', () => {
      const { container } = renderRow(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      expect(container.querySelector('.recent-layer-delete')).toBeNull();
    });

    it('shows delete button in recent mode after mouseEnter on non-mobile', () => {
      const { container } = renderRow(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      fireEvent.mouseEnter(row);
      expect(container.querySelector('.recent-layer-delete')).toBeTruthy();
    });

    it('hides delete button after mouseLeave', () => {
      const { container } = renderRow(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      fireEvent.mouseEnter(row);
      fireEvent.mouseLeave(row);
      expect(container.querySelector('.recent-layer-delete')).toBeNull();
    });

    it('does not show delete button on mobile even after hover', () => {
      const { container } = renderRow(
        {},
        {
          productPicker: { selectedLayer: null, categoryType: 'recent' },
          screenSize: { isMobileDevice: true, screenWidth: 375 },
        },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      fireEvent.mouseEnter(row);
      expect(container.querySelector('.recent-layer-delete')).toBeNull();
    });

    it('calls clearSingleRecentLayer with event and layer when delete button clicked', () => {
      const { clearSingleRecentLayer } = require('../../../../modules/product-picker/actions');
      const { container, store } = renderRow(
        {},
        { productPicker: { selectedLayer: null, categoryType: 'recent' } },
      );
      const row = container.querySelector(`#${layer.id}-search-row`);
      fireEvent.mouseEnter(row);
      const deleteBtn = container.querySelector('.recent-layer-delete');
      fireEvent.click(deleteBtn);
      expect(clearSingleRecentLayer).toHaveBeenCalled();
      expect(store.getActions()).toContainEqual({ type: 'CLEAR_RECENT' });
    });
  });

  // -------------------------------------------------------------------------
  // toggleEnabled (checkbox onChange)
  // -------------------------------------------------------------------------
  describe('toggleEnabled', () => {
    it('dispatches addLayer when layer is not enabled and checkbox is changed', () => {
      const { addLayer } = require('../../../../modules/layers/actions');
      const { container, store } = renderRow();
      const checkbox = container.querySelector(`#${layer.id}-checkbox`);
      fireEvent.click(checkbox);
      expect(addLayer).toHaveBeenCalledWith(layer.id);
      expect(store.getActions()).toContainEqual({ type: 'ADD_LAYER' });
    });

    it('dispatches removeLayer when layer is enabled and checkbox is changed', () => {
      const { getActiveLayersMap } = require('../../../../modules/layers/selectors');
      getActiveLayersMap.mockReturnValue({ [layer.id]: true });
      const { removeLayer } = require('../../../../modules/layers/actions');

      const { container, store } = renderRow();
      const checkbox = container.querySelector(`#${layer.id}-checkbox`);
      fireEvent.click(checkbox);
      expect(removeLayer).toHaveBeenCalledWith(layer.id);
      expect(store.getActions()).toContainEqual({ type: 'REMOVE_LAYER' });
    });
  });

  // -------------------------------------------------------------------------
  // onRowClick / toggleShowMetadata
  // -------------------------------------------------------------------------
  describe('onRowClick and toggleShowMetadata', () => {
    it('calls showLayerMetadata with layer.id when no layer is selected', () => {
      const showLayerMetadata = jest.fn();
      const { container } = renderRow({ showLayerMetadata });
      const header = container.querySelector('button.layers-all-header');
      fireEvent.click(header);
      expect(showLayerMetadata).toHaveBeenCalledWith(layer.id);
    });

    it('calls showLayerMetadata(null) when the same layer is already selected', () => {
      const showLayerMetadata = jest.fn();
      const { container } = renderRow(
        { showLayerMetadata },
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      const header = container.querySelector('button.layers-all-header');
      fireEvent.click(header);
      expect(showLayerMetadata).toHaveBeenCalledWith(null);
    });

    it('calls showLayerMetadata with layer.id when a different layer is selected', () => {
      const showLayerMetadata = jest.fn();
      const { container } = renderRow(
        { showLayerMetadata },
        {
          productPicker: {
            selectedLayer: { id: 'OTHER_LAYER' },
            categoryType: 'search',
          },
        },
      );
      const header = container.querySelector('button.layers-all-header');
      fireEvent.click(header);
      expect(showLayerMetadata).toHaveBeenCalledWith(layer.id);
    });

    it('triggers JOYRIDE_INCREMENT event via util.events.trigger after click', async () => {
      jest.useFakeTimers();
      const util = require('../../../../util/util').default;
      const showLayerMetadata = jest.fn();
      const { container } = renderRow({ showLayerMetadata });
      const header = container.querySelector('button.layers-all-header');
      fireEvent.click(header);
      jest.runAllTimers();
      expect(util.events.trigger).toHaveBeenCalledWith('joyride:increment');
      jest.useRealTimers();
    });

    it('calls scrollIntoView via setTimeout when no selectedLayer and scrollIntoView is true', async () => {
      jest.useFakeTimers();
      const showLayerMetadata = jest.fn();
      // screenWidth < 1024 → scrollIntoView prop = true
      const { container } = renderRow(
        { showLayerMetadata },
        { screenSize: { isMobileDevice: false, screenWidth: 800 } },
      );
      const header = container.querySelector('button.layers-all-header');
      fireEvent.click(header);
      jest.runAllTimers();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // componentDidMount: scrollIntoView
  // -------------------------------------------------------------------------
  describe('componentDidMount', () => {
    it('calls scrollIntoView on mount when selectedLayer matches layer', () => {
      renderRow(
        {},
        { productPicker: { selectedLayer: layer, categoryType: 'search' } },
      );
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(true);
    });

    it('does not call scrollIntoView on mount when no selectedLayer', () => {
      renderRow();
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it('does not call scrollIntoView on mount when a different layer is selected', () => {
      renderRow(
        {},
        {
          productPicker: {
            selectedLayer: { id: 'OTHER_LAYER' },
            categoryType: 'search',
          },
        },
      );
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Layer title rendered
  // -------------------------------------------------------------------------
  describe('layer title rendering', () => {
    it('renders RenderSplitLayerTitle with the layer', () => {
      const { getByTestId } = renderRow();
      expect(getByTestId('layer-title').textContent).toBe(layer.id);
    });
  });

  // -------------------------------------------------------------------------
  // Encoded ID usage
  // -------------------------------------------------------------------------
  describe('encodedId usage', () => {
    it('uses encodedId for the row id attribute', () => {
      const util = require('../../../../util/util').default;
      util.encodeId.mockReturnValue('encoded-layer-id');

      const { container } = renderRow();
      expect(container.querySelector('#encoded-layer-id-search-row')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Both chartable + layerNotices simultaneously
  // -------------------------------------------------------------------------
  describe('chartable + layerNotices together', () => {
    it('shows both chartable icon and exclamation-triangle when both present', () => {
      const { getLayerNoticesForLayer } = require('../../../../modules/notifications/util');
      getLayerNoticesForLayer.mockReturnValue('Important notice');

      const chartableLayer = { ...layer, analysis: ['Chartable (Raster-based)'] };
      const { container, getByTestId } = renderRow({ layer: chartableLayer });
      expect(container.querySelector('.chartable-icon')).toBeTruthy();
      expect(getByTestId('fa-exclamation-triangle')).toBeTruthy();
    });
  });
});
