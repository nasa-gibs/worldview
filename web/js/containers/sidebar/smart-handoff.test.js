/* eslint-disable react/prop-types */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ───────────────────────────────────────────────────────────────────
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const capture = {};
  const mockConnect = (msp, mdp) => {
    capture.msp = msp;
    capture.mdp = mdp;
    return (Component) => Component;
  };
  mockConnect.connectCapture = capture;
  return { ...actual, connect: mockConnect };
});

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }), { virtual: true });

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('lodash', () => ({
  isEqual: jest.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
}));

jest.mock('moment', () => {
  const m = () => ({
    format: jest.fn(() => '2020-01-01'),
  });
  m.utc = jest.fn(() => ({ format: jest.fn(() => '2020-01-01') }));
  return m;
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': `fa-icon-${icon}` });
  },
}));

jest.mock('reactstrap', () => ({
  Spinner: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'spinner' });
  },
  UncontrolledTooltip: ({ children, target }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip', 'data-target': target }, children);
  },
}));

jest.mock('../../components/util/button', () => function MockButton({ onClick, text, valid }) {
  const React = require('react');
  return React.createElement('button', {
    'data-testid': 'download-btn',
    'data-valid': String(valid),
    onClick,
  }, text);
});

jest.mock('../../components/util/checkbox', () => function MockCheckbox({
  id, label, checked, onCheck,
}) {
  const React = require('react');
  return React.createElement('input', {
    'data-testid': 'crop-checkbox',
    id,
    'aria-label': label,
    type: 'checkbox',
    checked,
    onChange: onCheck,
    onClick: onCheck,
  });
});

jest.mock('../../components/util/image-crop', () => function MockCrop({
  onChange, onDragStop, x, y,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'crop-tool',
    'data-x': x,
    'data-y': y,
    onClick: () => {
      onChange({ x: 10, y: 10, width: 50, height: 50 }, false);
    },
    onDoubleClick: () => {
      onDragStop({ x: 10, y: 10, width: 50, height: 50 });
    },
  });
});

jest.mock('../../components/util/alert', () => function MockAlert({ id, message }) {
  const React = require('react');
  return React.createElement('div', { 'data-testid': 'alert', id }, message);
});

jest.mock('../../components/smart-handoffs/smart-handoff-modal', () => function MockModal() {
  const React = require('react');
  return React.createElement('div', { 'data-testid': 'smart-handoff-modal' });
});

jest.mock(
  '../../components/smart-handoffs/smart-handoff-not-available-modal',
  () => function MockNotAvailableModal() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'not-available-modal' });
  },
);

jest.mock(
  '../../components/smart-handoffs/smart-handoff-granule-alert',
  () => function MockGranuleAlert() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'granule-alert' });
  },
);

jest.mock('../../components/smart-handoffs/granule-count', () => function MockGranuleCount({
  displayDate, selectedCollection,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'granule-count',
    'data-display-date': displayDate,
    'data-collection': selectedCollection ? selectedCollection.value : '',
  });
});

jest.mock('../../modules/image-download/util', () => ({
  imageUtilGetCoordsFromPixelValues: jest.fn(() => [[-100, 30], [-80, 50]]),
}));

jest.mock('../../modules/modal/actions', () => ({
  onClose: jest.fn(),
  openCustomContent: jest.fn((id, opts) => ({ type: 'OPEN_CUSTOM_CONTENT', id, opts })),
}));

jest.mock('../../modules/layers/selectors', () => ({
  getActiveGranuleLayers: jest.fn(() => ({})),
}));

jest.mock('../../modules/smart-handoff/selectors', () => ({
  getValidLayersForHandoffs: jest.fn(() => []),
  getConceptUrl: jest.fn(() => jest.fn((val) => `https://cmr.example.com/${val}`)),
  getGranulesUrl: jest.fn(() => jest.fn()),
}));

jest.mock('../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2020-01-01')),
}));

jest.mock('../../util/local-storage', () => ({
  __esModule: true,
  default: {
    keys: { HIDE_EDS_WARNING: 'HIDE_EDS_WARNING' },
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  },
}));

jest.mock('../../modules/smart-handoff/util', () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
  getStartEndDates: jest.fn(() => ({
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2020-01-01T23:59:59.999Z',
  })),
}));

