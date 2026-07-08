/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MobileCustomIntervalSelector from './mobile-custom-interval-selector';

jest.mock('./delta-input', () => (props) => (
  <div>
    <button type="button" data-testid="delta-valid" onClick={() => props.changeDelta(5)}>v</button>
    <button type="button" data-testid="delta-invalid" onClick={() => props.changeDelta(2000)}>i</button>
  </div>
));

jest.mock('./interval-select', () => (props) => (
  <button type="button" data-testid="interval-select" onClick={() => props.changeZoomLevel('month')}>
    {props.zoomLevel}
  </button>
));

jest.mock('../../../modules/date/actions', () => ({
  selectInterval: jest.fn((...args) => ({ type: 'SELECT_INTERVAL', args })),
  changeCustomInterval: jest.fn((delta, scale) => ({ type: 'CHANGE_INTERVAL', delta, scale })),
}));

const dateActions = require('../../../modules/date/actions');

const mockStore = configureStore([]);

function renderSelector(stateOverrides = {}, ownProps = {}) {
  const store = mockStore({
    date: {
      interval: stateOverrides.interval ?? 3,
      customInterval: stateOverrides.customInterval,
      customDelta: stateOverrides.customDelta,
      customSelected: stateOverrides.customSelected ?? false,
    },
    screenSize: { isMobileDevice: stateOverrides.isMobile ?? true },
  });
  store.dispatch = jest.fn();
  const utils = render(
    <Provider store={store}>
      <MobileCustomIntervalSelector hasSubdailyLayers={ownProps.hasSubdailyLayers} />
    </Provider>,
  );
  return { store, ...utils };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MobileCustomIntervalSelector', () => {
  it('renders the interval selector header and controls', () => {
    const { getByText, getByTestId } = renderSelector();
    expect(getByText('Interval Selector')).toBeTruthy();
    expect(getByTestId('delta-valid')).toBeTruthy();
    expect(getByTestId('interval-select')).toBeTruthy();
  });

  it('dispatches a custom interval change for a valid delta', () => {
    const { getByTestId, store } = renderSelector();
    fireEvent.click(getByTestId('delta-valid'));
    // customInterval defaults to interval (3) when unset
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(5, 3);
    expect(store.dispatch).toHaveBeenCalled();
  });

  it('does not dispatch for an out-of-range delta', () => {
    const { getByTestId } = renderSelector();
    fireEvent.click(getByTestId('delta-invalid'));
    expect(dateActions.changeCustomInterval).not.toHaveBeenCalled();
  });

  it('dispatches a custom interval change when the zoom level changes', () => {
    const { getByTestId } = renderSelector();
    fireEvent.click(getByTestId('interval-select'));
    // customDelta defaults to 1, TIME_SCALE_TO_NUMBER.month === 2
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(1, 2);
  });

  it('uses customDelta and customInterval from state when present', () => {
    const { getByTestId } = renderSelector({ customDelta: 7, customInterval: 4 });
    fireEvent.click(getByTestId('delta-valid'));
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(5, 4);
    fireEvent.click(getByTestId('interval-select'));
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(7, 2);
  });
});
