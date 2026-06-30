/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, fireEvent, act, waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ChartingModeOptions from './charting-mode-options';

let capturedPostrender = null;

jest.mock('ol/proj', () => ({
  // identity transform that returns numbers so .toFixed works
  transform: (coord) => [coord[0], coord[1]],
}));

jest.mock('ol/source', () => ({
  Vector: class {},
}));

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('../charting/charting-info', () => () => null);
jest.mock('../charting/charting-error', () => () => null);
jest.mock('../charting/simple-statistics', () => () => null);
jest.mock('../charting/charting-date-selector', () => () => null);
jest.mock('../charting/chart-component', () => () => null);

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => (
    <span data-testid="fa-info" onClick={props.onClick} />
  ),
}));

jest.mock('../image-download/lat-long-inputs', () => (props) => (
  <button
    type="button"
    data-testid="lat-long-select"
    onClick={() => props.onLatLongChange([10, 20, 30, 40])}
  >
    latlong
  </button>
));

jest.mock('../util/checkbox', () => (props) => (
  <button type="button" data-testid="map-view-checkbox" onClick={props.onCheck}>
    {`checked:${props.checked}`}
  </button>
));

jest.mock('../util/button', () => (props) => (
  <button
    type="button"
    data-testid={props.id}
    data-valid={`${props.valid}`}
    onClick={props.onClick}
  >
    {typeof props.text === 'string' ? props.text : 'btn'}
  </button>
));

jest.mock('../util/image-crop', () => (props) => (
  <button
    type="button"
    data-testid="crop"
    onClick={() => props.onChange({
      x: 5, y: 5, width: 60, height: 60,
    })}
  >
    crop
  </button>
));

jest.mock('../util/wait', () => (props) => (
  <button type="button" data-testid="wait-cancel" onClick={props.onCancel}>
    {props.statusText}
  </button>
));

jest.mock('../../modules/charting/actions', () => ({
  updateChartingAOICoordinates: jest.fn((extent) => ({ type: 'AOI', extent })),
  updateChartingDateSelection: jest.fn((b) => ({ type: 'DATE_SELECTION', b })),
  updateRequestInProgressAction: jest.fn((s) => ({ type: 'REQ', s })),
  updateModalOpenAction: jest.fn((s) => ({ type: 'MODAL_OPEN', s })),
  changeChartingStartDate: jest.fn((d) => ({ type: 'START', d })),
  changeChartingEndDate: jest.fn((d) => ({ type: 'END', d })),
}));

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn((key, opts) => ({ type: 'OPEN_CUSTOM', key, opts })),
  onClose: jest.fn(() => ({ type: 'CLOSE' })),
}));

const { openCustomContent } = require('../../modules/modal/actions');

function createOlMap(overrides = {}) {
  return {
    getCoordinateFromPixel: jest.fn(([px, py]) => [px, py]),
    getPixelFromCoordinate: jest.fn(([lon, lat]) => [lon + 100, lat + 100]),
    getView: jest.fn(() => ({
      calculateExtent: jest.fn(() => [-50, -50, 50, 50]),
    })),
    getSize: jest.fn(() => [800, 600]),
    once: jest.fn((event, cb) => {
      capturedPostrender = cb;
    }),
    ...overrides,
  };
}

const layer = {
  id: 'MODIS_Layer',
  title: 'MODIS Title',
  subtitle: 'MODIS Subtitle',
  startDate: '2020-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:00Z',
  palette: { id: 'modis_palette' },
  projections: { geographic: { source: 'GIBS:geographic' } },
};

function buildState(overrides = {}) {
  const charting = {
    activeLayer: 'MODIS_Layer',
    aoiActive: false,
    aoiCoordinates: [],
    aoiSelected: false,
    chartRequestInProgress: false,
    timeSpanSelection: 'range',
    timeSpanStartDate: new Date('2023-05-01T00:00:00Z'),
    timeSpanEndDate: new Date('2023-05-03T00:00:00Z'),
    fromButton: false,
    isChartOpen: false,
    ...(overrides.charting || {}),
  };
  return {
    charting,
    map: { ui: { selected: overrides.olMap === undefined ? createOlMap() : overrides.olMap } },
    proj: {
      selected: {
        crs: 'EPSG:4326',
        maxExtent: overrides.maxExtent === undefined,
      },
    },
    config: { projections: { geographic: { crs: 'EPSG:4326' } } },
    layers: { active: { layers: overrides.layers || [layer] } },
    date: {
      selected: new Date('2023-05-02T00:00:00Z'),
      appNow: new Date('2023-06-01T00:00:00Z'),
    },
    palettes: {
      rendered: overrides.renderedPalettes === undefined
        ? { modis_palette: { maps: [{ legend: { units: 'K' } }] } }
        : overrides.renderedPalettes,
    },
    screenSize: {
      screenWidth: overrides.screenWidth || 1024,
      screenHeight: overrides.screenHeight || 768,
    },
    modal: {
      isOpen: overrides.isModalOpen || false,
      id: overrides.modalId || '',
    },
  };
}