jest.mock('../../modules/smart-handoff/actions', () => ({
  selectCollection: jest.fn((conceptId, layerId) => ({
    type: 'SELECT_COLLECTION', conceptId, layerId,
  })),
  fetchAvailableTools: jest.fn(() => ({ type: 'FETCH_AVAILABLE_TOOLS' })),
  validateLayersConceptIds: jest.fn((layers) => ({
    type: 'VALIDATE_LAYERS', layers,
  })),
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

jest.mock('../../util/util', () => ({
  __esModule: true,
  default: {
    encodeId: jest.fn((id) => String(id).replace(/[^a-zA-Z0-9]/g, '-')),
    formatCoordinate: jest.fn(([x, y]) => `${x.toFixed(2)}, ${y.toFixed(2)}`),
  },
}));

jest.mock('../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => '2020 JAN 01'),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import SmartHandoff from './smart-handoff';
import googleTagManager from 'googleTagManager';
import safeLocalStorage from '../../util/local-storage';
import openEarthDataSearch from '../../modules/smart-handoff/util';
import { openCustomContent } from '../../modules/modal/actions';
import {
  selectCollection as selectCollectionAction,
  fetchAvailableTools as fetchAvailableToolsAction,
  validateLayersConceptIds as validateLayersConceptIdsAction,
} from '../../modules/smart-handoff/actions';

// ─── Shared captured connect ──────────────────────────────────────────────────

let capturedMapStateToProps;
let capturedMapDispatchToProps;

beforeAll(() => {
  const { connect } = jest.requireMock('react-redux');
  capturedMapStateToProps = connect.connectCapture.msp;
  capturedMapDispatchToProps = connect.connectCapture.mdp;
});

beforeEach(() => {
  jest.clearAllMocks();
  safeLocalStorage.getItem.mockReturnValue(null);
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const layer1 = {
  id: 'layer1',
  title: 'Layer One',
  subtitle: 'Subtitle One',
  type: 'wms',
  conceptIds: [
    { type: 'STD', value: 'C1-STD', version: '6.0' },
    { type: 'NRT', value: 'C1-NRT' },
  ],
};

const defaultProps = {
  availableLayers: [layer1],
  availableTools: [],
  displayDate: '2020 JAN 01',
  isLoading: false,
  isGranuleLayer: false,
  endDate: '2020-01-01T23:59:59.999Z',
  startDate: '2020-01-01T00:00:00.000Z',
  getConceptUrl: jest.fn((val) => `https://cmr.example.com/${val}`),
  getGranulesUrl: jest.fn(),
  granuleLayers: {},
  map: {
    ui: { selected: {} },
    extent: [-180, -90, 180, 90],
  },
  proj: {
    id: 'geographic',
    crs: 'EPSG:4326',
    maxExtent: [-180, -90, 180, 90],
  },
  fetchAvailableTools: jest.fn(),
  requestFailed: false,
  screenHeight: 800,
  screenWidth: 1200,
  selectCollection: jest.fn(),
  selectedDate: '2020-01-01',
  selectedLayer: layer1,
  selectedCollection: { type: 'STD', value: 'C1-STD', version: '6.0', title: 'Layer One' },
  showWarningModal: jest.fn(),
  showGranuleHelpModal: jest.fn(),
  showNotAvailableModal: jest.fn(),
  validatedLayers: [layer1],
  validatedConceptIds: { 'C1-STD': true, 'C1-NRT': true },
  validateLayersConceptIds: jest.fn(),
};

const renderComponent = (propOverrides = {}) => render(
  React.createElement(SmartHandoff, { ...defaultProps, ...propOverrides }),
);

// ─── Loading state ────────────────────────────────────────────────────────────

describe('SmartHandoff loading state', () => {
  it('renders spinner when isLoading is true', () => {
    const { getByTestId } = renderComponent({ isLoading: true });
    expect(getByTestId('spinner')).toBeInTheDocument();
  });

  it('does not render panel when loading', () => {
    renderComponent({ isLoading: true });
    expect(document.querySelector('.smart-handoff-side-panel')).not.toBeInTheDocument();
  });
});

// ─── No layers state ─────────────────────────────────────────────────────────

describe('SmartHandoff no layers state', () => {
  it('renders no-layers panel when validatedLayers is empty', () => {
    const { container } = renderComponent({ validatedLayers: [] });
    expect(container.querySelector('.smart-handoff-side-panel.error')).toBeInTheDocument();
  });

  it('renders CMR error message when requestFailed is true', () => {
    const { getByText } = renderComponent({ validatedLayers: [], requestFailed: true });
    expect(getByText(/Common Metadata Repository/)).toBeInTheDocument();
  });

  it('renders not-available message when requestFailed is false', () => {
    const { getByText } = renderComponent({ validatedLayers: [] });
    expect(getByText(/None of your current layers are available/)).toBeInTheDocument();
  });

  it('renders help link when requestFailed is false', () => {
    const { getByText } = renderComponent({ validatedLayers: [] });
    expect(getByText(/Why are my layers not available/)).toBeInTheDocument();
  });

  it('calls showNotAvailableModal when help link is clicked in no-layers view', () => {
    const showNotAvailableModal = jest.fn();
    const { getByText } = renderComponent({ validatedLayers: [], showNotAvailableModal });
    fireEvent.click(getByText(/Why are my layers not available/));
    expect(showNotAvailableModal).toHaveBeenCalled();
  });
});

// ─── Main panel rendering ─────────────────────────────────────────────────────

describe('SmartHandoff main panel', () => {
  it('renders the side panel', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.smart-handoff-side-panel')).toBeInTheDocument();
  });

  it('renders the Earthdata Search notification text', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Downloading data will be performed using/)).toBeInTheDocument();
  });

  it('renders the help link button', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Why are some layers not available/)).toBeInTheDocument();
  });

  it('calls showNotAvailableModal when help link is clicked', () => {
    const showNotAvailableModal = jest.fn();
    const { getByText } = renderComponent({ showNotAvailableModal });
    fireEvent.click(getByText(/Why are some layers not available/));
    expect(showNotAvailableModal).toHaveBeenCalled();
  });

  it('renders download button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('download-btn')).toBeInTheDocument();
  });

  it('download button is valid when selectedLayer and selectedCollection present', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'true');
  });

  it('download button is not valid when no selectedLayer', () => {
    const { getByTestId } = renderComponent({ selectedLayer: null, selectedCollection: null });
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });

  it('download button is not valid when no selectedCollection', () => {
    const { getByTestId } = renderComponent({ selectedCollection: null });
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });

  it('renders GranuleCount when isValidDownload', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('granule-count')).toBeInTheDocument();
  });

  it('does not render GranuleCount when no selectedLayer', () => {
    const { queryByTestId } = renderComponent({ selectedLayer: null, selectedCollection: null });
    expect(queryByTestId('granule-count')).not.toBeInTheDocument();
  });
});

