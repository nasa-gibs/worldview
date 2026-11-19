/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import CategoryLayerRow from './category-layer-row';
import { selectMeasurement as selectMeasurementAction } from '../../../../modules/product-picker/actions';

jest.mock('./measurement-layer-row', () => () => <div data-testid="measurement-layer-row" />);
jest.mock('./measurement-metadata-detail', () => () => <div data-testid="measurement-metadata-detail" />);
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`fa-icon-${icon}`} />,
}));
jest.mock('reactstrap', () => ({
  TabContent: ({ children }) => <div>{children}</div>,
  TabPane: ({ children }) => <div>{children}</div>,
  Nav: ({ children }) => <nav>{children}</nav>,
  NavItem: ({ children }) => <div>{children}</div>,
  ListGroup: ({ children }) => <div data-testid="list-group">{children}</div>,
}));

jest.mock('../../../../modules/layers/util', () => ({
  getOrbitTrackTitle: jest.fn(() => 'Mock Orbit Title'),
}));

jest.mock('../../../../modules/product-picker/actions', () => ({
  selectMeasurement: jest.fn(() => ({ type: 'SELECT_MEASUREMENT' })),
  selectSource: jest.fn(() => ({ type: 'SELECT_SOURCE' })),
}));

jest.mock('../../../../modules/product-picker/selectors', () => ({
  getSourcesForProjection: jest.fn(() => [
    {
      id: 'source1',
      title: 'Source 1',
      settings: ['layer1'],
      layergroup: 'Orbital Track',
    },
    {
      id: 'source2',
      title: 'Source 2',
      settings: ['layer2'],
      layergroup: 'Other',
    },
  ]),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  hasMeasurementSetting: jest.fn(() => true),
}));

const mockStore = configureStore([]);
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('CategoryLayerRow', () => {
  let store;
  let baseProps;

  beforeEach(() => {
    store = mockStore({
      config: {
        layers: {
          layer1: {
            id: 'layer1',
            projections: ['EPSG:4326'],
          },
          layer2: {
            id: 'layer2',
            projections: ['EPSG:4326'],
          },
        },
      },
      productPicker: {
        selectedMeasurement: 'none',
        selectedMeasurementSourceIndex: 0,
      },
      proj: {
        id: 'EPSG:4326',
      },
      screenSize: {
        isMobileDevice: false,
      },
    });
    baseProps = {
      id: 'meas1',
      category: { id: 'cat1' },
      measurement: {
        id: 'meas1',
        title: 'Test Measurement Title',
        subtitle: 'Test Subtitle',
      },
      isSelected: false,
      categoryType: 'standard',
    };
    window.HTMLElement.prototype.scrollIntoView.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when not selected', () => {
    render(
      <Provider store={store}>
        <CategoryLayerRow {...baseProps} />
      </Provider>,
    );

    expect(screen.getByText('Test Measurement Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('fa-icon-chevron-circle-right')).toBeInTheDocument();

    const containerDiv = screen.getByText('Test Measurement Title').closest('.measurement-row');
    expect(containerDiv).not.toHaveClass('selected');
  });

  it('renders correctly when selected and hides subtitle', () => {
    const selectedProps = {
      ...baseProps,
      isSelected: true,
      selectedMeasurement: 'meas1',
    };

    render(
      <Provider store={store}>
        <CategoryLayerRow {...selectedProps} />
      </Provider>,
    );

    expect(screen.getByText('Test Measurement Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
    expect(screen.getByTestId('fa-icon-chevron-circle-down')).toBeInTheDocument();

    const containerDiv = screen.getByText('Test Measurement Title').closest('.measurement-row');
    expect(containerDiv).toHaveClass('selected');
  });

  it('scrolls into view on mount if selected and categoryType is not featured', () => {
    const selectedProps = {
      ...baseProps,
      isSelected: true,
      categoryType: 'standard',
    };

    // Create a new store with the selectedMeasurement set to 'meas1'
    const selectedStore = mockStore({
      ...store.getState(),
      productPicker: {
        ...store.getState().productPicker,
        selectedMeasurement: 'meas1',
      },
    });

    render(
      <Provider store={selectedStore}>
        <CategoryLayerRow {...selectedProps} />
      </Provider>,
    );

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith(true);
  });

  it('does not scroll into view if categoryType is featured', () => {
    const selectedProps = {
      ...baseProps,
      selectedMeasurement: 'meas1',
      categoryType: 'featured',
    };

    render(
      <Provider store={store}>
        <CategoryLayerRow {...selectedProps} />
      </Provider>,
    );

    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('dispatches selectMeasurement when header button is clicked', () => {
    render(
      <Provider store={store}>
        <CategoryLayerRow {...baseProps} />
      </Provider>,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(selectMeasurementAction).toHaveBeenCalledWith('meas1');
    expect(store.getActions()).toEqual([{ type: 'SELECT_MEASUREMENT' }]);
  });
});
