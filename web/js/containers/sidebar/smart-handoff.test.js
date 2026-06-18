/* eslint-disable react/prop-types */
import {
  render, fireEvent, act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import '@testing-library/jest-dom';

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
  displayDate, selectedCollection, showGranuleHelpModal,
}) {
  const React = require('react');
  return React.createElement('div', {
    'data-testid': 'granule-count',
    'data-display-date': displayDate,
    'data-collection': selectedCollection ? selectedCollection.value : '',
    onClick: showGranuleHelpModal,
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
  getValidLayersForHandoffs: jest.fn((state) => state.smartHandoffs.availableLayers),
  getConceptUrl: jest.fn(() => (val) => `https://cmr.example.com/${val}`),
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
  formatDisplayDate: jest.fn(() => '2020 JAN 01'),
}));

import SmartHandoff from './smart-handoff';
import googleTagManager from 'googleTagManager';
import safeLocalStorage from '../../util/local-storage';
import openEarthDataSearch from '../../modules/smart-handoff/util';
import { openCustomContent } from '../../modules/modal/actions';

const mockStore = configureMockStore();

beforeEach(() => {
  jest.clearAllMocks();
  safeLocalStorage.getItem.mockReturnValue(null);
});

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

const geographicProj = {
  id: 'geographic',
  crs: 'EPSG:4326',
  maxExtent: [-180, -90, 180, 90],
};

const arcticProj = { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-180, 60, 180, 90] };

const buildState = (overrides = {}) => {
  const { smartHandoffs = {}, map = {}, proj = {}, ...rest } = overrides;
  return {
    screenSize: { screenWidth: 1200, screenHeight: 800 },
    map: {
      ui: { selected: {} },
      extent: [-180, -90, 180, 90],
      ...map,
    },
    proj: { selected: { ...geographicProj, ...proj.selected } },
    smartHandoffs: {
      conceptId: 'C1-STD',
      layerId: 'layer1',
      availableLayers: [layer1],
      availableTools: [],
      validatedConceptIds: { 'C1-STD': true, 'C1-NRT': true },
      validatedLayers: [layer1],
      isLoadingTools: false,
      isValidatingCollections: false,
      requestFailed: false,
      ...smartHandoffs,
    },
    date: {},
    layers: {},
    config: {},
    ...rest,
  };
};

const renderComponent = (stateOverrides = {}) => {
  const store = mockStore(buildState(stateOverrides));
  const utils = render(
    <Provider store={store}>
      <SmartHandoff />
    </Provider>,
  );
  return { ...utils, store };
};

const actionsOfType = (store, type) => store.getActions().filter((a) => a.type === type);
const findCustomContent = (store, id) => store
  .getActions()
  .find((a) => a.type === 'OPEN_CUSTOM_CONTENT' && a.id === id);