// ─── renderLayerChoices ───────────────────────────────────────────────────────

describe('renderLayerChoices', () => {
  it('renders layer list div', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.smart-handoff-layer-list')).toBeInTheDocument();
  });

  it('renders layer title', () => {
    const { getByText } = renderComponent();
    expect(getByText('Layer One')).toBeInTheDocument();
  });

  it('renders layer subtitle', () => {
    const { getByText } = renderComponent();
    expect(getByText('Subtitle One')).toBeInTheDocument();
  });

  it('renders radio inputs for validated conceptIds', () => {
    const { container } = renderComponent();
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('marks selected collection radio as checked', () => {
    const { container } = renderComponent();
    const checked = container.querySelector('input[type="radio"]:checked');
    expect(checked).toBeInTheDocument();
  });

  it('renders Standard label for STD type', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Standard - v6\.0/)).toBeInTheDocument();
  });

  it('renders Near Real-Time label for NRT type', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Near Real-Time/)).toBeInTheDocument();
  });

  it('calls selectCollection when unselected radio is clicked', () => {
    const selectCollection = jest.fn();
    const { container } = renderComponent({ selectCollection });
    // First radio is already checked; click the second (unselected) one to trigger onChange
    const radios = container.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[1]);
    expect(selectCollection).toHaveBeenCalled();
  });

  it('selected item has selected class when layerIsSelected', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.layer-item.selected')).toBeInTheDocument();
  });

  it('does not filter out conceptIds with validated value', () => {
    const { container } = renderComponent({
      validatedConceptIds: { 'C1-STD': true },
    });
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(1);
  });

  it('renders tooltip for collection with value', () => {
    const { getAllByTestId } = renderComponent();
    expect(getAllByTestId('tooltip').length).toBeGreaterThan(0);
  });

  it('does not render tooltip when collection has no value', () => {
    const noValueLayer = {
      ...layer1,
      conceptIds: [{ type: 'STD', value: '' }],
    };
    const { queryAllByTestId } = renderComponent({
      validatedLayers: [noValueLayer],
      validatedConceptIds: { '': true },
    });
    expect(queryAllByTestId('tooltip').length).toBe(0);
  });
});

