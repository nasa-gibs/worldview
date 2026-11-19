/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import FindOrbitTracksMode from './dev-find-orbit-tracks-mode';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ id, className }) => <span id={id} className={className} />,
}));

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, disabled, style, className, color, outline, active,
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={className}
      data-color={color}
      data-outline={String(!!outline)}
      data-active={String(!!active)}
      data-testid={`btn-${typeof children === 'string'
        ? children.trim().toLowerCase()
          .replace(/\s+/g, '-')
        : 'spinner'}`}
    >
      {children}
    </button>
  ),
  ButtonGroup: ({ children }) => <div data-testid="button-group">{children}</div>,
  Badge: ({ children, color, className }) => (
    <span data-testid="badge" data-color={color} className={className}>{children}</span>
  ),
  FormGroup: ({ children, className }) => <div className={className}>{children}</div>,
  Label: ({ children }) => <label>{children}</label>,
  Spinner: ({ size, color }) => <span data-testid="spinner" data-size={size} data-color={color} />,
  UncontrolledTooltip: ({
    children, id, target, placement,
  }) => (
    <div data-testid="tooltip" data-id={id} data-target={target} data-placement={placement}>
      {children}
    </div>
  ),
}));

jest.mock('../pixel-test-mode/tile-image-test-dropdown-selection', () => ({
  __esModule: true,
  default: ({ setLayerSelection }) => (
    <div data-testid="dropdown-selector">
      <button
        type="button"
        data-testid="dropdown-select-orbital"
        onClick={() => setLayerSelection({ id: 'VIIRS_SNPP_Orbital_Track', period: 'daily' })}
      >
        Select Orbital Layer
      </button>
      <button
        type="button"
        data-testid="dropdown-select-no-threshold"
        onClick={() => setLayerSelection({ id: 'LAYER_NO_THRESHOLD', period: 'daily' })}
      >
        Select No Threshold Layer
      </button>
    </div>
  ),
}));

jest.mock('ol/extent', () => ({
  getIntersection: jest.fn(),
  getArea: jest.fn(),
  isEmpty: jest.fn(),
}));

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => [`mercator_${extent[0]}`, extent[1], extent[2], extent[3]]),
}));

jest.mock('../../../../modules/date/actions', () => ({
  selectDate: jest.fn((date) => ({ type: 'SELECT_DATE', date })),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => [
    { id: 'VIIRS_SNPP_Orbital_Track', layergroup: 'Orbital Track', period: 'daily' },
    { id: 'NON_ORBITAL', layergroup: 'Other', period: 'daily' },
  ]),
}));

jest.mock('../../kiosk/tile-measurement/utils/date-util', () => ({
  formatReduxDailyDate: jest.fn((d) => {
    return d instanceof Date ? d.toISOString().slice(0, 10) : String(d);
  }),
  getOrbitalDates: jest.fn(() => ['2024-01-15', '2024-01-16', '2024-01-17']),
}));

jest.mock('../utils/image-api-request-experimental', () => jest.fn());
jest.mock('../../kiosk/tile-measurement/utils/calculate-pixels', () => jest.fn());

jest.mock('../../kiosk/tile-measurement/utils/layer-data-eic', () => ({
  layerPixelData: {
    VIIRS_SNPP_Orbital_Track: { threshold: 0.5 },
  },
}));

jest.mock('../../../../util/customHooks', () => jest.fn((val) => {
  const prev = mockUsePreviousValue;
  mockUsePreviousValue = val;
  return prev;
}));

import { getIntersection, getArea, isEmpty } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { formatReduxDailyDate, getOrbitalDates } from '../../kiosk/tile-measurement/utils/date-util';
import fetchWMSImageExperimental from '../utils/image-api-request-experimental';
import calculatePixels from '../../kiosk/tile-measurement/utils/calculate-pixels';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let mockUsePreviousValue;
const mockStore = configureMockStore();

