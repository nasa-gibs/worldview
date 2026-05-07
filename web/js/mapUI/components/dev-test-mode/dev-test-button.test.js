/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import DevTestButton from './dev-test-button';
import DevTestModal from './dev-test-modal';

jest.mock('reactstrap', () => ({
  Button: ({
    children, onClick, color, style,
  }) => (
    <button
      type="button"
      onClick={onClick}
      data-color={color}
      style={style}
      data-testid="dev-test-button"
    >
      {children}
    </button>
  ),
}));

jest.mock('./dev-test-modal', () => 'DevTestModal');

jest.mock('../../../modules/modal/actions', () => ({
  toggleCustomContent: jest.fn((key, options) => ({
    type: 'TOGGLE_CUSTOM_CONTENT',
    key,
    options,
  })),
}));

import { toggleCustomContent } from '../../../modules/modal/actions';

const mockStore = configureMockStore();

function renderComponent() {
  const store = mockStore({});
  const utils = render(
    <Provider store={store}>
      <DevTestButton />
    </Provider>,
  );
  return { ...utils, store };
}

describe('DevTestButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the "Open Test Menu" button', () => {
      renderComponent();
      expect(screen.getByTestId('dev-test-button')).toBeInTheDocument();
    });

    it('renders the button with the correct label', () => {
      renderComponent();
      expect(screen.getByText('Open Test Menu')).toBeInTheDocument();
    });

    it('renders the button with color "primary"', () => {
      renderComponent();
      expect(screen.getByTestId('dev-test-button')).toHaveAttribute('data-color', 'primary');
    });

    it('renders the button with zIndex 999', () => {
      renderComponent();
      expect(screen.getByTestId('dev-test-button')).toHaveStyle({ zIndex: '999' });
    });

    it('renders the outer wrapper with the correct id', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#dev-block')).toBeInTheDocument();
    });

    it('renders the outer wrapper with correct classes', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#dev-block')).toHaveClass('d-flex', 'justify-content-center');
    });
  });

  describe('openTestMenu', () => {
    it('dispatches toggleCustomContent when the button is clicked', () => {
      const { store } = renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'TOGGLE_CUSTOM_CONTENT' }),
      );
    });

    it('calls toggleCustomContent with the key "DEV_TEST_MENU"', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith('DEV_TEST_MENU', expect.anything());
    });

    it('calls toggleCustomContent with headerText "Dev Test Menu"', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ headerText: 'Dev Test Menu' }),
      );
    });

    it('calls toggleCustomContent with backdrop: false', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ backdrop: false }),
      );
    });

    it('calls toggleCustomContent with the DevTestModal as bodyComponent', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ bodyComponent: DevTestModal }),
      );
    });

    it('calls toggleCustomContent with the correct wrapClassName', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ wrapClassName: 'clickable-behind-modal' }),
      );
    });

    it('calls toggleCustomContent with the correct modalClassName', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ modalClassName: 'sidebar-modal layer-settings-modal' }),
      );
    });

    it('calls toggleCustomContent with timeout 150', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: 150 }),
      );
    });

    it('calls toggleCustomContent with size "lg"', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ size: 'lg' }),
      );
    });

    it('calls toggleCustomContent with an empty bodyComponentProps object', () => {
      renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(toggleCustomContent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ bodyComponentProps: {} }),
      );
    });

    it('dispatches exactly one action when clicked', () => {
      const { store } = renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(store.getActions()).toHaveLength(1);
    });

    it('dispatches toggleCustomContent once per click', () => {
      const { store } = renderComponent();
      fireEvent.click(screen.getByTestId('dev-test-button'));
      fireEvent.click(screen.getByTestId('dev-test-button'));
      expect(store.getActions()).toHaveLength(2);
    });

    it('does not dispatch before the button is clicked', () => {
      const { store } = renderComponent();
      expect(store.getActions()).toHaveLength(0);
    });
  });
});