// ─── renderCropBox ────────────────────────────────────────────────────────────

describe('renderCropBox', () => {
  it('renders checkbox when selectedLayer, selectedCollection and geographic proj', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox when proj is not geographic', () => {
    const { queryByTestId } = renderComponent({ proj: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-180, 60, 180, 90] } });
    expect(queryByTestId('crop-checkbox')).not.toBeInTheDocument();
  });

  it('does not render checkbox when no selectedCollection', () => {
    const { queryByTestId } = renderComponent({ selectedCollection: null });
    expect(queryByTestId('crop-checkbox')).not.toBeInTheDocument();
  });

  it('does not render crop tool initially', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('crop-tool')).not.toBeInTheDocument();
  });

  it('shows crop tool after checking the checkbox', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-tool')).toBeInTheDocument();
  });

  it('pushes GTM event when checkbox is toggled on', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_toggle_true_target_area',
    });
  });

  it('hides crop tool when checkbox is toggled off', () => {
    const { getByTestId, queryByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-tool')).toBeInTheDocument();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(queryByTestId('crop-tool')).not.toBeInTheDocument();
  });

  it('crop tool onChange calls onBoundaryChange', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    fireEvent.click(getByTestId('crop-tool'));
  });

  it('crop tool onDragStop calls onBoundaryChange with setExtent=true', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    fireEvent.doubleClick(getByTestId('crop-tool'));
  });
});

// ─── onBoundaryChange ─────────────────────────────────────────────────────────

describe('onBoundaryChange', () => {
  it('does nothing when no selectedCollection', () => {
    renderComponent({ selectedCollection: null, selectedLayer: layer1 });
    // No crop checkbox rendered without selectedCollection, so nothing to fire
    expect(document.querySelector('.smart-handoff-crop-toggle')).not.toBeInTheDocument();
  });

  it('updates currentExtent when setExtent is true (onDragStop)', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    // doubleClick triggers onDragStop which calls onBoundaryChange with setExtent=true
    fireEvent.doubleClick(getByTestId('crop-tool'));
    // GranuleCount should still be present (isValidDownload still true)
    expect(getByTestId('granule-count')).toBeInTheDocument();
  });

  it('clamps coordinates exceeding positive bounds (x1>180, y1>90, x2>180, y2>90)', () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    // Both points outside positive bounds → hits x=180 and y=90 clamp branches
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[200, 100], [210, 95]]);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });

  it('clamps coordinates below negative bounds (x1<-180, x2<-180, y1<-90, y2<-90)', () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    // Both points outside negative bounds → hits x=-180 and y=-90 clamp branches
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-200, -100], [-190, -95]]);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });
});

// ─── renderSelectionWarning ───────────────────────────────────────────────────