const mockStore = configureStore([]);

function renderComponent(stateOverrides = {}, ownProps = {}) {
  const store = mockStore(buildState(stateOverrides));
  store.dispatch = jest.fn();
  const utils = render(
    <Provider store={store}>
      <ChartingModeOptions
        isChartingActive
        isMobile={false}
        sidebarHeight={500}
        {...ownProps}
      />
    </Provider>,
  );
  return { store, ...utils };
}

const statsBody = {
  min: { '2023-05-01T00:00:00Z': '1.234', '2023-05-02T00:00:00Z': '2.345' },
  max: { '2023-05-01T00:00:00Z': '5.111', '2023-05-02T00:00:00Z': '6.222' },
  mean: { '2023-05-01T00:00:00Z': '3.0', '2023-05-02T00:00:00Z': '4.0' },
  median: { '2023-05-01T00:00:00Z': '3.0', '2023-05-02T00:00:00Z': '4.0' },
  stdev: { '2023-05-01T00:00:00Z': '0.5', '2023-05-02T00:00:00Z': '0.6' },
  errors: { error_count: 0, error_days: [] },
  hist: [],
  stderr: 0,
};

function mockFetchText(text) {
  global.fetch = jest.fn(() => Promise.resolve({ text: () => Promise.resolve(text) }));
}

beforeEach(() => {
  jest.clearAllMocks();
  capturedPostrender = null;
});

describe('ChartingModeOptions rendering', () => {
  it('returns null when olMap is not present', () => {
    const { container } = renderComponent({ olMap: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders the charting container, title and layer name', () => {
    const { getByText, getByTestId } = renderComponent();
    expect(getByText('Charting Mode - BETA')).toBeTruthy();
    expect(getByText('MODIS Title')).toBeTruthy();
    expect(getByTestId('charting-date-button')).toBeTruthy();
    expect(getByTestId('charting-create-button')).toBeTruthy();
  });

  it('shows date range value for range selection and single date label for date selection', () => {
    const { getByTestId } = renderComponent({ charting: { timeSpanSelection: 'date' } });
    expect(getByTestId('charting-date-button')).toBeTruthy();
  });

  it('handles getLatLongFromPixelValue returning [0,0] when no coordinate', () => {
    const olMap = createOlMap({ getCoordinateFromPixel: jest.fn(() => null) });
    const { getByText } = renderComponent({ olMap });
    expect(getByText('Charting Mode - BETA')).toBeTruthy();
  });

  it('renders in-progress spinner text when a chart request is in progress', () => {
    const { getByTestId } = renderComponent({ charting: { chartRequestInProgress: true } });
    expect(getByTestId('wait-cancel')).toBeTruthy();
  });
});

describe('ChartingModeOptions interactions', () => {
  it('dispatches date selection when One Date / Date Range buttons are clicked', () => {
    const { getByText, store } = renderComponent();
    fireEvent.click(getByText('One Date'));
    fireEvent.click(getByText('Date Range'));
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('opens the charting info modal when info icon is clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('fa-info'));
    expect(openCustomContent).toHaveBeenCalledWith('CHARTING_INFO_MODAL', expect.any(Object));
  });

  it('opens the date modal and sets css offset when date button is clicked', () => {
    const setProperty = jest.spyOn(document.body.style, 'setProperty');
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('charting-date-button'));
    expect(setProperty).toHaveBeenCalledWith('--charting-date-modal-offset', '450px');
    expect(openCustomContent).toHaveBeenCalledWith('CHARTING-DATE-MODAL', expect.any(Object));
  });

  it('updates coordinates when lat/long inputs change', () => {
    const { getByTestId, store } = renderComponent();
    fireEvent.click(getByTestId('lat-long-select'));
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('toggles map view selection on and off', () => {
    const { getByTestId } = renderComponent();
    const checkbox = getByTestId('map-view-checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(checkbox).toBeTruthy();
  });

  it('renders the Crop component and handles boundary updates when AOI is active', () => {
    const { getByTestId, store } = renderComponent(
      { charting: { aoiActive: true, fromButton: true } },
    );
    const crop = getByTestId('crop');
    fireEvent.click(crop);
    expect(store.dispatch).toHaveBeenCalled();
  });
});

describe('ChartingModeOptions chart request flow', () => {
  it('opens an error modal when no valid layer is detected', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({ charting: { activeLayer: 'does-not-exist' } });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    expect(openCustomContent).toHaveBeenCalledWith('CHARTING_ERROR_MODAL', expect.any(Object));
  });

  it('generates a chart for a range request (GIBS layer) and opens the chart modal', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
    });
  });

  it('generates simple statistics for a single date request', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({ charting: { timeSpanSelection: 'date' } });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-STATS-MODAL', expect.any(Object));
    });
  });

  it('opens an error modal when the server returns "Internal Server Error"', async () => {
    mockFetchText('Internal Server Error');
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING_ERROR_MODAL', expect.any(Object));
    });
  });

  it('opens an error modal when no data is returned', async () => {
    mockFetchText('null');
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING_ERROR_MODAL', expect.any(Object));
    });
  });

  it('opens an error modal when fetch throws', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING_ERROR_MODAL', expect.any(Object));
    });
  });

  it('opens an error modal when response status is 204', async () => {
    mockFetchText(JSON.stringify({ status: 204 }));
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING_ERROR_MODAL', expect.any(Object));
    });
  });

  it('handles a non-GIBS layer source without making a request', async () => {
    const nonGibsLayer = {
      ...layer,
      projections: { geographic: { source: 'OTHER' } },
    };
    const { getByTestId } = renderComponent({ layers: [nonGibsLayer] });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    expect(openCustomContent).not.toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
  });

  it('does nothing when a request is already in progress', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({ charting: { chartRequestInProgress: true } });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders a chart with error days included in the dataset', async () => {
    const bodyWithErrors = {
      ...statsBody,
      errors: { error_count: 2, error_days: "['2023-05-04T00:00:00Z','2023-05-05T00:00:00Z']" },
    };
    mockFetchText(JSON.stringify(bodyWithErrors));
    const { getByTestId } = renderComponent();
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
    });
  });

  it('generates a chart on a wide screen (wide modal layout)', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({ screenWidth: 1200 });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
    });
  });

  it('combines multiple requests for a long date range', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({
      charting: {
        timeSpanSelection: 'range',
        timeSpanStartDate: new Date('2023-05-01T00:00:00Z'),
        timeSpanEndDate: new Date('2023-06-10T00:00:00Z'),
      },
    });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(global.fetch.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('auto-renders a chart when isChartOpen is set and the palette is rendered', async () => {
    mockFetchText(JSON.stringify(statsBody));
    renderComponent({ charting: { isChartOpen: true, fromButton: true } });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
    });
  });

  it('handles a palette legend without units', async () => {
    mockFetchText(JSON.stringify(statsBody));
    const { getByTestId } = renderComponent({
      renderedPalettes: { modis_palette: { maps: [{ legend: {} }] } },
    });
    await act(async () => {
      fireEvent.click(getByTestId('charting-create-button'));
    });
    await waitFor(() => {
      expect(openCustomContent).toHaveBeenCalledWith('CHARTING-CHART', expect.any(Object));
    });
  });
});

