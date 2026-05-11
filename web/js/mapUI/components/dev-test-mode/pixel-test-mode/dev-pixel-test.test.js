/* eslint-disable react/prop-types */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import PixelTestMode from './dev-pixel-test';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ id, className }) => <span id={id} className={className} />,
}));

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, disabled, color, className,
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-color={color}
      className={className}
      data-testid="pixel-test-button"
    >
      {children}
    </button>
  ),
  UncontrolledTooltip: ({
    children, id, target, placement,
  }) => (
    <div
      data-testid="tooltip"
      data-id={id}
      data-target={target}
      data-placement={placement}
    >
      {children}
    </div>
  ),
}));

jest.mock('./tile-image-test-dropdown-selection', () => ({
  __esModule: true,
  default: ({ setLayerSelection }) => (
    <div data-testid="dropdown-selector">
      <button
        type="button"
        data-testid="dropdown-select-daily"
        onClick={() => setLayerSelection({ id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' })}
      >
        Select Daily Layer
      </button>
      <button
        type="button"
        data-testid="dropdown-select-subdaily"
        onClick={() => setLayerSelection({ id: 'GOES-East_ABI_Band2_Red_Visible_1km', period: 'subdaily' })}
      >
        Select Subdaily Layer
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

jest.mock('../../../../components/util/switch', () => ({
  __esModule: true,
  default: ({ id, label, active, toggle }) => (
    <div data-testid="switch-wrapper">
      <input
        type="checkbox"
        id={id}
        data-testid="extent-switch"
        checked={active}
        onChange={toggle}
        aria-label={label}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  ),
}));

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => [`mercator_${extent[0]}`, extent[1], extent[2], extent[3]]),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => [
    { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', period: 'daily' },
    { id: 'GOES-East_ABI_Band2_Red_Visible_1km', period: 'subdaily' },
  ]),
}));

jest.mock('../utils/image-api-request-experimental', () => jest.fn());
jest.mock('../../kiosk/tile-measurement/utils/calculate-pixels', () => jest.fn());

jest.mock('../../kiosk/tile-measurement/utils/layer-data-eic', () => ({
  layerPixelData: {
    MODIS_Terra_CorrectedReflectance_TrueColor: { threshold: 0.5 },
  },
}));

jest.mock('../../kiosk/tile-measurement/utils/date-util', () => ({
  formatReduxDailyDate: jest.fn(() => '2024-01-15'),
  formatReduxSubdailyDate: jest.fn(() => '2024-01-15T12:00:00Z'),
}));

import { transformExtent } from 'ol/proj';
import { formatReduxDailyDate, formatReduxSubdailyDate } from '../../kiosk/tile-measurement/utils/date-util';
import fetchWMSImageExperimental from '../utils/image-api-request-experimental';
import calculatePixels from '../../kiosk/tile-measurement/utils/calculate-pixels';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

function buildStore() {
  return mockStore({
    map: { ui: { selected: mockMap } },
    compare: { activeString: 'activeA' },
    date: { selected: new Date('2024-01-15T00:00:00Z') },
  });
}

function renderComponent(store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <PixelTestMode />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PixelTestMode', () => {
  let mockImgInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockImgInstance = { src: null, onload: null, onerror: null };
    jest.spyOn(global, 'Image').mockImplementation(() => mockImgInstance);

    fetchWMSImageExperimental.mockResolvedValue('mock-wms-url');
    calculatePixels.mockResolvedValue(0.5);
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

    it('renders the "Pixel Test Mode" heading', () => {
      renderComponent();
      expect(screen.getByText('Pixel Test Mode')).toBeInTheDocument();
    });

    it('renders the heading as an h5 element', () => {
      renderComponent();
      expect(screen.getByText('Pixel Test Mode').tagName).toBe('H5');
    });

    it('renders the heading with correct classes', () => {
      renderComponent();
      expect(screen.getByText('Pixel Test Mode')).toHaveClass('h5', 'fw-bold', 'me-1');
    });

    it('renders the info icon with correct id', () => {
      renderComponent();
      expect(document.getElementById('pixel-test-info-icon')).toBeInTheDocument();
    });

    it('renders the tooltip with correct id', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-id', 'pixel-test-tooltip');
    });

    it('renders the tooltip with correct target', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-target', 'pixel-test-info-icon');
    });

    it('renders the tooltip with placement "right"', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-placement', 'right');
    });

    it('renders the tooltip with correct content', () => {
      renderComponent();
      expect(screen.getByText('Used to test the ratio of black pixels in an image tile. See PixelTestMode component.')).toBeInTheDocument();
    });

    it('renders the horizontal divider span', () => {
      const { container } = renderComponent();
      expect(container.querySelector('span.border-top')).toBeInTheDocument();
    });

    it('renders the "Pixel Test" button', () => {
      renderComponent();
      expect(screen.getByTestId('pixel-test-button')).toBeInTheDocument();
    });

    it('renders the "Pixel Test" button with color "primary"', () => {
      renderComponent();
      expect(screen.getByTestId('pixel-test-button')).toHaveAttribute('data-color', 'primary');
    });

    it('renders the "Pixel Test" button with class "mb-3"', () => {
      renderComponent();
      expect(screen.getByTestId('pixel-test-button')).toHaveClass('mb-3');
    });

    it('renders the DropdownSelector', () => {
      renderComponent();
      expect(screen.getByTestId('dropdown-selector')).toBeInTheDocument();
    });

    it('renders the Switch', () => {
      renderComponent();
      expect(screen.getByTestId('extent-switch')).toBeInTheDocument();
    });

    it('renders the Switch with correct label', () => {
      renderComponent();
      expect(screen.getByText('Use current visual extent as bounding box')).toBeInTheDocument();
    });

    it('renders the outer wrapper with correct classes', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass(
        'd-flex', 'flex-column', 'justify-content-center', 'align-items-center', 'mt-3',
      );
    });
  });

  // ── buttonDisabled logic ───────────────────────────────────────────────────

  describe('buttonDisabled logic', () => {
    it('disables "Pixel Test" when no layer is selected', () => {
      renderComponent();
      expect(screen.getByTestId('pixel-test-button')).toBeDisabled();
    });

    it('enables "Pixel Test" after a layer is selected', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      expect(screen.getByTestId('pixel-test-button')).not.toBeDisabled();
    });
  });

  // ── Switch / visualMapExtentSetting ───────────────────────────────────────

  describe('Switch / visualMapExtentSetting', () => {
    it('renders Switch as unchecked by default', () => {
      renderComponent();
      expect(screen.getByTestId('extent-switch')).not.toBeChecked();
    });

    it('toggles Switch to checked when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('extent-switch'));
      expect(screen.getByTestId('extent-switch')).toBeChecked();
    });

    it('toggles Switch back to unchecked on second click', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('extent-switch'));
      fireEvent.click(screen.getByTestId('extent-switch'));
      expect(screen.getByTestId('extent-switch')).not.toBeChecked();
    });

    it('does NOT call transformExtent when visualMapExtentSetting is false', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(transformExtent).not.toHaveBeenCalled();
    });

    it('calls transformExtent with EPSG:4326 -> EPSG:3857 when visualMapExtentSetting is true', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      fireEvent.click(screen.getByTestId('extent-switch'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(transformExtent).toHaveBeenCalledWith([-100, 30, -80, 50], 'EPSG:4326', 'EPSG:3857');
    });

    it('passes mercatorExtent to fetchWMSImageExperimental when visualMapExtentSetting is true', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      fireEvent.click(screen.getByTestId('extent-switch'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(fetchWMSImageExperimental).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.arrayContaining([expect.anything()]),
      );
    });

    it('passes undefined extent to fetchWMSImageExperimental when visualMapExtentSetting is false', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(fetchWMSImageExperimental).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        undefined,
      );
    });
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('calls formatReduxDailyDate when layer period is "daily"', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(formatReduxDailyDate).toHaveBeenCalledTimes(1);
      expect(formatReduxSubdailyDate).not.toHaveBeenCalled();
    });

    it('calls formatReduxSubdailyDate when layer period is "subdaily"', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-subdaily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(formatReduxSubdailyDate).toHaveBeenCalledTimes(1);
      expect(formatReduxDailyDate).not.toHaveBeenCalled();
    });

    it('passes the selectedDate from the store to formatReduxDailyDate', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(formatReduxDailyDate).toHaveBeenCalledWith(new Date('2024-01-15T00:00:00Z'));
    });
  });

  // ── makeMeasurementRequest ─────────────────────────────────────────────────

  describe('makeMeasurementRequest', () => {
    it('calls fetchWMSImageExperimental with layerId and formattedDate', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(fetchWMSImageExperimental).toHaveBeenCalledWith(
        'MODIS_Terra_CorrectedReflectance_TrueColor',
        '2024-01-15',
        undefined,
      );
    });

    it('sets img.src to the returned wmsImage url', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
      });
      expect(mockImgInstance.src).toBe('mock-wms-url');
    });

    it('calls calculatePixels with wmsImage when img.onload fires', async () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(calculatePixels).toHaveBeenCalledWith('mock-wms-url');
    });

    it('logs pixel ratio and threshold message when threshold exists', async () => {
      calculatePixels.mockResolvedValue(0.3);
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('The current threshold for MODIS_Terra_CorrectedReflectance_TrueColor is 50%'),
      );
    });

    it('logs pixel ratio with "no current threshold" message when no threshold exists', async () => {
      calculatePixels.mockResolvedValue(0.3);
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-no-threshold'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('There is no current threshold for LAYER_NO_THRESHOLD'),
      );
    });

    it('logs the correct black pixel ratio percentage', async () => {
      calculatePixels.mockResolvedValue(0.25);
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onload) await mockImgInstance.onload();
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('25%'),
      );
    });

    it('calls console.error on img.onerror', async () => {
      const mockError = new Error('image error');
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
        await Promise.resolve();
        if (mockImgInstance.onerror) mockImgInstance.onerror(mockError);
      });
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No image available for MODIS_Terra_CorrectedReflectance_TrueColor on 2024-01-15'),
        mockError,
      );
    });

    it('calls console.error when fetchWMSImageExperimental throws', async () => {
      fetchWMSImageExperimental.mockRejectedValue(new Error('fetch failed'));
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('pixel-test-button'));
      });
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No image available for MODIS_Terra_CorrectedReflectance_TrueColor on 2024-01-15'),
        expect.any(Error),
      );
    });

    it('does not call fetchWMSImageExperimental before the button is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dropdown-select-daily'));
      expect(fetchWMSImageExperimental).not.toHaveBeenCalled();
    });
  });
});
