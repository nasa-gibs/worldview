import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SelectedDate from './selected-date';

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2023-06-15T00:00:00Z')),
}));

jest.mock('../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => (date ? '2023-06-15' : '')),
}));

const mockConfigureStore = configureStore([]);

function renderComponent(stateOverrides = {}) {
  const store = mockConfigureStore({ date: {}, ...stateOverrides });
  store.dispatch = jest.fn();
  const result = render(
    <Provider store={store}>
      <SelectedDate />
    </Provider>,
  );
  return { ...result, store };
}

describe('SelectedDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getSelectedDate } = require('../modules/date/selectors');
    const { formatDisplayDate } = require('../modules/date/util');
    getSelectedDate.mockReturnValue(new Date('2023-06-15T00:00:00Z'));
    formatDisplayDate.mockImplementation((date) => (date ? '2023-06-15' : ''));
  });

  it('renders the formatted selected date in a div', () => {
    const { container } = renderComponent();
    expect(container.querySelector('div').textContent).toBe('2023-06-15');
  });

  it('calls getSelectedDate with the store state', () => {
    const { getSelectedDate } = require('../modules/date/selectors');
    renderComponent();
    expect(getSelectedDate).toHaveBeenCalled();
  });

  it('calls formatDisplayDate with the value returned by getSelectedDate', () => {
    const { formatDisplayDate } = require('../modules/date/util');
    const date = new Date('2023-06-15T00:00:00Z');
    const { getSelectedDate } = require('../modules/date/selectors');
    getSelectedDate.mockReturnValue(date);
    renderComponent();
    expect(formatDisplayDate).toHaveBeenCalledWith(date);
  });

  it('renders a different date when getSelectedDate returns a different value', () => {
    const { getSelectedDate } = require('../modules/date/selectors');
    const { formatDisplayDate } = require('../modules/date/util');
    getSelectedDate.mockReturnValue(new Date('2020-01-01T00:00:00Z'));
    formatDisplayDate.mockReturnValue('2020-01-01');
    const { container } = renderComponent();
    expect(container.querySelector('div').textContent).toBe('2020-01-01');
  });

  it('renders an empty string when formatDisplayDate returns empty string', () => {
    const { formatDisplayDate } = require('../modules/date/util');
    formatDisplayDate.mockReturnValue('');
    const { container } = renderComponent();
    expect(container.querySelector('div').textContent).toBe('');
  });

  it('wraps the date in a div element', () => {
    const { container } = renderComponent();
    expect(container.firstChild.tagName).toBe('DIV');
  });
});