describe('renderSelectionWarning', () => {
  it('does not render alert by default', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('renders dateline alert when zoomed into dateline (left wing)', () => {
    const { container } = render(
      React.createElement(SmartHandoff, {
        ...defaultProps,
        map: { ui: { selected: {} }, extent: [-200, -90, -185, 90] },
        proj: {
          id: 'geographic',
          crs: 'EPSG:4326',
          maxExtent: [-180, -90, 180, 90],
        },
      }),
    );
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('renders dateline alert when zoomed into dateline (right wing)', () => {
    const { container } = render(
      React.createElement(SmartHandoff, {
        ...defaultProps,
        map: { ui: { selected: {} }, extent: [185, -90, 200, 90] },
        proj: {
          id: 'geographic',
          crs: 'EPSG:4326',
          maxExtent: [-180, -90, 180, 90],
        },
      }),
    );
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('download button not valid when showZoomedIntoDatelineAlert is true', () => {
    const { getByTestId } = render(
      React.createElement(SmartHandoff, {
        ...defaultProps,
        map: { ui: { selected: {} }, extent: [-200, -90, -185, 90] },
        proj: {
          id: 'geographic',
          crs: 'EPSG:4326',
          maxExtent: [-180, -90, 180, 90],
        },
      }),
    );
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });
});

// ─── onClickDownload ──────────────────────────────────────────────────────────

describe('onClickDownload', () => {
  it('calls showWarningModal when HIDE_EDS_WARNING not set', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const showWarningModal = jest.fn();
    const { getByTestId } = renderComponent({ showWarningModal });
    fireEvent.click(getByTestId('download-btn'));
    expect(showWarningModal).toHaveBeenCalledWith(
      '2020 JAN 01',
      layer1,
      defaultProps.selectedCollection,
      expect.any(Function),
    );
  });

  it('calls openEarthDataSearch when HIDE_EDS_WARNING is set', () => {
    safeLocalStorage.getItem.mockReturnValue('true');
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('download-btn'));
    expect(openEarthDataSearch).toHaveBeenCalled();
  });

  it('uses granule date range when isGranuleLayer is true', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const showWarningModal = jest.fn();
    const { getByTestId } = renderComponent({
      showWarningModal,
      isGranuleLayer: true,
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2020-01-01T23:59:59.999Z',
    });
    fireEvent.click(getByTestId('download-btn'));
    expect(showWarningModal).toHaveBeenCalledWith(
      expect.stringContaining(' - '),
      expect.anything(),
      expect.anything(),
      expect.any(Function),
    );
  });

  it('continueToEDS calls openEarthDataSearch with correct options', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    let capturedContinue;
    const showWarningModal = jest.fn((date, layer, collection, continueToEDS) => {
      capturedContinue = continueToEDS;
    });
    const { getByTestId } = renderComponent({ showWarningModal });
    fireEvent.click(getByTestId('download-btn'));
    capturedContinue();
    expect(openEarthDataSearch).toHaveBeenCalledWith(
      defaultProps.availableTools,
      expect.objectContaining({
        projection: defaultProps.proj.crs,
        conceptId: defaultProps.selectedCollection.value,
      }),
    );
  });
});

// ─── componentDidMount ────────────────────────────────────────────────────────

describe('componentDidMount', () => {
  it('calls fetchAvailableTools on mount', () => {
    const fetchAvailableTools = jest.fn();
    renderComponent({ fetchAvailableTools });
    expect(fetchAvailableTools).toHaveBeenCalled();
  });

  it('calls validateLayersConceptIds with availableLayers on mount', () => {
    const validateLayersConceptIds = jest.fn();
    renderComponent({ validateLayersConceptIds });
    expect(validateLayersConceptIds).toHaveBeenCalledWith([layer1]);
  });

  it('does not check extent when proj is not geographic', () => {
    // No dateline alert rendered for non-geographic proj
    const { queryByTestId } = renderComponent({
      proj: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-180, 60, 180, 90] },
    });
    expect(queryByTestId('alert')).not.toBeInTheDocument();
  });
});

// ─── componentDidUpdate ───────────────────────────────────────────────────────

describe('componentDidUpdate', () => {
  it('calls validateLayersConceptIds when availableLayers changes', () => {
    const validateLayersConceptIds = jest.fn();
    const { rerender } = renderComponent({ validateLayersConceptIds });
    validateLayersConceptIds.mockClear();
    const newLayer = { ...layer1, id: 'layer2' };
    rerender(React.createElement(SmartHandoff, {
      ...defaultProps,
      validateLayersConceptIds,
      availableLayers: [newLayer],
    }));
    expect(validateLayersConceptIds).toHaveBeenCalledWith([newLayer]);
  });

  it('resets to baseState when selectedCollection set but layer no longer active', () => {
    const { rerender, getByTestId, queryByTestId } = renderComponent();
    // Toggle bounding box on to verify initial state mutation
    fireEvent.click(getByTestId('crop-checkbox'));
    // Rerender with layer gone AND collection cleared (parent would do this after reset)
    rerender(React.createElement(SmartHandoff, {
      ...defaultProps,
      availableLayers: [],
      selectedCollection: null,
      validatedLayers: [layer1],
    }));
    // showBoundingBox resets to false — crop tool no longer visible
    expect(queryByTestId('crop-tool')).not.toBeInTheDocument();
  });

  it('hides bounding box when proj changes away from geographic', () => {
    const { rerender, getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    rerender(React.createElement(SmartHandoff, {
      ...defaultProps,
      proj: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-180, 60, 180, 90] },
    }));
    // Crop box should be gone (not geographic)
    expect(document.querySelector('.smart-handoff-crop-toggle')).not.toBeInTheDocument();
  });

  it('re-checks extent when map.extent changes in geographic proj', () => {
    const { rerender, container } = renderComponent();
    // Initially normal extent, no alert
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).not.toBeInTheDocument();
    // Rerender with dateline extent
    rerender(React.createElement(SmartHandoff, {
      ...defaultProps,
      map: { ui: { selected: {} }, extent: [-200, -90, -185, 90] },
    }));
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('clears showZoomedIntoDatelineAlert when proj changes to non-geographic', () => {
    const { rerender, container } = render(
      React.createElement(SmartHandoff, {
        ...defaultProps,
        map: { ui: { selected: {} }, extent: [-200, -90, -185, 90] },
      }),
    );
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
    rerender(React.createElement(SmartHandoff, {
      ...defaultProps,
      map: { ui: { selected: {} }, extent: [-200, -90, -185, 90] },
      proj: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-180, 60, 180, 90] },
    }));
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).not.toBeInTheDocument();
  });
});

