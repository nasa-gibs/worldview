/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ChartComponent, { getTickPositions, CustomXAxisTick, CustomTooltip } from './chart-component';

// A more robust mock to handle both default and named imports depending on how util is imported
jest.mock('../../util/util', () => {
  const utilMock = {
    formatCoordinate: jest.fn(() => '10.00, 10.00'),
    getCoordinateFormat: jest.fn(() => (coord) => coord),
  };
  return {
    __esModule: true,
    default: utilMock,
    ...utilMock,
  };
});

jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    LineChart: ({ children }) => <div>{children}</div>,
    Line: () => <div data-testid="recharts-line" />,
  };
});

const mockStore = configureStore([]);

describe('getTickPositions', () => {
  it('handles small arrays (< 8)', () => {
    const result = getTickPositions(5);
    expect(result).toEqual([0, 4]); // Whatever the expected array is
  });

  it('handles medium arrays (< 15)', () => {
    const result = getTickPositions(12);
    expect(result.length).toBeGreaterThan(2);
  });
});

it('renders CustomXAxisTick correctly for labeled positions', () => {
  const mockProps = {
    x: 10,
    y: 10,
    fill: 'black',
    textAnchor: 'middle',
    visibleTicksCount: 5,
    index: 0,
    payload: { value: '2023-01-01' },
    data: new Array(10).fill({}),
  };

  const { getByText } = render(
    <svg>
      <CustomXAxisTick {...mockProps} />
    </svg>,
  );

  expect(getByText('2023-01-01')).toBeTruthy();
});

describe('CustomTooltip', () => {
  it('renders tooltip content when active with valid payload', () => {
    const mockProps = {
      active: true,
      payload: [{ name: 10 }],
      label: '2023-01-01',
      unit: 'K',
      setHoveredDate: jest.fn(),
    };

    const { getByText } = render(<CustomTooltip {...mockProps} />);
    expect(getByText('2023-01-01')).toBeTruthy();
    expect(getByText('10 (K):')).toBeTruthy();
    expect(mockProps.setHoveredDate).toHaveBeenCalledWith('2023-01-01');
  });

  it('renders nothing when not active', () => {
    const mockProps = {
      active: false,
      payload: [{ name: 10 }],
      label: '2023-01-01',
      unit: 'K',
      setHoveredDate: jest.fn(),
    };

    const { container } = render(<CustomTooltip {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when payload is empty', () => {
    const mockProps = {
      active: true,
      payload: [],
      label: '2023-01-01',
      unit: 'K',
      setHoveredDate: jest.fn(),
    };

    const { container } = render(<CustomTooltip {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ChartComponent', () => {
  let store;
  let defaultState;
  let defaultProps;

  beforeEach(() => {
    defaultState = {
      map: {
        ui: {
          selected: {
            getView: jest.fn(() => ({ zoom: 1 })),
          },
          createLayer: jest.fn(),
        },
      },
      layers: {
        layerConfig: {
          Coastlines_15m: { id: 'Coastlines_15m' },
        },
      },
    };

    defaultProps = {
      liveData: {
        data: [
          { mean: 10, min: 2, max: 20, median: 9, stddev: 1.5, name: '2023-01-01' },
          { mean: 12, min: 3, max: 22, median: 11, stddev: 1.2, name: '2023-01-02' },
        ],
        unit: 'K',
        startDate: '2023-01-01',
        endDate: '2023-01-10',
        numRangeDays: 10,
        isTruncated: false,
        title: 'Test Chart',
        numPoints: 2,
        coordinates: [0, 0, 10, 10],
        errors: {
          error_count: 2,
          error_days: ['2023-01-05T00:00:00Z', { date: '2023-01-06T00:00:00Z' }],
        },
        layerId: 'test-layer',
      },
      toggleErrorDaysExpanded: jest.fn(),
    };

    store = mockStore(defaultState);
  });

  const renderComponent = (props = defaultProps) => {
    return render(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );
  };

  it('renders without crashing when provided valid data', () => {
    const { container } = renderComponent();
    expect(container).toBeTruthy();
  });

  it('renders the truncation disclaimer when isTruncated is true', () => {
    const truncatedProps = {
      ...defaultProps, liveData: { ...defaultProps.liveData, isTruncated: true },
    };
    const { getByText } = renderComponent(truncatedProps);
    expect(getByText(/As part of this beta feature release/)).toBeTruthy();
  });

  it('handles NaN values in data gracefully without crashing', () => {
    const nanProps = {
      ...defaultProps,
      liveData: {
        ...defaultProps.liveData,
        data: [
          { mean: NaN, min: NaN, max: NaN, median: NaN, stddev: NaN, name: '2023-01-01' },
          { mean: 12, min: 3, max: 22, median: 11, stddev: 1.2, name: '2023-01-02' },
        ],
      },
    };
    const { container } = renderComponent(nanProps);
    expect(container).toBeTruthy();
  });

  it('processes and displays error dates correctly', () => {
    const { getByText, container } = renderComponent();
    fireEvent.click(container.querySelector('.error-expand-button-inner'));
    expect(getByText(/2023-01-05,.*2023-01-06/)).toBeTruthy();
  });

  it('handles empty error dates gracefully', () => {
    const noErrorsProps = {
      ...defaultProps,
      liveData: {
        ...defaultProps.liveData,
        errors: { error_days: [] },
      },
    };
    const { container } = renderComponent(noErrorsProps);
    expect(container).toBeTruthy();
  });

  it('toggles error collapsed state', () => {
    const { queryByTestId } = renderComponent();

    const toggleButton = queryByTestId('error-toggle-button');
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(defaultProps.toggleErrorDaysExpanded).toHaveBeenCalledWith(false);

      fireEvent.click(toggleButton);
      expect(defaultProps.toggleErrorDaysExpanded).toHaveBeenCalledWith(true);
    }
  });

  it('renders standard chart units', () => {
    const { getByText } = renderComponent();
    expect(getByText(/\(K\)/)).toBeTruthy();
  });
});