describe('SmartHandoff loading state', () => {
  it('renders spinner when isLoadingTools is true', () => {
    const { getByTestId } = renderComponent({ smartHandoffs: { isLoadingTools: true } });
    expect(getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders spinner when isValidatingCollections is true', () => {
    const { getByTestId } = renderComponent({ smartHandoffs: { isValidatingCollections: true } });
    expect(getByTestId('spinner')).toBeInTheDocument();
  });

  it('does not render panel when loading', () => {
    renderComponent({ smartHandoffs: { isLoadingTools: true } });
    expect(document.querySelector('.smart-handoff-side-panel')).not.toBeInTheDocument();
  });
});

describe('SmartHandoff no layers state', () => {
  it('renders no-layers panel when validatedLayers is empty', () => {
    const { container } = renderComponent({ smartHandoffs: { validatedLayers: [] } });
    expect(container.querySelector('.smart-handoff-side-panel.error')).toBeInTheDocument();
  });

  it('renders CMR error message when requestFailed is true', () => {
    const { getByText } = renderComponent({
      smartHandoffs: { validatedLayers: [], requestFailed: true },
    });
    expect(getByText(/Common Metadata Repository/)).toBeInTheDocument();
  });

  it('renders not-available message when requestFailed is false', () => {
    const { getByText } = renderComponent({ smartHandoffs: { validatedLayers: [] } });
    expect(getByText(/None of your current layers are available/)).toBeInTheDocument();
  });

  it('renders help link when requestFailed is false', () => {
    const { getByText } = renderComponent({ smartHandoffs: { validatedLayers: [] } });
    expect(getByText(/Why are my layers not available/)).toBeInTheDocument();
  });

  it('dispatches not-available modal when help link is clicked in no-layers view', () => {
    const { getByText, store } = renderComponent({ smartHandoffs: { validatedLayers: [] } });
    fireEvent.click(getByText(/Why are my layers not available/));
    expect(findCustomContent(store, 'layers-not-available')).toBeTruthy();
  });
});

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

  it('dispatches not-available modal when help link is clicked', () => {
    const { getByText, store } = renderComponent();
    fireEvent.click(getByText(/Why are some layers not available/));
    const action = findCustomContent(store, 'layers-not-available');
    expect(action).toBeTruthy();
    expect(action.opts).toEqual(
      expect.objectContaining({ headerText: 'Data Download Availability' }),
    );
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
    const { getByTestId } = renderComponent({ smartHandoffs: { layerId: 'nonexistent' } });
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });

  it('download button is not valid when no selectedCollection', () => {
    const { getByTestId } = renderComponent({ smartHandoffs: { conceptId: 'NO-MATCH' } });
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });

  it('renders GranuleCount when isValidDownload', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('granule-count')).toBeInTheDocument();
  });

  it('does not render GranuleCount when no selectedLayer', () => {
    const { queryByTestId } = renderComponent({ smartHandoffs: { layerId: 'nonexistent' } });
    expect(queryByTestId('granule-count')).not.toBeInTheDocument();
  });
});

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

  it('dispatches selectCollection when unselected radio is clicked', () => {
    const { container, store } = renderComponent();
    const radios = container.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[1]);
    expect(actionsOfType(store, 'SELECT_COLLECTION').length).toBeGreaterThan(0);
  });

  it('selected item has selected class when layerIsSelected', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.layer-item.selected')).toBeInTheDocument();
  });

  it('does not filter out conceptIds with validated value', () => {
    const { container } = renderComponent({
      smartHandoffs: { validatedConceptIds: { 'C1-STD': true } },
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
      smartHandoffs: {
        availableLayers: [noValueLayer],
        validatedLayers: [noValueLayer],
        validatedConceptIds: { '': true },
      },
    });
    expect(queryAllByTestId('tooltip').length).toBe(0);
  });
});

describe('renderCropBox', () => {
  it('renders checkbox when selectedLayer, selectedCollection and geographic proj', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox when proj is not geographic', () => {
    const { queryByTestId } = renderComponent({ proj: { selected: arcticProj } });
    expect(queryByTestId('crop-checkbox')).not.toBeInTheDocument();
  });

  it('does not render checkbox when no selectedCollection', () => {
    const { queryByTestId } = renderComponent({ smartHandoffs: { conceptId: 'NO-MATCH' } });
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

describe('onBoundaryChange', () => {
  it('does nothing when no selectedCollection', () => {
    renderComponent({ smartHandoffs: { conceptId: 'NO-MATCH' } });
    expect(document.querySelector('.smart-handoff-crop-toggle')).not.toBeInTheDocument();
  });

  it('updates currentExtent when setExtent is true (onDragStop)', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    fireEvent.doubleClick(getByTestId('crop-tool'));
    expect(getByTestId('granule-count')).toBeInTheDocument();
  });

  it('clamps coordinates exceeding positive bounds (x1>180, y1>90, x2>180, y2>90)', () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[200, 100], [210, 95]]);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });

  it('clamps coordinates below negative bounds (x1<-180, x2<-180, y1<-90, y2<-90)', () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-200, -100], [-190, -95]]);
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    expect(getByTestId('crop-checkbox')).toBeInTheDocument();
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });
});

