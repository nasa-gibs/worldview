/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Passthrough connect so we can supply all props directly.
// mapStateToProps and mapDispatchToProps are captured for direct testing.
// DateChangeArrows is loaded via require() in beforeAll (not a static import) so
// the module initializes after these let declarations are in scope — avoiding TDZ.
let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

jest.mock('@edsc/earthdata-react-icons/horizon-design-system/hds/ui', () => ({
  ArrowChevronLeft: ({ className, size }) => (
    <svg data-testid="arrow-left" className={className} data-size={size} />
  ),
  ArrowChevronRight: ({ className, size }) => (
    <svg data-testid="arrow-right" className={className} data-size={size} />
  ),
}));

jest.mock('../../util/hover-tooltip', () => function MockHoverTooltip({ labelText, target }) {
  return <div data-testid={`tooltip-${target}`}>{labelText}</div>;
});

jest.mock('../../animation-widget/loading-indicator', () => function MockLoadingIndicator({ title }) {
  return <div data-testid="loading-indicator">{title}</div>;
});

jest.mock('../../../modules/date/actions', () => ({
  setArrowDown: jest.fn((dir) => ({ type: 'SET_ARROW_DOWN', dir })),
  setArrowUp: jest.fn(() => ({ type: 'SET_ARROW_UP' })),
}));

let DateChangeArrows;
beforeAll(() => {
  DateChangeArrows = require('./date-change-arrows').default;
});

const defaultProps = {
  handleSelectNowButton: jest.fn(),
  isMobile: false,
  leftArrowDisabled: false,
  leftArrowDown: jest.fn(),
  nowButtonDisabled: false,
  rightArrowDisabled: false,
  rightArrowDown: jest.fn(),
  arrowDown: null,
  tilesPreloaded: false,
  isKioskModeActive: false,
  isEmbedModeActive: false,
  setArrowDown: jest.fn(),
  setArrowUp: jest.fn(),
};

const renderArrows = (props = {}) => render(
  <DateChangeArrows {...defaultProps} {...props} />,
);

