/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import CustomIntervalSelector from './custom-interval-selector';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <span data-testid="close-icon" onClick={props.onClick} />,
}));

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
  toggleCustomModal: jest.fn((open, by) => ({ type: 'TOGGLE_MODAL', open, by })),
  changeCustomInterval: jest.fn((delta, scale) => ({ type: 'CHANGE_INTERVAL', delta, scale })),
}));

const dateActions = require('../../../modules/date/actions');

const mockStore = configureStore([]);

function renderSelector(props = {}, stateOverrides = {}) {
  const store = mockStore({
    date: {
      customDelta: stateOverrides.customDelta,
      customInterval: stateOverrides.customInterval,
      interval: stateOverrides.interval ?? 3,
    },
  });
  store.dispatch = jest.fn();
  const utils = render(
    <Provider store={store}>
      <CustomIntervalSelector
        modalOpen={props.modalOpen ?? true}
        hasSubdailyLayers={props.hasSubdailyLayers}
      />
    </Provider>,
  );
  return { store, ...utils };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CustomIntervalSelector', () => {
  it('renders nothing when the modal is closed', () => {
    const { container } = renderSelector({ modalOpen: false });
    expect(container.querySelector('.custom-interval-widget')).toBeNull();
  });

  it('renders the widget and header when the modal is open', () => {
    const { getByText, container } = renderSelector({ modalOpen: true });
    expect(getByText('Custom Interval Selector')).toBeTruthy();
    expect(container.querySelector('.custom-interval-widget')).toBeTruthy();
  });

  it('adds the subdaily class when subdaily layers exist', () => {
    const { container } = renderSelector({ modalOpen: true, hasSubdailyLayers: true });
    expect(container.querySelector('.custom-interval-widget.subdaily')).toBeTruthy();
  });

  it('dispatches a custom interval change for a valid delta', () => {
    const { getByTestId, store } = renderSelector();
    fireEvent.click(getByTestId('delta-valid'));
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
    // TIME_SCALE_TO_NUMBER.month === 2
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(1, 2);
  });

  it('closes the modal when the close icon is clicked', () => {
    const { getByTestId } = renderSelector();
    fireEvent.click(getByTestId('close-icon'));
    expect(dateActions.toggleCustomModal).toHaveBeenCalledWith(false, undefined);
  });

  it('closes the modal on Escape keypress', () => {
    const { container } = renderSelector();
    fireEvent.keyDown(container.querySelector('.custom-interval-widget'), { key: 'Escape' });
    expect(dateActions.toggleCustomModal).toHaveBeenCalledWith(false, undefined);
  });

  it('ignores non-Escape keypresses', () => {
    const { container } = renderSelector();
    fireEvent.keyDown(container.querySelector('.custom-interval-widget'), { key: 'Enter' });
    expect(dateActions.toggleCustomModal).not.toHaveBeenCalled();
  });

  it('uses customDelta and customInterval from state when present', () => {
    const { getByTestId } = renderSelector({}, { customDelta: 4, customInterval: 2 });
    fireEvent.click(getByTestId('delta-valid'));
    expect(dateActions.changeCustomInterval).toHaveBeenCalledWith(5, 2);
  });
});