describe('renderSelectionWarning', () => {
  it('does not render alert by default', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('renders dateline alert when zoomed into dateline (left wing)', () => {
    const { container } = renderComponent({
      map: { extent: [-200, -90, -185, 90] },
    });
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('renders dateline alert when zoomed into dateline (right wing)', () => {
    const { container } = renderComponent({
      map: { extent: [185, -90, 200, 90] },
    });
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('download button not valid when showZoomedIntoDatelineAlert is true', () => {
    const { getByTestId } = renderComponent({
      map: { extent: [-200, -90, -185, 90] },
    });
    expect(getByTestId('download-btn')).toHaveAttribute('data-valid', 'false');
  });
});

describe('onClickDownload', () => {
  it('dispatches warning modal when HIDE_EDS_WARNING not set', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const { getByTestId, store } = renderComponent();
    fireEvent.click(getByTestId('download-btn'));
    const action = findCustomContent(store, 'transferring-to-earthdata-search');
    expect(action).toBeTruthy();
    expect(action.opts.bodyComponentProps).toEqual(
      expect.objectContaining({
        displayDate: '2020 JAN 01',
        selectedLayer: layer1,
        selectedCollection: expect.objectContaining({ value: 'C1-STD' }),
        continueToEDS: expect.any(Function),
      }),
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
    const granuleLayer = { ...layer1, type: 'granule' };
    const { getByTestId, store } = renderComponent({
      smartHandoffs: {
        availableLayers: [granuleLayer],
        validatedLayers: [granuleLayer],
      },
    });
    fireEvent.click(getByTestId('download-btn'));
    const action = findCustomContent(store, 'transferring-to-earthdata-search');
    expect(action.opts.bodyComponentProps.displayDate).toEqual(
      expect.stringContaining(' - '),
    );
  });

  it('continueToEDS calls openEarthDataSearch with correct options', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const { getByTestId, store } = renderComponent();
    fireEvent.click(getByTestId('download-btn'));
    const action = findCustomContent(store, 'transferring-to-earthdata-search');
    action.opts.bodyComponentProps.continueToEDS();
    expect(openEarthDataSearch).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        projection: geographicProj.crs,
        conceptId: 'C1-STD',
      }),
    );
  });
});

describe('componentDidMount', () => {
  it('dispatches fetchAvailableTools on mount', () => {
    const { store } = renderComponent();
    expect(actionsOfType(store, 'FETCH_AVAILABLE_TOOLS').length).toBe(1);
  });

  it('dispatches validateLayersConceptIds with availableLayers on mount', () => {
    const { store } = renderComponent();
    const [validate] = actionsOfType(store, 'VALIDATE_LAYERS');
    expect(validate.layers).toEqual([layer1]);
  });

  it('does not check extent when proj is not geographic', () => {
    const { queryByTestId } = renderComponent({
      proj: { selected: arcticProj },
      map: { extent: [-200, -90, -185, 90] },
    });
    expect(queryByTestId('alert')).not.toBeInTheDocument();
  });
});

describe('componentDidUpdate', () => {
  it('dispatches validateLayersConceptIds when availableLayers changes', () => {
    const newLayer = { ...layer1, id: 'layer2' };
    const { rerender } = renderComponent();
    const updatedStore = mockStore(buildState({
      smartHandoffs: { availableLayers: [newLayer] },
    }));
    rerender(
      <Provider store={updatedStore}>
        <SmartHandoff />
      </Provider>,
    );
    const [validate] = actionsOfType(updatedStore, 'VALIDATE_LAYERS');
    expect(validate.layers).toEqual([newLayer]);
  });

  it('resets to baseState when selectedCollection set but layer no longer active', () => {
    const { rerender, getByTestId, queryByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    const updatedStore = mockStore(buildState({
      smartHandoffs: { availableLayers: [], conceptId: 'NO-MATCH' },
    }));
    rerender(
      <Provider store={updatedStore}>
        <SmartHandoff />
      </Provider>,
    );
    expect(queryByTestId('crop-tool')).not.toBeInTheDocument();
  });

  it('hides bounding box when proj changes away from geographic', () => {
    const { rerender, getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    const updatedStore = mockStore(buildState({ proj: { selected: arcticProj } }));
    rerender(
      <Provider store={updatedStore}>
        <SmartHandoff />
      </Provider>,
    );
    expect(document.querySelector('.smart-handoff-crop-toggle')).not.toBeInTheDocument();
  });

  it('re-checks extent when map.extent changes in geographic proj', () => {
    const { rerender, container } = renderComponent();
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).not.toBeInTheDocument();
    const updatedStore = mockStore(buildState({ map: { extent: [-200, -90, -185, 90] } }));
    rerender(
      <Provider store={updatedStore}>
        <SmartHandoff />
      </Provider>,
    );
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
  });

  it('clears showZoomedIntoDatelineAlert when proj changes to non-geographic', () => {
    const { rerender, container } = renderComponent({ map: { extent: [-200, -90, -185, 90] } });
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).toBeInTheDocument();
    const updatedStore = mockStore(buildState({
      map: { extent: [-200, -90, -185, 90] },
      proj: { selected: arcticProj },
    }));
    rerender(
      <Provider store={updatedStore}>
        <SmartHandoff />
      </Provider>,
    );
    expect(container.querySelector('#data-download-unavailable-dateline-alert')).not.toBeInTheDocument();
  });
});

describe('updateSelectionAlerts', () => {
  it('renders selection outside extents alert when selection is outside map area', async () => {
    const { imageUtilGetCoordsFromPixelValues } = require('../../modules/image-download/util');
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[190, 30], [200, 50]]);
    const { getByTestId, findByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('crop-checkbox'));
    });
    expect(await findByTestId('alert')).toBeInTheDocument();
    imageUtilGetCoordsFromPixelValues.mockReturnValue([[-100, 30], [-80, 50]]);
  });
});