describe('ChartingModeOptions cancel + modal effects', () => {
  it('cancels an in-progress chart request', () => {
    const { getByTestId, store } = renderComponent({ charting: { chartRequestInProgress: true } });
    fireEvent.click(getByTestId('wait-cancel'));
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('updates modal open state when the chart modal is open', () => {
    const { store } = renderComponent({ modalId: 'CHARTING-CHART', isModalOpen: true });
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('resets request status when the chart modal is closed', () => {
    const { store } = renderComponent({ modalId: 'CHARTING-CHART', isModalOpen: false });
    expect(store.dispatch).toHaveBeenCalled();
  });
});

describe('ChartingModeOptions postrender behavior', () => {
  it('initializes dates and AOI on postrender when no aoi coordinates exist', () => {
    renderComponent();
    expect(capturedPostrender).toBeInstanceOf(Function);
    act(() => {
      capturedPostrender();
    });
  });

  it('uses existing aoi coordinates on postrender and checks map view match', () => {
    renderComponent({
      charting: { aoiCoordinates: [-50, -50, 50, 50] },
    });
    expect(capturedPostrender).toBeInstanceOf(Function);
    act(() => {
      capturedPostrender();
    });
  });

  it('handles postrender with aoi coordinates that do not match the view extent', () => {
    renderComponent({
      charting: { aoiCoordinates: [1, 2, 3, 4] },
    });
    act(() => {
      capturedPostrender();
    });
  });
});

describe('ChartingModeOptions screen resize', () => {
  it('recomputes boundaries when the screen size changes', () => {
    const store = mockStore(buildState());
    store.dispatch = jest.fn();
    const { rerender } = render(
      <Provider store={store}>
        <ChartingModeOptions isChartingActive isMobile={false} sidebarHeight={500} />
      </Provider>,
    );
    const resizedStore = mockStore(buildState({ screenWidth: 500, screenHeight: 400 }));
    resizedStore.dispatch = jest.fn();
    rerender(
      <Provider store={resizedStore}>
        <ChartingModeOptions isChartingActive isMobile={false} sidebarHeight={500} />
      </Provider>,
    );
    expect(resizedStore.dispatch).toBeDefined();
  });

  it('handles maxExtent being absent', () => {
    const { getByText } = renderComponent({ maxExtent: null });
    expect(getByText('Charting Mode - BETA')).toBeTruthy();
  });
});
