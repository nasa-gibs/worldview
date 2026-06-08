/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MeasurementLayerRow from './measurement-layer-row';
import { addLayer, removeLayer } from '../../../../modules/layers/actions';
import { available } from '../../../../modules/layers/selectors';
import { getLayerNoticesForLayer } from '../../../../modules/notifications/util';

jest.mock('reactstrap', () => ({
  ListGroupItem: ({ children, className, id }) => (
    <div data-testid="list-group-item" className={className} id={id}>
      {children}
    </div>
  ),
  UncontrolledTooltip: ({ children, target }) => (
    <div data-testid="uncontrolled-tooltip" data-target={target}>
      {children}
    </div>
  ),
}));

jest.mock('../../../util/checkbox', () => ({ children, onCheck, checked, label, id, name }) => (
  <div data-testid="checkbox">
    <input
      type="checkbox"
      onClick={onCheck}
      checked={checked}
      id={id}
      data-label={label}
      data-name={name}
    />
    <label htmlFor={id}>{label}</label>
    {children}
  </div>
));

jest.mock('../../../selected-date', () => () => <span data-testid="selected-date">2026-05-27</span>);

jest.mock('../../../util/monospace-date', () => ({ children }) => (
  <span data-testid="monospace-date">{children}</span>
));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, id }) => <svg data-testid={`fa-icon-${icon}`} id={id} />,
}));

jest.mock('../../../../modules/layers/actions', () => ({
  addLayer: jest.fn(() => ({ type: 'ADD_LAYER' })),
  removeLayer: jest.fn(() => ({ type: 'REMOVE_LAYER' })),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  available: jest.fn(() => true),
  getActiveLayersMap: jest.fn((state) => state.layers.active || {}),
}));

jest.mock('../../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => '2026-05-27'),
}));

jest.mock('../../../../modules/notifications/util', () => ({
  getLayerNoticesForLayer: jest.fn(() => null),
}));

const mockStore = configureStore([]);

describe('MeasurementLayerRow', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      layers: {
        active: {},
      },
      date: {
        selected: '2026-05-27',
      },
      screenSize: {
        isMobile: false,
      },
      notifications: {
        items: [],
      },
      config: {
        features: {
          dataDownload: {
            active: true,
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    expect(screen.getByTestId('list-group-item')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Test Layer Title')).toBeInTheDocument();
  });

  it('dispatches addLayer action when checkbox is checked and layer is not enabled', () => {
    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(addLayer).toHaveBeenCalledWith('test-layer-1');
  });

  it('dispatches removeLayer action when checkbox is unchecked and layer is enabled', () => {
    const storeWithActiveLayer = mockStore({
      layers: {
        active: { 'test-layer-1': true },
      },
      date: {
        selected: '2026-05-27',
      },
      screenSize: {
        isMobile: false,
      },
      notifications: {
        items: [],
      },
      config: {
        features: {
          dataDownload: {
            active: true,
          },
        },
      },
    });

    render(
      <Provider store={storeWithActiveLayer}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(removeLayer).toHaveBeenCalledWith('test-layer-1');
  });

  it('renders unavailable icon and tooltip when layer is unavailable', () => {
    available.mockReturnValue(false);

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    expect(screen.getByTestId('fa-icon-ban')).toBeInTheDocument();
    expect(screen.getByTestId('uncontrolled-tooltip')).toBeInTheDocument();
    expect(screen.getByText(/This layer has no visible content on the selected date/)).toBeInTheDocument();
  });

  it('renders notice icon and tooltip when layer has notices', () => {
    available.mockReturnValue(true);
    getLayerNoticesForLayer.mockReturnValue('<div>Test Notice</div>');

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    expect(screen.getByTestId('fa-icon-exclamation-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('uncontrolled-tooltip')).toBeInTheDocument();
  });

  it('renders chartable icon when layer is chartable', () => {
    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{
            id: 'test-layer-1',
            title: 'Test Layer',
            palette: true,
            colormapType: 'continuous',
            layerPeriod: 'Daily',
          }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const chartableIcon = screen.getByTestId('list-group-item').querySelector('.chartable-icon');
    expect(chartableIcon).toBeInTheDocument();
  });

  it('handles mouse enter and leave events on chartable icon', () => {
    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{
            id: 'test-layer-1',
            title: 'Test Layer',
            palette: true,
            colormapType: 'continuous',
            layerPeriod: 'Daily',
          }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const wrapper = screen.getByTestId('list-group-item').querySelector('.chartable-icon-wrapper');

    if (wrapper) {
      fireEvent.mouseEnter(wrapper);
      expect(screen.getByTestId('uncontrolled-tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(wrapper);
    }
  });

  it('applies unavailable class when layer is unavailable', () => {
    available.mockReturnValue(false);

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const listItem = screen.getByTestId('list-group-item');
    expect(listItem).toHaveClass('unavailable');
  });

  it('applies unavailable class when layer has notices', () => {
    available.mockReturnValue(true);
    getLayerNoticesForLayer.mockReturnValue('<div>Notice</div>');

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const listItem = screen.getByTestId('list-group-item');
    expect(listItem).toHaveClass('unavailable');
  });

  it('replaces periods in layer id for element ids', () => {
    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test.layer.with.periods', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const listItem = screen.getByTestId('list-group-item');
    expect(listItem.id).toBe('checkbox-case-test-layer-with-periods');
  });

  it('renders SelectedDate component in tooltip when layer is unavailable', () => {
    available.mockReturnValue(false);

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    expect(screen.getByTestId('selected-date')).toBeInTheDocument();
    expect(screen.getByTestId('monospace-date')).toBeInTheDocument();
  });

  it('displays layer notices as HTML in tooltip', () => {
    available.mockReturnValue(true);
    getLayerNoticesForLayer.mockReturnValue('<strong>Important Notice</strong>');

    render(
      <Provider store={store}>
        <MeasurementLayerRow
          layer={{ id: 'test-layer-1', title: 'Test Layer' }}
          measurementId="test-measurement"
          title="Test Layer Title"
        />
      </Provider>,
    );

    const tooltip = screen.getByTestId('uncontrolled-tooltip');
    expect(tooltip.innerHTML).toContain('<strong>Important Notice</strong>');
  });
});