describe('DateChangeArrows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the arrow-group container', () => {
      const { container } = renderArrows();
      expect(container.firstChild).toHaveClass('arrow-group');
    });

    it('renders left arrow button', () => {
      const { getByLabelText } = renderArrows();
      expect(getByLabelText('Decrement date')).toBeInTheDocument();
    });

    it('renders right arrow button', () => {
      const { getByLabelText } = renderArrows();
      expect(getByLabelText('Increment date')).toBeInTheDocument();
    });

    it('renders now button', () => {
      const { getByLabelText } = renderArrows();
      expect(getByLabelText('Latest available date')).toBeInTheDocument();
    });

    it('renders tooltips for each button', () => {
      const { getByTestId } = renderArrows();
      expect(getByTestId('tooltip-left-arrow-group')).toBeInTheDocument();
      expect(getByTestId('tooltip-right-arrow-group')).toBeInTheDocument();
      expect(getByTestId('tooltip-now-button-group')).toBeInTheDocument();
    });

    it('does not render loading indicator when arrowDown is null', () => {
      const { queryByTestId } = renderArrows({ arrowDown: null });
      expect(queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('does not render loading indicator when arrowDown is set but tilesPreloaded is true', () => {
      const { queryByTestId } = renderArrows({ arrowDown: 'left', tilesPreloaded: true });
      expect(queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('renders loading indicator when arrowDown is set and tilesPreloaded is false', () => {
      const { getByTestId } = renderArrows({ arrowDown: 'left', tilesPreloaded: false });
      expect(getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('disabled classes', () => {
    it('adds button-disabled class to left arrow when leftArrowDisabled', () => {
      const { getByLabelText } = renderArrows({ leftArrowDisabled: true });
      expect(getByLabelText('Decrement date')).toHaveClass('button-disabled');
    });

    it('does not add button-disabled to left arrow when not disabled', () => {
      const { getByLabelText } = renderArrows({ leftArrowDisabled: false });
      expect(getByLabelText('Decrement date')).not.toHaveClass('button-disabled');
    });

    it('adds button-disabled class to right arrow when rightArrowDisabled', () => {
      const { getByLabelText } = renderArrows({ rightArrowDisabled: true });
      expect(getByLabelText('Increment date')).toHaveClass('button-disabled');
    });

    it('does not add button-disabled to right arrow when not disabled', () => {
      const { getByLabelText } = renderArrows({ rightArrowDisabled: false });
      expect(getByLabelText('Increment date')).not.toHaveClass('button-disabled');
    });

    it('adds button-disabled to now button when nowButtonDisabled', () => {
      const { getByLabelText } = renderArrows({ nowButtonDisabled: true });
      expect(getByLabelText('Latest available date')).toHaveClass('button-disabled');
    });

    it('sets aria-disabled=true on left arrow when leftArrowDisabled', () => {
      const { getByLabelText } = renderArrows({ leftArrowDisabled: true });
      expect(getByLabelText('Decrement date')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('kiosk / embed mode visibility', () => {
    it('adds d-none to left arrow in kiosk mode when not embed', () => {
      const { getByLabelText } = renderArrows({
        isKioskModeActive: true,
        isEmbedModeActive: false,
      });
      expect(getByLabelText('Decrement date')).toHaveClass('d-none');
    });

    it('does not add d-none to left arrow in kiosk mode when embed is active', () => {
      const { getByLabelText } = renderArrows({ isKioskModeActive: true, isEmbedModeActive: true });
      expect(getByLabelText('Decrement date')).not.toHaveClass('d-none');
    });

    it('does not add d-none to left arrow when kiosk mode is off', () => {
      const { getByLabelText } = renderArrows({ isKioskModeActive: false });
      expect(getByLabelText('Decrement date')).not.toHaveClass('d-none');
    });

    it('adds d-none to now button in kiosk mode (regardless of embed)', () => {
      const { getByLabelText } = renderArrows({ isKioskModeActive: true, isEmbedModeActive: true });
      expect(getByLabelText('Latest available date')).toHaveClass('d-none');
    });

    it('does not add d-none to now button when kiosk mode is off', () => {
      const { getByLabelText } = renderArrows({ isKioskModeActive: false });
      expect(getByLabelText('Latest available date')).not.toHaveClass('d-none');
    });
  });

  describe('now button', () => {
    it('calls handleSelectNowButton when now button is clicked', () => {
      const handleSelectNowButton = jest.fn();
      const { getByLabelText } = renderArrows({ handleSelectNowButton });
      fireEvent.click(getByLabelText('Latest available date'));
      expect(handleSelectNowButton).toHaveBeenCalledTimes(1);
    });
  });

  describe('onArrowDown — immediate callback', () => {
    it('calls leftArrowDown immediately on left mousedown', () => {
      const leftArrowDown = jest.fn();
      const { getByLabelText } = renderArrows({ leftArrowDown });
      fireEvent.mouseDown(getByLabelText('Decrement date'));
      expect(leftArrowDown).toHaveBeenCalledTimes(1);
    });

    it('calls rightArrowDown immediately on right mousedown', () => {
      const rightArrowDown = jest.fn();
      const { getByLabelText } = renderArrows({ rightArrowDown });
      fireEvent.mouseDown(getByLabelText('Increment date'));
      expect(rightArrowDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('onArrowDown — hold timer (setArrowDown)', () => {
    it('calls setArrowDown("left") after CLICK_HOLD_DELAY (200ms)', () => {
      const setArrowDown = jest.fn();
      const { getByLabelText } = renderArrows({ setArrowDown });
      fireEvent.mouseDown(getByLabelText('Decrement date'));
      expect(setArrowDown).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(200); });
      expect(setArrowDown).toHaveBeenCalledWith('left');
    });

    it('calls setArrowDown("right") after CLICK_HOLD_DELAY (200ms)', () => {
      const setArrowDown = jest.fn();
      const { getByLabelText } = renderArrows({ setArrowDown });
      fireEvent.mouseDown(getByLabelText('Increment date'));
      act(() => { jest.advanceTimersByTime(200); });
      expect(setArrowDown).toHaveBeenCalledWith('right');
    });
  });

  describe('onArrowUp — quick click (mouseUp before hold timer)', () => {
    it('does not call setArrowDown when mouseup before 200ms', () => {
      const setArrowDown = jest.fn();
      const { getByLabelText } = renderArrows({ setArrowDown });
      fireEvent.mouseDown(getByLabelText('Decrement date'));
      fireEvent.mouseUp(getByLabelText('Decrement date'));
      act(() => { jest.advanceTimersByTime(200); });
      expect(setArrowDown).not.toHaveBeenCalled();
    });

    it('does not call setArrowUp when arrowDown is null on mouseup', () => {
      const setArrowUp = jest.fn();
      const { getByLabelText } = renderArrows({ arrowDown: null, setArrowUp });
      fireEvent.mouseDown(getByLabelText('Decrement date'));
      fireEvent.mouseUp(getByLabelText('Decrement date'));
      expect(setArrowUp).not.toHaveBeenCalled();
    });
  });

  describe('onArrowUp — after hold (arrowDown set)', () => {
    it('calls setArrowUp on mouseup when arrowDown is set', () => {
      const setArrowUp = jest.fn();
      const { getByLabelText } = renderArrows({ arrowDown: 'left', setArrowUp });
      fireEvent.mouseUp(getByLabelText('Decrement date'));
      expect(setArrowUp).toHaveBeenCalledTimes(1);
    });

    it('calls setArrowUp on mouseLeave when arrowDown is set', () => {
      const setArrowUp = jest.fn();
      const { getByLabelText } = renderArrows({ arrowDown: 'right', setArrowUp });
      fireEvent.mouseLeave(getByLabelText('Increment date'));
      expect(setArrowUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('interval — tilesPreloaded + arrowDown effect', () => {
    it('repeatedly calls leftArrowDown every 600ms when tilesPreloaded and arrowDown=left', () => {
      const leftArrowDown = jest.fn();
      renderArrows({ arrowDown: 'left', tilesPreloaded: true, leftArrowDown });
      act(() => { jest.advanceTimersByTime(600); });
      expect(leftArrowDown).toHaveBeenCalledTimes(1);
      act(() => { jest.advanceTimersByTime(600); });
      expect(leftArrowDown).toHaveBeenCalledTimes(2);
    });

    it('repeatedly calls rightArrowDown every 600ms when tilesPreloaded and arrowDown=right', () => {
      const rightArrowDown = jest.fn();
      renderArrows({ arrowDown: 'right', tilesPreloaded: true, rightArrowDown });
      act(() => { jest.advanceTimersByTime(600); });
      expect(rightArrowDown).toHaveBeenCalledTimes(1);
    });

    it('does not start interval when tilesPreloaded is false', () => {
      const leftArrowDown = jest.fn();
      renderArrows({ arrowDown: 'left', tilesPreloaded: false, leftArrowDown });
      act(() => { jest.advanceTimersByTime(1200); });
      // leftArrowDown is only called by the initial mousedown, not by interval
      expect(leftArrowDown).not.toHaveBeenCalled();
    });

    it('does not start interval when arrowDown is null', () => {
      const leftArrowDown = jest.fn();
      renderArrows({ arrowDown: null, tilesPreloaded: true, leftArrowDown });
      act(() => { jest.advanceTimersByTime(1200); });
      expect(leftArrowDown).not.toHaveBeenCalled();
    });

    it('clears intervals on unmount', () => {
      const leftArrowDown = jest.fn();
      const { unmount } = renderArrows({ arrowDown: 'left', tilesPreloaded: true, leftArrowDown });
      unmount();
      act(() => { jest.advanceTimersByTime(1200); });
      // After unmount no further calls beyond what happened before unmount
      expect(leftArrowDown).toHaveBeenCalledTimes(0);
    });
  });

  describe('mapStateToProps', () => {
    it('maps tilesPreloaded from date.preloaded', () => {
      const state = {
        date: {
          preloaded: true, arrowDown: null,
        },
        embed: { isEmbedModeActive: false },
        ui: { isKioskModeActive: false },
      };
      expect(capturedMapState(state).tilesPreloaded).toBe(true);
    });

    it('maps arrowDown from date.arrowDown', () => {
      const state = { date: { preloaded: false, arrowDown: 'left' }, embed: { isEmbedModeActive: false }, ui: { isKioskModeActive: false } };
      expect(capturedMapState(state).arrowDown).toBe('left');
    });

    it('maps isKioskModeActive from ui.isKioskModeActive', () => {
      const state = {
        date: { preloaded: false, arrowDown: null },
        embed: { isEmbedModeActive: false },
        ui: { isKioskModeActive: true },
      };
      expect(capturedMapState(state).isKioskModeActive).toBe(true);
    });

    it('maps isEmbedModeActive from embed.isEmbedModeActive', () => {
      const state = {
        date: { preloaded: false, arrowDown: null },
        embed: { isEmbedModeActive: true },
        ui: { isKioskModeActive: false },
      };
      expect(capturedMapState(state).isEmbedModeActive).toBe(true);
    });
  });

  describe('mapDispatchToProps', () => {
    it('setArrowDown dispatches setArrowDownAction with direction', () => {
      const dispatch = jest.fn();
      const { setArrowDown } = capturedMapDispatch(dispatch);
      setArrowDown('right');
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_ARROW_DOWN' }));
    });

    it('setArrowUp dispatches setArrowUpAction', () => {
      const dispatch = jest.fn();
      const { setArrowUp } = capturedMapDispatch(dispatch);
      setArrowUp();
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_ARROW_UP' }));
    });
  });
});
