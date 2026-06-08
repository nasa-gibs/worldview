import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ChartingInfo from './charting-info';
import onClickFeedback from '../../modules/feedback/util';
import initFeedback from '../../modules/feedback/actions';

jest.mock('../../modules/feedback/util', () => jest.fn());
jest.mock('../../modules/feedback/actions', () => jest.fn(() => ({ type: 'INIT_FEEDBACK' })));

const mockStore = configureStore([]);

describe('ChartingInfo', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      feedback: { isInitiated: false },
      screenSize: { isMobileDevice: true },
    });
    store.dispatch = jest.fn();
  });

  const renderComponent = (customStore) => {
    return render(
      <Provider store={customStore || store}>
        <ChartingInfo />
      </Provider>,
    );
  };

  it('renders the charting info text', () => {
    const { container, getByText } = renderComponent();
    expect(container.querySelector('.charting-info-container')).toBeTruthy();
    expect(getByText(/The charting feature is available for beta testing/i)).toBeTruthy();
  });

  it('calls onClickFeedback and dispatches initFeedback when feedback span is clicked', () => {
    const { getByText } = renderComponent();
    const feedbackSpan = getByText('Please send comments and feedback to us.');

    fireEvent.click(feedbackSpan);

    expect(onClickFeedback).toHaveBeenCalledWith(false, true);
    expect(initFeedback).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'INIT_FEEDBACK' });
  });

  it('calls onClickFeedback but does not dispatch initFeedback when feedback is already initiated', () => {
    const customStore = mockStore({
      feedback: { isInitiated: true },
      screenSize: { isMobileDevice: false },
    });
    customStore.dispatch = jest.fn();

    const { getByText } = renderComponent(customStore);
    const feedbackSpan = getByText('Please send comments and feedback to us.');

    fireEvent.click(feedbackSpan);

    expect(onClickFeedback).toHaveBeenCalledWith(true, false);
    expect(initFeedback).not.toHaveBeenCalled();
    expect(customStore.dispatch).not.toHaveBeenCalled();
  });

  it('triggers feedback on Enter keydown', () => {
    const { getByText } = renderComponent();
    const feedbackSpan = getByText('Please send comments and feedback to us.');

    fireEvent.keyDown(feedbackSpan, { key: 'Enter', code: 'Enter' });

    expect(initFeedback).toHaveBeenCalled();
  });

  it('does not trigger feedback on other keydown events', () => {
    const { getByText } = renderComponent();
    const feedbackSpan = getByText('Please send comments and feedback to us.');

    fireEvent.keyDown(feedbackSpan, { key: 'Space', code: 'Space' });

    expect(onClickFeedback).not.toHaveBeenCalled();
    expect(initFeedback).not.toHaveBeenCalled();
  });
});
