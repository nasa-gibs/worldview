/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Capture mapState/mapDispatch from connect; load component via require() in
// beforeAll so the module initializes after these let declarations are in scope.
let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

jest.mock('../../../modules/date/actions', () => ({
  toggleCustomModal: jest.fn((isOpen, modalType) => ({ type: 'TOGGLE_CUSTOM_MODAL', isOpen, modalType })),
  selectInterval: jest.fn((delta, timeScale, customSelected, autoSelected) => ({
    type: 'SELECT_INTERVAL', delta, timeScale, customSelected, autoSelected,
  })),
}));

let TimeScaleIntervalChange;
beforeAll(() => {
  TimeScaleIntervalChange = require('./timescale-interval-change').default;
});

const defaultProps = {
  interval: 3,
  customInterval: null,
  customDelta: 1,
  customSelected: false,
  autoSelected: false,
  hasSubdailyLayers: false,
  hasTempoProduct: false,
  isDisabled: false,
  timeScaleChangeUnit: null,
  modalType: 'TIMELINE_CUSTOM',
  selectInterval: jest.fn(),
  toggleCustomModal: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <TimeScaleIntervalChange {...defaultProps} {...props} />,
);

describe('TimeScaleIntervalChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders container with id timeline-interval-btn-container', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#timeline-interval-btn-container')).toBeInTheDocument();
    });

    it('renders container with interval-btn-container class', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass('interval-btn-container');
    });

    it('renders current-interval span', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#current-interval')).toBeInTheDocument();
    });

    it('displays "1 day" when interval=3', () => {
      const { getByText } = renderComponent({ interval: 3 });
      expect(getByText('1 day')).toBeInTheDocument();
    });

    it('displays "1 year" when interval=1', () => {
      const { getByText } = renderComponent({ interval: 1 });
      expect(getByText('1 year')).toBeInTheDocument();
    });

    it('displays "1 month" when interval=2', () => {
      const { getByText } = renderComponent({ interval: 2 });
      expect(getByText('1 month')).toBeInTheDocument();
    });

    it('displays "AUTO" when autoSelected is true', () => {
      const { getByText } = renderComponent({ autoSelected: true });
      expect(getByText('AUTO')).toBeInTheDocument();
    });

    it('displays customIntervalText in span when customSelected is true', () => {
      const { container } = renderComponent({
        customSelected: true,
        customDelta: 3,
        customInterval: 1,
      });
      expect(container.querySelector('#current-interval').textContent).toBe('3 year');
    });

    it('adds custom-interval-text class when customSelected', () => {
      const { container } = renderComponent({ customSelected: true });
      expect(container.querySelector('#current-interval')).toHaveClass('custom-interval-text');
    });

    it('does not add custom-interval-text class when not customSelected', () => {
      const { container } = renderComponent({ customSelected: false });
      expect(container.querySelector('#current-interval')).not.toHaveClass('custom-interval-text');
    });

    it('adds disabled class when isDisabled', () => {
      const { container } = renderComponent({ isDisabled: true });
      expect(container.querySelector('#current-interval')).toHaveClass('disabled');
    });

    it('does not render tooltip when isDisabled', () => {
      const { container } = renderComponent({ isDisabled: true });
      expect(container.querySelector('.wv-tooltip')).not.toBeInTheDocument();
    });

    it('renders tooltip when not isDisabled', () => {
      const { container } = renderComponent({ isDisabled: false });
      expect(container.querySelector('.wv-tooltip')).toBeInTheDocument();
    });
  });

  describe('tooltip visibility', () => {
    it('tooltip is hidden by default', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.wv-tooltip').style.display).toBe('none');
    });

    it('tooltip shows on mouseenter', () => {
      const { container } = renderComponent();
      fireEvent.mouseEnter(container.firstChild);
      expect(container.querySelector('.wv-tooltip').style.display).toBe('block');
    });

    it('tooltip hides on mouseleave', () => {
      const { container } = renderComponent();
      fireEvent.mouseEnter(container.firstChild);
      fireEvent.mouseLeave(container.firstChild);
      expect(container.querySelector('.wv-tooltip').style.display).toBe('none');
    });

    it('mouseenter does not update state when isDisabled', () => {
      const { container } = renderComponent({ isDisabled: true });
      fireEvent.mouseEnter(container.firstChild);
      expect(container.querySelector('.wv-tooltip')).not.toBeInTheDocument();
    });

    it('toggles tooltip visible on first container click', () => {
      const { container } = renderComponent();
      fireEvent.click(container.firstChild);
      expect(container.querySelector('.wv-tooltip').style.display).toBe('block');
    });

    it('toggles tooltip back to hidden on second container click', () => {
      const { container } = renderComponent();
      fireEvent.click(container.firstChild);
      fireEvent.click(container.firstChild);
      expect(container.querySelector('.wv-tooltip').style.display).toBe('none');
    });
  });

  describe('tooltip content', () => {
    it('renders Year, Month, Day always', () => {
      const { getByText } = renderComponent();
      expect(getByText('Year')).toBeInTheDocument();
      expect(getByText('Month')).toBeInTheDocument();
      expect(getByText('Day')).toBeInTheDocument();
    });

    it('does not render Hour or Minute when hasSubdailyLayers is false', () => {
      const { queryByText } = renderComponent({ hasSubdailyLayers: false });
      expect(queryByText('Hour')).not.toBeInTheDocument();
      expect(queryByText('Minute')).not.toBeInTheDocument();
    });

    it('renders Hour and Minute when hasSubdailyLayers is true', () => {
      const { getByText } = renderComponent({ hasSubdailyLayers: true });
      expect(getByText('Hour')).toBeInTheDocument();
      expect(getByText('Minute')).toBeInTheDocument();
    });

    it('does not render Auto when hasTempoProduct is false', () => {
      const { queryByText } = renderComponent({ hasTempoProduct: false });
      expect(queryByText('Auto')).not.toBeInTheDocument();
    });

    it('renders Auto when hasTempoProduct is true', () => {
      const { getByText } = renderComponent({ hasTempoProduct: true });
      expect(getByText('Auto')).toBeInTheDocument();
    });

    it('always renders the static Custom button', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#interval-custom-static')).toBeInTheDocument();
    });

    it('dynamic custom span is hidden when customIntervalText is "Custom"', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#interval-custom').style.display).toBe('none');
    });
  });

  describe('handleClickInterval — selectInterval calls', () => {
    it('clicking Year calls selectInterval(1, 1, false, false)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ selectInterval });
      fireEvent.click(getByText('Year'));
      expect(selectInterval).toHaveBeenCalledWith(1, 1, false, false);
    });

    it('clicking Month calls selectInterval(1, 2, false, false)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ selectInterval });
      fireEvent.click(getByText('Month'));
      expect(selectInterval).toHaveBeenCalledWith(1, 2, false, false);
    });

    it('clicking Day calls selectInterval(1, 3, false, false)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ selectInterval });
      fireEvent.click(getByText('Day'));
      expect(selectInterval).toHaveBeenCalledWith(1, 3, false, false);
    });

    it('clicking Hour calls selectInterval(1, 4, false, false)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ hasSubdailyLayers: true, selectInterval });
      fireEvent.click(getByText('Hour'));
      expect(selectInterval).toHaveBeenCalledWith(1, 4, false, false);
    });

    it('clicking Minute calls selectInterval(1, 5, false, false)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ hasSubdailyLayers: true, selectInterval });
      fireEvent.click(getByText('Minute'));
      expect(selectInterval).toHaveBeenCalledWith(1, 5, false, false);
    });

    it('clicking Auto calls selectInterval(1, 5, false, true)', () => {
      const selectInterval = jest.fn();
      const { getByText } = renderComponent({ hasTempoProduct: true, selectInterval });
      fireEvent.click(getByText('Auto'));
      expect(selectInterval).toHaveBeenCalledWith(1, 5, false, true);
    });

    it('clicking static Custom calls toggleCustomModal with openModal=true', () => {
      const toggleCustomModal = jest.fn();
      const { container } = renderComponent({ toggleCustomModal, modalType: 'TIMELINE_CUSTOM' });
      fireEvent.click(container.querySelector('#interval-custom-static'));
      expect(toggleCustomModal).toHaveBeenCalledWith(true, 'TIMELINE_CUSTOM');
    });

    it('clicking static Custom does not call selectInterval', () => {
      const selectInterval = jest.fn();
      const toggleCustomModal = jest.fn();
      const { container } = renderComponent({ selectInterval, toggleCustomModal });
      fireEvent.click(container.querySelector('#interval-custom-static'));
      expect(selectInterval).not.toHaveBeenCalled();
    });

    it('clicking dynamic custom span calls selectInterval with customDelta and customInterval', () => {
      const selectInterval = jest.fn();
      const { container } = renderComponent({ selectInterval, customInterval: 3, customDelta: 2 });
      fireEvent.click(container.querySelector('#interval-custom'));
      expect(selectInterval).toHaveBeenCalledWith(2, 3, true, false);
    });

    it('clicking an interval closes the tooltip', () => {
      const { container, getByText } = renderComponent();
      fireEvent.mouseEnter(container.firstChild);
      expect(container.querySelector('.wv-tooltip').style.display).toBe('block');
      fireEvent.click(getByText('Year'));
      expect(container.querySelector('.wv-tooltip').style.display).toBe('none');
    });
  });

  describe('componentDidMount — setCustomIntervalText', () => {
    it('sets customIntervalText when customDelta !== 1 and customInterval is set', () => {
      // timeScaleChangeUnit must be truthy so componentDidUpdate's reset branch
      // (condition: defaultDelta || !timeScaleChangeUnit) does not fire after mount.
      const { container } = renderComponent({ customDelta: 2, customInterval: 3, timeScaleChangeUnit: 'day' });
      expect(container.querySelector('#interval-custom').style.display).toBe('block');
      expect(container.querySelector('#interval-custom').textContent).toBe('2 day');
    });

    it('does not set customIntervalText when customDelta === 1', () => {
      const { container } = renderComponent({ customDelta: 1, customInterval: 3 });
      expect(container.querySelector('#interval-custom').style.display).toBe('none');
    });

    it('does not set customIntervalText when customInterval is null', () => {
      const { container } = renderComponent({ customDelta: 2, customInterval: null });
      expect(container.querySelector('#interval-custom').style.display).toBe('none');
    });
  });

  describe('componentDidUpdate — resetCustomIntervalText', () => {
    it('resets customIntervalText when customSelected becomes false and defaultDelta is true', () => {
      const { container, rerender } = render(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
        />,
      );
      expect(container.querySelector('#interval-custom').style.display).toBe('block');

      rerender(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={1}
          customInterval={3}
          customSelected={false}
          timeScaleChangeUnit="day"
        />,
      );
      expect(container.querySelector('#interval-custom').style.display).toBe('none');
    });
  });

  describe('componentDidUpdate — setCustomIntervalText', () => {
    it('updates customIntervalText when customDelta changes while customSelected', () => {
      const { container, rerender } = render(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
        />,
      );
      expect(container.querySelector('#interval-custom').textContent).toBe('2 day');

      rerender(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={5}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
        />,
      );
      expect(container.querySelector('#interval-custom').textContent).toBe('5 day');
    });

    it('updates customIntervalText when timeScaleChangeUnit changes while customSelected', () => {
      const { container, rerender } = render(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
        />,
      );
      rerender(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={2}
          customSelected
          timeScaleChangeUnit="month"
        />,
      );
      expect(container.querySelector('#interval-custom').textContent).toBe('2 month');
    });

    it('does not update customIntervalText when neither customDelta nor timeScaleChangeUnit changes', () => {
      const { container, rerender } = render(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
        />,
      );
      expect(container.querySelector('#interval-custom').textContent).toBe('2 day');

      rerender(
        <TimeScaleIntervalChange
          {...defaultProps}
          customDelta={2}
          customInterval={3}
          customSelected
          timeScaleChangeUnit="day"
          hasSubdailyLayers
        />,
      );
      expect(container.querySelector('#interval-custom').textContent).toBe('2 day');
    });
  });

  describe('mapStateToProps', () => {
    const makeState = (overrides = {}) => ({
      date: {
        interval: 3,
        customInterval: null,
        customDelta: 1,
        customSelected: false,
        autoSelected: false,
        ...overrides,
      },
    });

    it('maps interval from date.interval', () => {
      expect(capturedMapState(makeState({ interval: 2 })).interval).toBe(2);
    });

    it('maps customInterval from date.customInterval', () => {
      expect(capturedMapState(makeState({ customInterval: 4 })).customInterval).toBe(4);
    });

    it('maps customDelta from date.customDelta', () => {
      expect(capturedMapState(makeState({ customDelta: 7 })).customDelta).toBe(7);
    });

    it('maps customSelected from date.customSelected', () => {
      expect(capturedMapState(makeState({ customSelected: true })).customSelected).toBe(true);
    });

    it('maps autoSelected from date.autoSelected', () => {
      expect(capturedMapState(makeState({ autoSelected: true })).autoSelected).toBe(true);
    });
  });

  describe('mapDispatchToProps', () => {
    it('toggleCustomModal dispatches toggleCustomModalAction', () => {
      const dispatch = jest.fn();
      const { toggleCustomModal } = capturedMapDispatch(dispatch);
      toggleCustomModal(true, 'TIMELINE_CUSTOM');
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'TOGGLE_CUSTOM_MODAL' }));
    });

    it('selectInterval dispatches selectIntervalAction', () => {
      const dispatch = jest.fn();
      const { selectInterval } = capturedMapDispatch(dispatch);
      selectInterval(1, 3, false, false);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SELECT_INTERVAL' }));
    });
  });
});