const mockView = {
  getZoom: jest.fn(() => 8),
  calculateExtent: jest.fn(() => [-100, 30, -80, 50]),
  getSize: jest.fn(() => [800, 600]),
};

const mockMap = {
  getView: jest.fn(() => mockView),
  getSize: jest.fn(() => [800, 600]),
};

const selectedDate = new Date('2024-01-15T00:00:00Z');
const latestDate = new Date('2024-01-20T00:00:00Z');

function buildStore(dateOverrides = {}) {
  return mockStore({
    map: { ui: { selected: mockMap } },
    compare: { activeString: 'activeA' },
    date: {
      selected: selectedDate,
      appNow: latestDate,
      ...dateOverrides,
    },
  });
}

function renderComponent(store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <FindOrbitTracksMode />
    </Provider>,
  );
  return { ...utils, store: s };
}

// Helpers to set up a component ready to click "Search For Imagery"
function selectLayerAndMethod(layerTestId = 'dropdown-select-orbital', methodBtnId = 'btn-forwards') {
  fireEvent.click(screen.getByTestId(layerTestId));
  fireEvent.click(screen.getByTestId(methodBtnId));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FindOrbitTracksMode', () => {
  let mockImgInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePreviousValue = undefined;

    mockView.getZoom.mockReturnValue(8);
    mockView.calculateExtent.mockReturnValue([-100, 30, -80, 50]);
    mockView.getSize.mockReturnValue([800, 600]);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Capture the Image instance so tests can trigger onload/onerror
    mockImgInstance = { src: null, onload: null, onerror: null };
    jest.spyOn(global, 'Image').mockImplementation(() => mockImgInstance);

    // Default: valid extent overlap (>25%)
    getIntersection.mockReturnValue([-95, 32, -85, 45]);
    getArea.mockReturnValue(50);
    isEmpty.mockReturnValue(false);

    fetchWMSImageExperimental.mockResolvedValue('mock-wms-url');
    calculatePixels.mockResolvedValue(0.5);
    getOrbitalDates.mockReturnValue(['2024-01-15', '2024-01-16', '2024-01-17']);
    formatReduxDailyDate.mockImplementation((d) => (
      d instanceof Date ? d.toISOString().slice(0, 10) : String(d)
    ));
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    global.Image.mockRestore();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the "Orbit Track Test Mode" heading', () => {
      renderComponent();
      expect(screen.getByText('Orbit Track Test Mode')).toBeInTheDocument();
    });

    it('renders the tooltip with correct target', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-target', 'orbit-track-test-info-icon');
    });

    it('renders the tooltip with correct id', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-id', 'orbit-track-test-tooltip');
    });

    it('renders the tooltip with correct content', () => {
      renderComponent();
      expect(screen.getByText('Find nearest imagery date with orbit tracks for current extent')).toBeInTheDocument();
    });

    it('renders the tooltip with placement "right"', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-placement', 'right');
    });

    it('renders the minimum zoom badge with value 7', () => {
      renderComponent();
      expect(screen.getAllByTestId('badge')[0]).toHaveTextContent('7');
    });

    it('renders the current zoom badge with the map zoom value', () => {
      renderComponent();
      expect(screen.getAllByTestId('badge')[1]).toHaveTextContent('8.00');
    });

    it('renders the current zoom badge as "success" when zoom >= 7', () => {
      renderComponent();
      expect(screen.getAllByTestId('badge')[1]).toHaveAttribute('data-color', 'success');
    });

    it('renders the current zoom badge as "danger" when zoom < 7', () => {
      mockView.getZoom.mockReturnValue(4);
      renderComponent();
      expect(screen.getAllByTestId('badge')[1]).toHaveAttribute('data-color', 'danger');
    });

    it('renders the DropdownSelector', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-selector')).toBeInTheDocument();
    });

    it('renders the "Select a date search method" label', () => {
      renderComponent();
      expect(screen.getByText('Select a date search method')).toBeInTheDocument();
    });

    it('renders Forwards, Backwards, and Both buttons', () => {
      renderComponent();
      expect(screen.getByTestId('btn-forwards')).toBeInTheDocument();
      expect(screen.getByTestId('btn-backwards')).toBeInTheDocument();
      expect(screen.getByTestId('btn-both')).toBeInTheDocument();
    });

    it('renders the "Search For Imagery" button', () => {
      renderComponent();
      expect(screen.getByTestId('btn-search-for-imagery')).toBeInTheDocument();
    });

    it('renders "No date found" in the badge initially', () => {
      renderComponent();
      expect(screen.getByText('No date found')).toBeInTheDocument();
    });

    it('renders the "Date Found:" label', () => {
      renderComponent();
      expect(screen.getByText('Date Found:')).toBeInTheDocument();
    });

    it('renders the "Take Me There" button', () => {
      renderComponent();
      expect(screen.getByTestId('btn-take-me-there')).toBeInTheDocument();
    });

    it('renders "Search For Imagery" button with orange background', () => {
      renderComponent();
      expect(screen.getByTestId('btn-search-for-imagery')).toHaveStyle({ backgroundColor: '#d54e21' });
    });

    it('renders "Take Me There" button with orange background', () => {
      renderComponent();
      expect(screen.getByTestId('btn-take-me-there')).toHaveStyle({ backgroundColor: '#d54e21' });
    });
  });

  // ── buttonDisabled logic ───────────────────────────────────────────────────

  describe('buttonDisabled logic', () => {
    it('disables "Search For Imagery" when no layer selected and no search method', () => {
      renderComponent();
      expect(screen.getByTestId('btn-search-for-imagery')).toBeDisabled();
    });

    it('disables "Search For Imagery" when layer selected but searchMethod is 0', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-orbital'));
      expect(screen.getByTestId('btn-search-for-imagery')).toBeDisabled();
    });

    it('disables "Search For Imagery" when searchMethod set but no layer selected', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('btn-forwards'));
      expect(screen.getByTestId('btn-search-for-imagery')).toBeDisabled();
    });

    it('disables "Search For Imagery" when zoom < 7', () => {
      mockView.getZoom.mockReturnValue(5);
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-orbital'));
      fireEvent.click(screen.getByTestId('btn-forwards'));
      expect(screen.getByTestId('btn-search-for-imagery')).toBeDisabled();
    });

    it('enables "Search For Imagery" when layer selected, searchMethod set, and zoom >= 7', () => {
      renderComponent();
      selectLayerAndMethod();
      expect(screen.getByTestId('btn-search-for-imagery')).not.toBeDisabled();
    });

    it('disables "Take Me There" when dateFound is null', () => {
      renderComponent();
      expect(screen.getByTestId('btn-take-me-there')).toBeDisabled();
    });
  });

  // ── searchMethod buttons ───────────────────────────────────────────────────

  describe('searchMethod buttons', () => {
    it('sets Forwards active when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('btn-forwards'));
      expect(screen.getByTestId('btn-forwards')).toHaveAttribute('data-active', 'true');
    });

    it('sets Backwards active when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('btn-backwards'));
      expect(screen.getByTestId('btn-backwards')).toHaveAttribute('data-active', 'true');
    });

    it('sets Both active when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('btn-both'));
      expect(screen.getByTestId('btn-both')).toHaveAttribute('data-active', 'true');
    });

    it('deactivates the previous search method when a new one is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('btn-forwards'));
      fireEvent.click(screen.getByTestId('btn-backwards'));
      expect(screen.getByTestId('btn-forwards')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('btn-backwards')).toHaveAttribute('data-active', 'true');
    });

    it('passes searchMethod value to getOrbitalDates', async () => {
      renderComponent();
      selectLayerAndMethod('dropdown-select-orbital', 'btn-backwards');
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(getOrbitalDates).toHaveBeenCalledWith(expect.any(String), expect.any(String), 2);
    });
  });

  // ── verifyExtent ───────────────────────────────────────────────────────────

  describe('verifyExtent', () => {
    it('logs "No intersection" and returns false when isEmpty is true', async () => {
      isEmpty.mockReturnValue(true);
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(console.log).toHaveBeenCalledWith('No intersection');
      expect(fetchWMSImageExperimental).not.toHaveBeenCalled();
    });

    it('stops loading after empty intersection', async () => {
      isEmpty.mockReturnValue(true);
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('logs percentOfMapView when extent is valid', async () => {
      getArea.mockReturnValueOnce(50).mockReturnValueOnce(100);
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(console.log).toHaveBeenCalledWith('percentOfMapView', 50);
    });

    it('returns false and logs warning when percent <= 25', async () => {
      getArea.mockReturnValueOnce(10).mockReturnValueOnce(100);
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Only 10%'));
      expect(fetchWMSImageExperimental).not.toHaveBeenCalled();
    });

    it('proceeds to fetch imagery when percent > 25', async () => {
      getArea.mockReturnValueOnce(50).mockReturnValueOnce(100);
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(fetchWMSImageExperimental).toHaveBeenCalled();
    });

    it('calls getIntersection with the US extent and currentExtent', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(getIntersection).toHaveBeenCalledWith(
        [-125.0799167388867, 22.176358212699427, -62.489596269417106, 57.01542814447728],
        [-100, 30, -80, 50],
      );
    });
  });

  // ── getOrbitalDateRange ────────────────────────────────────────────────────

  describe('getOrbitalDateRange', () => {
    it('calls formatReduxDailyDate for both selectedDate and latestDate', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(formatReduxDailyDate).toHaveBeenCalledTimes(2);
    });

    it('calls getOrbitalDates with correct arguments', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(getOrbitalDates).toHaveBeenCalledWith(
        selectedDate.toISOString().slice(0, 10),
        latestDate.toISOString().slice(0, 10),
        1,
      );
    });
  });

  // ── makeMeasurementRequest ─────────────────────────────────────────────────

  describe('makeMeasurementRequest', () => {
    it('calls transformExtent with EPSG:4326 -> EPSG:3857', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(transformExtent).toHaveBeenCalledWith([-100, 30, -80, 50], 'EPSG:4326', 'EPSG:3857');
    });

    it('calls fetchWMSImageExperimental with layerId, date, and mercatorExtent', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(fetchWMSImageExperimental).toHaveBeenCalledWith(
        'VIIRS_SNPP_Orbital_Track',
        '2024-01-15',
        expect.arrayContaining([expect.anything()]),
      );
    });

    it('sets img.src to the wmsImage url after fetch', async () => {
      renderComponent();
      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });
      expect(mockImgInstance.src).toBe('mock-wms-url');
    });

    it('resolves with blackPixelRatio when img.onload fires', async () => {
      calculatePixels.mockResolvedValue(0.5);
      renderComponent();
      selectLayerAndMethod();

      fetchWMSImageExperimental.mockImplementation(async () => {
        return 'mock-wms-url';
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(calculatePixels).toHaveBeenCalledWith('mock-wms-url');
    });

    it('logs pixel message with threshold when layer has pixel data', async () => {
      calculatePixels.mockResolvedValue(0.3);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('VIIRS_SNPP_Orbital_Track'),
      );
    });

    it('logs pixel message without threshold when layer has no pixel data', async () => {
      calculatePixels.mockResolvedValue(0.3);
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-no-threshold'));
      fireEvent.click(screen.getByTestId('btn-forwards'));

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('There is no current threshold for LAYER_NO_THRESHOLD'),
      );
    });

    it('calls console.error and returns undefined when fetchWMSImageExperimental throws', async () => {
      fetchWMSImageExperimental.mockRejectedValue(new Error('fetch failed'));
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No image available'),
        expect.any(Error),
      );
    });
  });

  // ── findOrbitalImagery loop ────────────────────────────────────────────────

  describe('findOrbitalImagery loop', () => {
    it('shows spinners while loading', async () => {
      renderComponent();
      selectLayerAndMethod();
      fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      expect(screen.getAllByTestId('spinner')).toHaveLength(2);
    });

    it('logs "No imagery found" when imageryRequest is 100', async () => {
      calculatePixels.mockResolvedValue(1); // 1 * 100 = 100
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(console.log).toHaveBeenCalledWith('No imagery found for ', '2024-01-15');
    });

    it('logs "No imagery found" when imageryRequest is falsy (undefined)', async () => {
      fetchWMSImageExperimental.mockRejectedValue(new Error('fail'));
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
      });

      expect(console.log).toHaveBeenCalledWith('No imagery found for ', '2024-01-15');
    });

    it('sets dateFound and stops loading when imagery is found', async () => {
      calculatePixels.mockResolvedValue(0.5); // 50% — not 100, not falsy
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('logs "Imagery found" with correct date and ratio when found', async () => {
      calculatePixels.mockResolvedValue(0.5);
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(console.log).toHaveBeenCalledWith(
        'Imagery found for ',
        '2024-01-15',
        ' with ',
        50,
        '% black pixels',
      );
    });

    it('enables "Take Me There" button after dateFound is set', async () => {
      calculatePixels.mockResolvedValue(0.5);
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(screen.getByTestId('btn-take-me-there')).not.toBeDisabled();
    });
  });

  // ── moveToDate ─────────────────────────────────────────────────────────────

  describe('moveToDate', () => {
    async function setupWithDateFound(date = '2024-03-15') {
      calculatePixels.mockResolvedValue(0.5);
      getOrbitalDates.mockReturnValue([date]);
      const { store } = renderComponent();
      selectLayerAndMethod();

      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      return { store };
    }

    it('dispatches SELECT_DATE when "Take Me There" is clicked', async () => {
      const { store } = await setupWithDateFound();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-take-me-there'));
      });
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'SELECT_DATE' }),
      );
    });

    it('dispatches SELECT_DATE with correct year/month/day parsed from dateFound', async () => {
      const { store } = await setupWithDateFound('2024-03-15');
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-take-me-there'));
      });
      const dispatched = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(dispatched.date).toEqual(new Date(2024, 2, 15, 12, 0, 0));
    });

    it('dispatches SELECT_DATE with hour set to 12', async () => {
      const { store } = await setupWithDateFound('2024-06-01');
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-take-me-there'));
      });
      const dispatched = store.getActions().find((a) => a.type === 'SELECT_DATE');
      expect(dispatched.date.getHours()).toBe(12);
    });
  });

  // ── useEffect — reset dateFound on date change ────────────────────────────

  describe('useEffect — reset dateFound when selectedDate changes', () => {
    it('clears dateFound when selectedDate changes while dateFound is set', async () => {
      calculatePixels.mockResolvedValue(0.5);
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      const store1 = buildStore();
      const { rerender } = render(
        <Provider store={store1}>
          <FindOrbitTracksMode />
        </Provider>,
      );

      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(screen.getByText('2024-01-15')).toBeInTheDocument();

      const store2 = buildStore({ selected: new Date('2024-02-01T00:00:00Z'), appNow: latestDate });
      await act(async () => {
        rerender(
          <Provider store={store2}>
            <FindOrbitTracksMode />
          </Provider>,
        );
      });

      expect(screen.getByText('No date found')).toBeInTheDocument();
    });

    it('does not clear dateFound when selectedDate is unchanged', async () => {
      calculatePixels.mockResolvedValue(0.5);
      getOrbitalDates.mockReturnValue(['2024-01-15']);
      const store1 = buildStore();
      const { rerender } = render(
        <Provider store={store1}>
          <FindOrbitTracksMode />
        </Provider>,
      );

      selectLayerAndMethod();
      await act(async () => {
        fireEvent.click(screen.getByTestId('btn-search-for-imagery'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });

      expect(screen.getByText('2024-01-15')).toBeInTheDocument();

      await act(async () => {
        rerender(
          <Provider store={store1}>
            <FindOrbitTracksMode />
          </Provider>,
        );
      });

      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
  });
});
