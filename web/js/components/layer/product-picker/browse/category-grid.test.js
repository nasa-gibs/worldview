/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import CategoryGrid from './category-grid';
import { getCategoryConfig } from '../../../../modules/product-picker/selectors';
import { hasMeasurementSource as hasSourceSelector } from '../../../../modules/layers/selectors';
import { showMeasurements as showMeasurementsAction } from '../../../../modules/product-picker/actions';

jest.mock('../../../../util/masonry', () => (props) => (
  <div data-testid="masonry-component" data-options={JSON.stringify(props.options)}>
    {props.children}
  </div>
));

jest.mock('./category-cell', () => (props) => (
  <div
    data-testid={`category-cell-${props.category.id}`}
    onClick={() => {
      if (props.drawMeasurements) props.drawMeasurements(props.category, 'test-measurement');
      if (props.hasMeasurementSource) props.hasMeasurementSource('test-current');
    }}
  />
));

jest.mock('../../../../modules/product-picker/actions', () => ({
  showMeasurements: jest.fn(() => ({ type: 'SHOW_MEASUREMENTS' })),
}));

jest.mock('../../../../modules/product-picker/selectors', () => ({
  getCategoryConfig: jest.fn(),
}));

jest.mock('../../../../modules/layers/selectors', () => ({
  hasMeasurementSource: jest.fn(),
}));

const mockStore = configureStore([]);

describe('CategoryGrid', () => {
  let store;
  let initialState;

  beforeEach(() => {
    initialState = {
      proj: { id: 'test-proj' },
      config: { measurements: { test: 'data' } },
      productPicker: {
        category: 'test-category',
        categoryType: 'test-type',
        selectedMeasurement: 'test-measurement',
        selectedMeasurementSourceIndex: 1,
      },
    };
    store = mockStore(initialState);
    store.dispatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and orders categories based on placement', () => {
    getCategoryConfig.mockReturnValue({
      cat1: { id: 'cat1', title: 'Z', placement: 'last' },
      cat2: { id: 'cat2', title: 'Y' },
      cat3: { id: 'cat3', title: 'X', placement: 'first' },
    });

    render(
      <Provider store={store}>
        <CategoryGrid />
      </Provider>,
    );

    expect(screen.getByTestId('masonry-component')).toBeInTheDocument();

    const cells = screen.getAllByTestId(/category-cell-/);
    expect(cells).toHaveLength(3);

    expect(cells[0].getAttribute('data-testid')).toBe('category-cell-cat3');
    expect(cells[1].getAttribute('data-testid')).toBe('category-cell-cat2');
    expect(cells[2].getAttribute('data-testid')).toBe('category-cell-cat1');
  });

  it('handles undefined categoryConfig safely', () => {
    getCategoryConfig.mockReturnValue(undefined);

    render(
      <Provider store={store}>
        <CategoryGrid />
      </Provider>,
    );

    const cells = screen.queryAllByTestId(/category-cell-/);
    expect(cells).toHaveLength(0);
  });

  it('maps dispatch to props correctly for showMeasurements', () => {
    getCategoryConfig.mockReturnValue({
      cat1: { id: 'cat1', title: 'Test' },
    });

    render(
      <Provider store={store}>
        <CategoryGrid />
      </Provider>,
    );

    const cell = screen.getByTestId('category-cell-cat1');
    fireEvent.click(cell);

    expect(showMeasurementsAction).toHaveBeenCalledWith({
      category: expect.objectContaining({ id: 'cat1' }),
      selectedMeasurement: 'test-measurement',
    });
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('maps state to props correctly for hasMeasurementSource', () => {
    getCategoryConfig.mockReturnValue({
      cat1: { id: 'cat1', title: 'Test' },
    });

    render(
      <Provider store={store}>
        <CategoryGrid />
      </Provider>,
    );

    const cell = screen.getByTestId('category-cell-cat1');
    fireEvent.click(cell);

    expect(hasSourceSelector).toHaveBeenCalledWith(
      'test-current',
      initialState.config,
      initialState.proj.id,
    );
  });
});
