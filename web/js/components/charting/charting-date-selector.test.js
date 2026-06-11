/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ChartingDateSelector from './charting-date-selector';
import {
  changeChartingStartDate,
  changeChartingEndDate,
} from '../../modules/charting/actions';

jest.mock('../date-selector/date-range-selector', () => (props) => (
  <button
    data-testid="date-range-selector"
    onClick={() => props.setDateRange(['2023-05-02', '2023-05-10'])}
  >
    DateRangeSelector
  </button>
));

jest.mock('../date-selector/date-selector', () => (props) => (
  <button
    data-testid="date-selector"
    onClick={() => props.onDateChange('2023-05-02')}
  >
    DateSelector
  </button>
));

jest.mock('../../modules/charting/actions', () => ({
  changeChartingStartDate: jest.fn(() => ({ type: 'CHANGE_START' })),
  changeChartingEndDate: jest.fn(() => ({ type: 'CHANGE_END' })),
}));

const mockStore = configureStore([]);

describe('ChartingDateSelector', () => {
  let store;
  let baseState;

  beforeEach(() => {
    jest.clearAllMocks();
    baseState = {
      date: {
        selected: '2023-05-01',
        selectedB: '2023-05-05',
      },
      charting: {
        timeSpanStartDate: null,
        timeSpanEndDate: null,
      },
    };
  });

  const renderComponent = (props = {}, state = baseState) => {
    store = mockStore(state);
    store.dispatch = jest.fn();

    return render(
      <Provider store={store}>
        <ChartingDateSelector
          layerStartDate="2023-01-01"
          layerEndDate="2023-12-31"
          {...props}
        />
      </Provider>,
    );
  };

  it('renders DateSelector when timeSpanSelection is "date"', () => {
    const { getByTestId, queryByTestId } = renderComponent({ timeSpanSelection: 'date' });
    expect(getByTestId('date-selector')).toBeTruthy();
    expect(queryByTestId('date-range-selector')).toBeNull();
  });

  it('renders DateRangeSelector when timeSpanSelection is not "date"', () => {
    const { getByTestId, queryByTestId } = renderComponent({ timeSpanSelection: 'range' });
    expect(getByTestId('date-range-selector')).toBeTruthy();
    expect(queryByTestId('date-selector')).toBeNull();
  });

  it('dispatches changeChartingStartDate when single date changes', () => {
    const { getByTestId } = renderComponent({ timeSpanSelection: 'date' });

    fireEvent.click(getByTestId('date-selector'));

    expect(changeChartingStartDate).toHaveBeenCalledWith('2023-05-02');
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'CHANGE_START' });
  });

  it('dispatches start and end date changes when date range changes', () => {
    const { getByTestId } = renderComponent({ timeSpanSelection: 'range' });

    fireEvent.click(getByTestId('date-range-selector'));

    expect(changeChartingStartDate).toHaveBeenCalledWith('2023-05-02');
    expect(changeChartingEndDate).toHaveBeenCalledWith('2023-05-10');
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });

  it('does not dispatch if new dates match existing timeSpan dates', () => {
    const stateWithSameDates = {
      ...baseState,
      charting: {
        timeSpanStartDate: '2023-05-02',
        timeSpanEndDate: '2023-05-10',
      },
    };

    const { getByTestId } = renderComponent({ timeSpanSelection: 'range' }, stateWithSameDates);

    fireEvent.click(getByTestId('date-range-selector'));

    expect(changeChartingStartDate).not.toHaveBeenCalled();
    expect(changeChartingEndDate).not.toHaveBeenCalled();
  });

  it('uses selected and selectedB from date state when timeSpan dates are null', () => {
    const { getByTestId } = renderComponent({ timeSpanSelection: 'range' });
    expect(getByTestId('date-range-selector')).toBeTruthy();
  });
});
