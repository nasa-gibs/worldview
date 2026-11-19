/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import PresetConsoleCommands from './dev-preset-console-commands';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ id, className }) => (
    <span id={id} className={className} data-testid="font-awesome-icon" />
  ),
}));

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, style, className,
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={className}
      data-testid={`button-${children.toString().trim()
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      {children}
    </button>
  ),
  UncontrolledTooltip: ({
    children, id, target, placement,
  }) => (
    <div
      data-testid="uncontrolled-tooltip"
      data-id={id}
      data-target={target}
      data-placement={placement}
    >
      {children}
    </div>
  ),
}));

jest.mock('ol/proj', () => ({
  transformExtent: jest.fn((extent) => extent),
}));

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn(() => [{ id: 'layer-1' }, { id: 'layer-2' }]),
}));

import { transformExtent } from 'ol/proj';

const mockStore = configureMockStore();

const mockView = {
  getZoom: jest.fn(() => 5),
  calculateExtent: jest.fn(() => [-180, -90, 180, 90]),
};

const mockMap = {
  getView: jest.fn(() => mockView),
  getSize: jest.fn(() => [800, 600]),
};

const mockActiveLayers = [{ id: 'layer-1' }, { id: 'layer-2' }];
const mockParameters = { proj: 'geographic', t: '2024-01-01' };

function buildStore(overrides = {}) {
  return mockStore({
    map: { ui: { selected: mockMap } },
    compare: { activeString: 'activeA' },
    parameters: mockParameters,
    ...overrides,
  });
}

function renderComponent(storeOverride) {
  const store = storeOverride ?? buildStore();
  const utils = render(
    <Provider store={store}>
      <PresetConsoleCommands />
    </Provider>,
  );
  return { ...utils, store };
}

describe('PresetConsoleCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.table.mockRestore();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the "Preset Console Commands" heading', () => {
      renderComponent();
      expect(screen.getByText('Preset Console Commands')).toBeInTheDocument();
    });

    it('renders the heading as an h5 element', () => {
      renderComponent();
      expect(screen.getByText('Preset Console Commands').tagName).toBe('H5');
    });

    it('renders the info icon', () => {
      renderComponent();
      expect(screen.getByTestId('font-awesome-icon')).toBeInTheDocument();
    });

    it('renders the tooltip with correct id', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-id', 'console-test-tooltip');
    });

    it('renders the tooltip with correct target', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-target', 'console-test-info-icon');
    });

    it('renders the tooltip with placement "right"', () => {
      renderComponent();
      expect(screen.getByTestId('uncontrolled-tooltip')).toHaveAttribute('data-placement', 'right');
    });

    it('renders the tooltip with the correct content', () => {
      renderComponent();
      expect(screen.getByText('Print preset commands to the console.')).toBeInTheDocument();
    });

    it('renders the "Get Zoom" button', () => {
      renderComponent();
      expect(screen.getByText('Get Zoom')).toBeInTheDocument();
    });

    it('renders the "Get Visible Extent" button', () => {
      renderComponent();
      expect(screen.getByText('Get Visible Extent')).toBeInTheDocument();
    });

    it('renders the "Get Active Layers" button', () => {
      renderComponent();
      expect(screen.getByText('Get Active Layers')).toBeInTheDocument();
    });

    it('renders the "Get Parameters" button', () => {
      renderComponent();
      expect(screen.getByText('Get Parameters')).toBeInTheDocument();
    });

    it('renders all four buttons', () => {
      renderComponent();
      expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('renders the horizontal divider span', () => {
      const { container } = renderComponent();
      expect(container.querySelector('span.border-top')).toBeInTheDocument();
    });
  });

  describe('Layout and CSS classes', () => {
    it('renders the outer wrapper with correct flex classes', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass('d-flex', 'flex-column', 'justify-content-center', 'align-items-center', 'w-100', 'mt-3');
    });

    it('renders the inner header row with correct flex classes', () => {
      const { container } = renderComponent();
      const innerRow = container.querySelector('.d-flex.flex-row');
      expect(innerRow).toBeInTheDocument();
      expect(innerRow).toHaveClass('justify-content-center', 'align-items-center');
    });

    it('renders the heading with correct classes', () => {
      renderComponent();
      expect(screen.getByText('Preset Console Commands')).toHaveClass('h5', 'fw-bold', 'd-inline-block', 'me-1');
    });

    it('renders "Get Zoom" button with mb-3 class', () => {
      renderComponent();
      expect(screen.getByTestId('button-get-zoom')).toHaveClass('mb-3');
    });

    it('renders "Get Visible Extent" button with mb-3 class', () => {
      renderComponent();
      expect(screen.getByTestId('button-get-visible-extent')).toHaveClass('mb-3');
    });

    it('renders all buttons with the correct background color', () => {
      renderComponent();
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toHaveStyle({ backgroundColor: '#d54e21' });
      });
    });

    it('renders all buttons with 48% width', () => {
      renderComponent();
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toHaveStyle({ width: '48%' });
      });
    });
  });

  describe('getZoom', () => {
    it('calls map.getView().getZoom() when "Get Zoom" is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Zoom'));
      expect(mockView.getZoom).toHaveBeenCalledTimes(1);
    });

    it('logs the zoom level when "Get Zoom" is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Zoom'));
      expect(console.log).toHaveBeenCalledWith(5);
    });

    it('logs the correct zoom value from the map view', () => {
      mockView.getZoom.mockReturnValue(8);
      renderComponent();
      fireEvent.click(screen.getByText('Get Zoom'));
      expect(console.log).toHaveBeenCalledWith(8);
    });

    it('does not call console.log before "Get Zoom" is clicked', () => {
      renderComponent();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('getVisibleExtent', () => {
    it('calls map.getView().calculateExtent() with map size when "Get Visible Extent" is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(mockView.calculateExtent).toHaveBeenCalledWith([800, 600]);
    });

    it('logs the EPSG:4326 header', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(console.log).toHaveBeenCalledWith('------ESPG:4326------');
    });

    it('logs the EPSG:3857 header', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(console.log).toHaveBeenCalledWith('------ESPG:3857------');
    });

    it('calls console.table with the raw extent', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(console.table).toHaveBeenCalledWith([-180, -90, 180, 90]);
    });

    it('calls transformExtent with correct arguments', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(transformExtent).toHaveBeenCalledWith([-180, -90, 180, 90], 'EPSG:4326', 'EPSG:3857');
    });

    it('calls console.table with the transformed extent', () => {
      const transformed = [100, 200, 300, 400];
      transformExtent.mockReturnValue(transformed);
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(console.table).toHaveBeenCalledWith(transformed);
    });

    it('calls console.log twice and console.table twice', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Visible Extent'));
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.table).toHaveBeenCalledTimes(2);
    });
  });

  describe('returnActiveLayers', () => {
    it('logs activeLayers when "Get Active Layers" is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Active Layers'));
      expect(console.log).toHaveBeenCalledWith(mockActiveLayers);
    });

    it('does not call console.log before "Get Active Layers" is clicked', () => {
      renderComponent();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('calls console.log exactly once when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Active Layers'));
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });

  describe('getParameters', () => {
    it('logs parameters when "Get Parameters" is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Parameters'));
      expect(console.log).toHaveBeenCalledWith(mockParameters);
    });

    it('does not call console.log before "Get Parameters" is clicked', () => {
      renderComponent();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('logs updated parameters when the store has different values', () => {
      const customParams = { proj: 'arctic', t: '2020-06-15' };
      renderComponent(buildStore({ parameters: customParams }));
      fireEvent.click(screen.getByText('Get Parameters'));
      expect(console.log).toHaveBeenCalledWith(customParams);
    });

    it('calls console.log exactly once when clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Get Parameters'));
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });
});