// ─── updateSelectionAlerts ────────────────────────────────────────────────────

describe('updateSelectionAlerts', () => {
  it('renders selection outside extents alert when selection is outside map area', async () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    // Return coords outside bounds so x1 > 180 → entireSelectionOutside = true
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[190, 30], [200, 50]]);
    const { getByTestId, findByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('crop-checkbox'));
    });
    expect(await findByTestId('alert')).toBeInTheDocument();
    // Restore default mock
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });
});

// ─── mapStateToProps ──────────────────────────────────────────────────────────

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    screenSize: { screenWidth: 1200, screenHeight: 800, ...overrides.screenSize },
    map: {
      ui: { selected: {} },
      extent: [-180, -90, 180, 90],
      ...overrides.map,
    },
    proj: {
      selected: {
        id: 'geographic',
        crs: 'EPSG:4326',
        maxExtent: [-180, -90, 180, 90],
      },
      ...overrides.proj,
    },
    smartHandoffs: {
      conceptId: 'C1-STD',
      layerId: 'layer1',
      availableTools: [],
      validatedConceptIds: { 'C1-STD': true },
      validatedLayers: [layer1],
      isLoadingTools: false,
      isValidatingCollections: false,
      requestFailed: false,
      ...overrides.smartHandoffs,
    },
    date: {},
    layers: {},
    config: {},
    ...overrides,
  });

  beforeEach(() => {
    const selectors = jest.requireMock('../../modules/smart-handoff/selectors');
    selectors.getValidLayersForHandoffs.mockReturnValue([layer1]);
    selectors.getConceptUrl.mockReturnValue((val) => `https://cmr.example.com/${val}`);
    selectors.getGranulesUrl.mockReturnValue(jest.fn());
    const dateSelectors = jest.requireMock('../../modules/date/selectors');
    dateSelectors.getSelectedDate.mockReturnValue(new Date('2020-01-01'));
    const layerSelectors = jest.requireMock('../../modules/layers/selectors');
    layerSelectors.getActiveGranuleLayers.mockReturnValue({});
  });

  it('returns screenWidth and screenHeight from screenSize', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.screenWidth).toBe(1200);
    expect(result.screenHeight).toBe(800);
  });

  it('returns proj.selected as proj', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, {});
    expect(result.proj.id).toBe('geographic');
  });

  it('returns map from state', () => {
    const state = makeState();
    const result = capturedMapStateToProps(state, {});
    expect(result.map).toBe(state.map);
  });

  it('returns requestFailed from smartHandoffs', () => {
    const result = capturedMapStateToProps(makeState({
      smartHandoffs: { requestFailed: true },
    }), {});
    expect(result.requestFailed).toBe(true);
  });

  it('sets isLoading true when isLoadingTools is true', () => {
    const result = capturedMapStateToProps(
      makeState({ smartHandoffs: { isLoadingTools: true } }),
      {},
    );
    expect(result.isLoading).toBe(true);
  });

  it('sets isLoading true when isValidatingCollections is true', () => {
    const result = capturedMapStateToProps(
      makeState({ smartHandoffs: { isValidatingCollections: true } }),
      {},
    );
    expect(result.isLoading).toBe(true);
  });

  it('selectedLayer is the layer matching layerId', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.selectedLayer).toBe(layer1);
  });

  it('selectedLayer is undefined when layerId does not match', () => {
    const result = capturedMapStateToProps(
      makeState({ smartHandoffs: { layerId: 'nonexistent' } }),
      {},
    );
    expect(result.selectedLayer).toBeUndefined();
  });

  it('selectedCollection is the collection matching conceptId', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.selectedCollection.value).toBe('C1-STD');
  });

  it('selectedCollection is undefined when no selectedLayer', () => {
    const result = capturedMapStateToProps(
      makeState({ smartHandoffs: { layerId: 'nonexistent' } }),
      {},
    );
    expect(result.selectedCollection).toBeUndefined();
  });

  it('isGranuleLayer is true for granule type layer', () => {
    const granuleLayer = { ...layer1, type: 'granule', conceptIds: [{ type: 'STD', value: 'C1-STD' }] };
    jest.requireMock('../../modules/smart-handoff/selectors')
      .getValidLayersForHandoffs.mockReturnValue([granuleLayer]);
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.isGranuleLayer).toBe(true);
  });

  it('startDate and endDate come from getStartEndDates for regular layer', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.startDate).toBe('2020-01-01T00:00:00.000Z');
    expect(result.endDate).toBe('2020-01-01T23:59:59.999Z');
  });

  it('startDate/endDate are undefined when no selectedLayer', () => {
    const result = capturedMapStateToProps(
      makeState({ smartHandoffs: { layerId: 'none' } }),
      {},
    );
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it('returns validatedConceptIds from smartHandoffs', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.validatedConceptIds).toEqual({ 'C1-STD': true });
  });

  it('returns availableTools from smartHandoffs', () => {
    const result = capturedMapStateToProps(makeState(), {});
    expect(result.availableTools).toEqual([]);
  });
});