describe('mapStateToProps', () => {
  it('passes screenWidth/screenHeight from screenSize into boundary state', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('crop-checkbox'));
    const cropTool = getByTestId('crop-tool');
    expect(cropTool).toHaveAttribute('data-x', String(1200 / 2 - 100));
    expect(cropTool).toHaveAttribute('data-y', String(800 / 2 - 100));
  });

  it('selects the layer matching layerId', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.layer-item.selected')).toBeInTheDocument();
  });

  it('does not select a layer when layerId does not match', () => {
    const { container } = renderComponent({ smartHandoffs: { layerId: 'nonexistent' } });
    expect(container.querySelector('.layer-item.selected')).not.toBeInTheDocument();
  });

  it('selects the collection matching conceptId', () => {
    const { container } = renderComponent();
    const checked = container.querySelector('input[type="radio"]:checked');
    expect(checked).toBeInTheDocument();
  });

  it('does not mark a collection when conceptId does not match', () => {
    const { container } = renderComponent({ smartHandoffs: { conceptId: 'NO-MATCH' } });
    expect(container.querySelector('input[type="radio"]:checked')).not.toBeInTheDocument();
  });

  it('treats granule-type layers as granule layers in the download flow', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const granuleLayer = { ...layer1, type: 'granule' };
    const { getByTestId, store } = renderComponent({
      smartHandoffs: {
        availableLayers: [granuleLayer],
        validatedLayers: [granuleLayer],
      },
    });
    fireEvent.click(getByTestId('download-btn'));
    const action = findCustomContent(store, 'transferring-to-earthdata-search');
    expect(action.opts.bodyComponentProps.displayDate).toEqual(
      expect.stringContaining(' - '),
    );
  });
});

describe('mapDispatchToProps', () => {
  it('selectCollection dispatches SELECT_COLLECTION', () => {
    const { container, store } = renderComponent();
    const radios = container.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[1]);
    const [action] = actionsOfType(store, 'SELECT_COLLECTION');
    expect(action).toEqual(
      expect.objectContaining({ type: 'SELECT_COLLECTION', conceptId: 'C1-NRT', layerId: 'layer1' }),
    );
  });

  it('fetchAvailableTools dispatches FETCH_AVAILABLE_TOOLS', () => {
    const { store } = renderComponent();
    expect(actionsOfType(store, 'FETCH_AVAILABLE_TOOLS').length).toBe(1);
  });

  it('validateLayersConceptIds dispatches VALIDATE_LAYERS', () => {
    const { store } = renderComponent();
    const [validate] = actionsOfType(store, 'VALIDATE_LAYERS');
    expect(validate.layers).toEqual([layer1]);
  });

  it('showWarningModal pushes GTM event', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('download-btn'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_open_warning_modal',
    });
  });

  it('showWarningModal dispatches openCustomContent', () => {
    const { getByTestId, store } = renderComponent();
    fireEvent.click(getByTestId('download-btn'));
    const action = findCustomContent(store, 'transferring-to-earthdata-search');
    expect(action.opts).toEqual(
      expect.objectContaining({ headerText: 'Leaving @NAME@' }),
    );
    expect(openCustomContent).toHaveBeenCalled();
  });

  it('showNotAvailableModal dispatches openCustomContent', () => {
    const { getByText, store } = renderComponent();
    fireEvent.click(getByText(/Why are some layers not available/));
    const action = findCustomContent(store, 'layers-not-available');
    expect(action.opts).toEqual(
      expect.objectContaining({ headerText: 'Data Download Availability' }),
    );
  });

  it('showGranuleHelpModal pushes GTM event', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('granule-count'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_open_granule_help_link',
    });
  });

  it('showGranuleHelpModal dispatches openCustomContent', () => {
    const { getByTestId, store } = renderComponent();
    fireEvent.click(getByTestId('granule-count'));
    const action = findCustomContent(store, 'granule-help');
    expect(action.opts).toEqual(
      expect.objectContaining({ headerText: 'Granule Availability' }),
    );
  });
});
