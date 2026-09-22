/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('reactstrap', () => ({
  Tooltip: ({ isOpen, children }) => (isOpen ? <div data-testid="tooltip">{children}</div> : null),
}));

import LayerRowSlider from './layer-row-slider';

const defaultProps = {
  sliderId: 'layer-row-slider-active-test-layer',
  min: 1,
  max: 12,
  value: 1,
  unitLabel: 'DAY',
  tooltipText: '1-day aggregation',
  onChange: jest.fn(),
  isMobile: false,
  stopDndActivation: jest.fn(),
};

const renderSlider = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides };
  return render(<LayerRowSlider {...props} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('LayerRowSlider', () => {
  describe('layout', () => {
    it('renders the range input', () => {
      renderSlider();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders a singular pill label when value is 1', () => {
      renderSlider({ value: 1, unitLabel: 'DAY' });
      expect(screen.getByText('1 DAY')).toBeInTheDocument();
    });

    it('renders a pluralized pill label when value is greater than 1', () => {
      renderSlider({ value: 5, unitLabel: 'DAY' });
      expect(screen.getByText('5 DAYS')).toBeInTheDocument();
    });

    it('does not render a tooltip on mobile', () => {
      renderSlider({ isMobile: true });
      fireEvent.mouseEnter(screen.getByText('1 DAY'));
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('dnd activation guard', () => {
    it('stops pointerdown from reaching the drag activator', () => {
      const stopDndActivation = jest.fn();
      renderSlider({ stopDndActivation });
      fireEvent.pointerDown(screen.getByRole('slider').closest('.layer-row-slider'));
      expect(stopDndActivation).toHaveBeenCalled();
    });

    it('stops mousedown from reaching the drag activator', () => {
      const stopDndActivation = jest.fn();
      renderSlider({ stopDndActivation });
      fireEvent.mouseDown(screen.getByRole('slider').closest('.layer-row-slider'));
      expect(stopDndActivation).toHaveBeenCalled();
    });

    it('stops keydown propagation so keyboard drag sensors do not activate', () => {
      // React 18 delegates events to the render root itself, so a listener
      // must sit above that root (e.g. document) to observe real bubbling.
      const onDocumentKeyDown = jest.fn();
      document.addEventListener('keydown', onDocumentKeyDown);
      renderSlider();
      fireEvent.keyDown(screen.getByRole('slider'), { key: 'Enter', bubbles: true });
      document.removeEventListener('keydown', onDocumentKeyDown);
      expect(onDocumentKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('onChange', () => {
    it('updates the pill label immediately on slide', () => {
      renderSlider({ value: 1, unitLabel: 'DAY' });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });
      expect(screen.getByText('6 DAYS')).toBeInTheDocument();
    });

    it('debounces the call to onChange', () => {
      const onChange = jest.fn();
      renderSlider({ onChange });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
      fireEvent.change(screen.getByRole('slider'), { target: { value: '10' } });
      expect(onChange).not.toHaveBeenCalled();
      act(() => {
        jest.runAllTimers();
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(10);
    });
  });

  describe('tooltip', () => {
    it('opens the tooltip on hover', () => {
      renderSlider();
      fireEvent.mouseEnter(screen.getByText('1 DAY'));
      expect(screen.getByTestId('tooltip')).toHaveTextContent('1-day aggregation');
    });

    it('closes the tooltip on mouse leave', () => {
      renderSlider();
      const pill = screen.getByText('1 DAY');
      fireEvent.mouseEnter(pill);
      fireEvent.mouseLeave(pill);
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('stays open while actively sliding, even without hover', () => {
      renderSlider();
      fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });
});
