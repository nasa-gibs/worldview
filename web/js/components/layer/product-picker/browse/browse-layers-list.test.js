/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import BrowseLayerList from './browse-layers-list';

jest.mock('./category-layer-row', () => (props) => <div data-testid="category-layer-row" data-id={props.id} />);

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: (mapContextToProps) => (Component) => (props) => {
    const mappedProps = mapContextToProps({ results: [] });
    return <Component {...props} {...mappedProps} />;
  },
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  hasMeasurementSource: jest.fn(),
}));

jest.mock('../../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => '2026-05-27'),
}));

jest.mock('../../../../modules/product-picker/selectors', () => ({
  getCategoryConfig: jest.fn(() => ({ All: { id: 'all', measurements: [] } })),
}));

const mockStore = configureStore([]);

describe('BrowseLayerList', () => {
  let store;
  let initialState;

  beforeEach(() => {
    initialState = {
      productPicker: {
        category: {
          id: 'test-category',
          measurements: ['meas1', 'meas2'],
        },
        selectedMeasurement: 'meas1',
        selectedMeasurementSourceIndex: 0,
      },
      proj: {
        id: 'proj1',
      },
      config: {
        measurements: {
          meas1: { id: 'meas1' },
          meas2: { id: 'meas2' },
        },
        layers: {},
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and filters measurements based on hasMeasurementSource', () => {
    const { hasMeasurementSource } = require('../../../../modules/layers/selectors');
    hasMeasurementSource.mockImplementation((current) => current.id === 'meas1');

    store = mockStore(initialState);

    const { container } = render(
      <Provider store={store}>
        <BrowseLayerList />
      </Provider>,
    );

    const rows = container.querySelectorAll('[data-testid="category-layer-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute('data-id')).toBe('meas1');
  });

  it('uses fallback category config when productPicker category is null', () => {
    const { hasMeasurementSource } = require('../../../../modules/layers/selectors');
    hasMeasurementSource.mockReturnValue(false);

    initialState.productPicker.category = null;
    store = mockStore(initialState);

    const { container } = render(
      <Provider store={store}>
        <BrowseLayerList />
      </Provider>,
    );

    expect(container.querySelector('#all-list')).not.toBeNull();
  });
});