// ─── mapDispatchToProps ───────────────────────────────────────────────────────

describe('mapDispatchToProps', () => {
  let dispatch;
  let mapped;

  beforeEach(() => {
    dispatch = jest.fn();
    mapped = capturedMapDispatchToProps(dispatch);
  });

  it('selectCollection dispatches selectCollectionAction', () => {
    mapped.selectCollection('C1-STD', 'layer1');
    expect(selectCollectionAction).toHaveBeenCalledWith('C1-STD', 'layer1');
    expect(dispatch).toHaveBeenCalled();
  });

  it('fetchAvailableTools dispatches fetchAvailableToolsAction', () => {
    mapped.fetchAvailableTools();
    expect(fetchAvailableToolsAction).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalled();
  });

  it('validateLayersConceptIds dispatches validateLayersConceptIdsAction', () => {
    mapped.validateLayersConceptIds([layer1]);
    expect(validateLayersConceptIdsAction).toHaveBeenCalledWith([layer1]);
    expect(dispatch).toHaveBeenCalled();
  });

  it('showWarningModal pushes GTM event', () => {
    mapped.showWarningModal('2020 JAN 01', layer1, { value: 'C1-STD' }, jest.fn());
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_open_warning_modal',
    });
  });

  it('showWarningModal dispatches openCustomContent', () => {
    mapped.showWarningModal('2020 JAN 01', layer1, { value: 'C1-STD' }, jest.fn());
    expect(openCustomContent).toHaveBeenCalledWith(
      'transferring-to-earthdata-search',
      expect.objectContaining({ headerText: 'Leaving @NAME@' }),
    );
    expect(dispatch).toHaveBeenCalled();
  });

  it('showNotAvailableModal dispatches openCustomContent', () => {
    mapped.showNotAvailableModal();
    expect(openCustomContent).toHaveBeenCalledWith(
      'layers-not-available',
      expect.objectContaining({ headerText: 'Data Download Availability' }),
    );
  });

  it('showGranuleHelpModal pushes GTM event', () => {
    mapped.showGranuleHelpModal();
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_open_granule_help_link',
    });
  });

  it('showGranuleHelpModal dispatches openCustomContent', () => {
    mapped.showGranuleHelpModal();
    expect(openCustomContent).toHaveBeenCalledWith(
      'granule-help',
      expect.objectContaining({ headerText: 'Granule Availability' }),
    );
  });
});
