/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SmartHandoffModal from './smart-handoff-modal';
import safeLocalStorage from '../../util/local-storage';

jest.mock('googleTagManager', () => ({
  pushEvent: jest.fn(),
}));

jest.mock('../util/button', () => (props) => (
  <button type="button" data-testid={props.id} onClick={props.onClick}>
    {props.text}
  </button>
));

jest.mock('../util/checkbox', () => (props) => (
  <button
    type="button"
    data-testid={props.id}
    data-checked={`${props.checked}`}
    onClick={props.onCheck}
  >
    {props.label}
  </button>
));

jest.mock('../../modules/smart-handoff/selectors', () => ({
  getConceptUrl: jest.fn(() => () => 'https://cmr.example.com/concept/C123'),
}));

const googleTagManager = require('googleTagManager');

const { HIDE_EDS_WARNING } = safeLocalStorage.keys;
const mockStore = configureStore([]);

function buildProps(overrides = {}) {
  return {
    displayDate: '2023-05-01',
    continueToEDS: jest.fn(),
    selectedLayer: {
      title: 'MODIS Layer',
      subtitle: 'Terra',
      dateRanges: [{ startDate: '2020-01-01' }],
    },
    selectedCollection: {
      value: 'C123-PROV',
      title: 'MODIS Collection',
      type: 'STD',
      version: '6.1',
    },
    ...overrides,
  };
}

function renderModal(overrides = {}) {
  const props = buildProps(overrides);
  const store = mockStore({});
  store.dispatch = jest.fn();
  const utils = render(
    <Provider store={store}>
      <SmartHandoffModal {...props} />
    </Provider>,
  );
  return { props, ...utils };
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('SmartHandoffModal rendering', () => {
  it('renders the collection type label with version', () => {
    const { getByText } = renderModal();
    expect(getByText('Standard - v6.1')).toBeTruthy();
  });

  it('renders the collection type label without version when none is set', () => {
    const { getByText } = renderModal({
      selectedCollection: {
        value: 'C1', title: 'C', type: 'NRT', version: undefined,
      },
    });
    expect(getByText('Near Real-Time')).toBeTruthy();
  });

  it('renders the collection detail link with the title', () => {
    const { getByText } = renderModal();
    const link = getByText('MODIS Collection');
    expect(link.getAttribute('href')).toBe('https://cmr.example.com/concept/C123');
  });

  it('falls back to "Details" when the collection has no title', () => {
    const { getByText } = renderModal({
      selectedCollection: {
        value: 'C1', title: '', type: 'STD', version: '1',
      },
    });
    expect(getByText('Details')).toBeTruthy();
  });

  it('renders the layer title and subtitle', () => {
    const { getByText } = renderModal();
    expect(getByText('MODIS Layer')).toBeTruthy();
    expect(getByText('Terra')).toBeTruthy();
  });

  it('renders the date when the layer has date ranges', () => {
    const { container } = renderModal();
    expect(container.querySelector('.handoff-modal-date').textContent).toBe('2023-05-01');
  });

  it('omits the date when the layer has no date ranges', () => {
    const { container } = renderModal({
      selectedLayer: { title: 'L', subtitle: 'S', dateRanges: null },
    });
    expect(container.querySelector('.handoff-modal-date')).toBeNull();
  });
});

describe('SmartHandoffModal interactions', () => {
  it('toggles the "About Earthdata Search" info section', () => {
    const { getByText, container, queryByText } = renderModal();
    expect(container.querySelector('.smart-handoff-about')).toBeNull();
    fireEvent.click(getByText('Show More Info'));
    expect(container.querySelector('.smart-handoff-about')).toBeTruthy();
    expect(getByText('Hide Info')).toBeTruthy();
    fireEvent.click(getByText('Hide Info'));
    expect(container.querySelector('.smart-handoff-about')).toBeNull();
    expect(queryByText('Hide Info')).toBeNull();
  });

  it('calls continueToEDS when Continue is clicked', () => {
    const { getByTestId, props } = renderModal();
    fireEvent.click(getByTestId('continue-btn'));
    expect(props.continueToEDS).toHaveBeenCalled();
  });

  it('hides the modal and stores the preference when the checkbox is checked', () => {
    const { getByTestId } = renderModal();
    const checkbox = getByTestId('hide-eds-checkbox');
    expect(checkbox.getAttribute('data-checked')).toBe('false');
    fireEvent.click(checkbox);
    expect(safeLocalStorage.getItem(HIDE_EDS_WARNING)).toBeTruthy();
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_toggle_true_hide_warning',
    });
    expect(getByTestId('hide-eds-checkbox').getAttribute('data-checked')).toBe('true');
  });

  it('clears the stored preference when the checkbox is unchecked', () => {
    safeLocalStorage.setItem(HIDE_EDS_WARNING, true);
    const { getByTestId } = renderModal();
    const checkbox = getByTestId('hide-eds-checkbox');
    // starts checked because the preference is already stored
    expect(checkbox.getAttribute('data-checked')).toBe('true');
    fireEvent.click(checkbox);
    expect(safeLocalStorage.getItem(HIDE_EDS_WARNING)).toBeFalsy();
    expect(getByTestId('hide-eds-checkbox').getAttribute('data-checked')).toBe('false');
  });
});
