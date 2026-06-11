/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MeasureButton from './measure-button';
import googleTagManager from 'googleTagManager';

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, size }) => <svg data-testid={`icon-${icon}`} data-size={size} />,
}));

jest.mock('reactstrap', () => ({
  Button: ({ children, disabled, onMouseDown, onTouchEnd, style, ...rest }) => (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={onMouseDown}
      onTouchEnd={onTouchEnd}
      style={style}
      aria-label={rest['aria-label']}
    >
      {children}
    </button>
  ),
  UncontrolledTooltip: ({ children }) => <div>{children}</div>,
}));

jest.mock('../util/alert', () => function MockAlert({ id, message, onDismiss }) {
  return (
    <div data-testid={id}>
      <span data-testid="alert-message">{message}</span>
      <button type="button" data-testid="dismiss-btn" onClick={onDismiss}>dismiss</button>
    </div>
  );
});

jest.mock('../../modules/modal/actions', () => ({
  openCustomContent: jest.fn((id, props) => ({ type: 'OPEN_CUSTOM_CONTENT', id, props })),
}));

const mockStore = configureStore([]);

const defaultState = {
  measure: { isActive: false },
  ui: { isDistractionFreeModeActive: false },
  screenSize: { isMobileDevice: false },
};

function renderButton(stateOverrides = {}) {
  const store = mockStore({ ...defaultState, ...stateOverrides });
  const utils = render(
    <Provider store={store}>
      <MeasureButton />
    </Provider>,
  );
  return { ...utils, store };
}

describe('MeasureButton', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders the measure button', () => {
      renderButton();
      expect(screen.getByRole('button', { name: 'Measure distances & areas' })).toBeInTheDocument();
    });

    it('does not render alert when measure tool is not active', () => {
      renderButton();
      expect(screen.queryByTestId('measurement-alert')).toBeNull();
    });

    it('hides the button in distraction-free mode', () => {
      renderButton({ ui: { isDistractionFreeModeActive: true } });
      expect(screen.queryByRole('button', { name: 'Measure distances & areas' })).toBeNull();
    });

    it('disables the button when measure tool is already active', () => {
      renderButton({ measure: { isActive: true } });
      expect(screen.getByRole('button', { name: 'Measure distances & areas' })).toBeDisabled();
    });

    it('renders a 1x icon on desktop', () => {
      renderButton({ screenSize: { isMobileDevice: false } });
      expect(screen.getByTestId('icon-ruler')).toHaveAttribute('data-size', '1x');
    });

    it('renders a 2x icon on mobile', () => {
      renderButton({ screenSize: { isMobileDevice: true } });
      expect(screen.getByTestId('icon-ruler')).toHaveAttribute('data-size', '2x');
    });
  });

  describe('mouse interaction', () => {
    it('dispatches openCustomContent on mouse down', () => {
      const { store } = renderButton();
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Measure distances & areas' }));
      const actions = store.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(expect.objectContaining({ type: 'OPEN_CUSTOM_CONTENT', id: 'MEASURE_MENU' }));
    });

    it('fires GTM event on mouse down', () => {
      renderButton();
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Measure distances & areas' }));
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'measure_tool_activated' });
    });

    it('shows desktop help message after mouse down when tool becomes active', () => {
      const store = mockStore({ ...defaultState, measure: { isActive: true } });
      render(<Provider store={store}><MeasureButton /></Provider>);
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Measure distances & areas' }));
      expect(screen.getByTestId('alert-message')).toHaveTextContent(
        'Click: Add a point. Right-click: Cancel. Double-click to complete.',
      );
    });

    it('dismisses the alert when dismiss is clicked', () => {
      const store = mockStore({ ...defaultState, measure: { isActive: true } });
      render(<Provider store={store}><MeasureButton /></Provider>);
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Measure distances & areas' }));
      expect(screen.getByTestId('measurement-alert')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('dismiss-btn'));
      expect(screen.queryByTestId('measurement-alert')).toBeNull();
    });
  });

  describe('touch interaction', () => {
    it('dispatches openCustomContent on touch end', () => {
      const { store } = renderButton();
      fireEvent.touchEnd(screen.getByRole('button', { name: 'Measure distances & areas' }));
      const actions = store.getActions();
      expect(actions[0]).toEqual(expect.objectContaining({ type: 'OPEN_CUSTOM_CONTENT', id: 'MEASURE_MENU' }));
    });

    it('shows mobile help message after touch end when tool becomes active', () => {
      const store = mockStore({ ...defaultState, measure: { isActive: true } });
      render(<Provider store={store}><MeasureButton /></Provider>);
      fireEvent.touchEnd(screen.getByRole('button', { name: 'Measure distances & areas' }));
      expect(screen.getByTestId('alert-message')).toHaveTextContent(
        'Tap to add a point. Double-tap to complete.',
      );
    });

    it('sets touchDevice prop to true in MEASURE_MENU_PROPS on touch end', () => {
      const { store } = renderButton();
      fireEvent.touchEnd(screen.getByRole('button', { name: 'Measure distances & areas' }));
      const actions = store.getActions();
      expect(actions[0].props.touchDevice).toBe(true);
    });

    it('sets touchDevice prop to false on mouse down', () => {
      const { store } = renderButton();
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Measure distances & areas' }));
      const actions = store.getActions();
      expect(actions[0].props.touchDevice).toBe(false);
    });
  });
});
