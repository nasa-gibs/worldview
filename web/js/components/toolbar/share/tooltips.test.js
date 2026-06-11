/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareToolTips from './tooltips';

jest.mock('reactstrap', () => ({
  Tooltip: ({ children, isOpen }) => (isOpen ? <div data-testid="tooltip">{children}</div> : null),
}));

const defaultProps = {
  activeTab: 'link',
  tooltipToggleTime: 0,
  tooltipErrorTime: 0,
};

const renderComponent = (props = {}) => render(
  <ShareToolTips {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

describe('ShareToolTips', () => {
  describe('initial render', () => {
    it('renders without any tooltips visible', () => {
      renderComponent();
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });
  });

  describe('componentDidUpdate — tooltipToggleTime changes', () => {
    it('shows the "Copied!" tooltip when tooltipToggleTime changes', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />);
      });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });

    it('auto-dismisses "Copied!" after 2000ms', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />);
      });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      act(() => { jest.advanceTimersByTime(2000); });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    it('resets the dismiss timer when tooltipToggleTime changes again while showing', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1 });
      // First toggle — starts 2000ms timer
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />); });
      // Advance 1500ms (not yet dismissed)
      act(() => { jest.advanceTimersByTime(1500); });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      // Second toggle — resets timer
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={3} />); });
      // Advance 1500ms more (3000ms total, but only 1500ms from second toggle)
      act(() => { jest.advanceTimersByTime(1500); });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      // Advance the remaining 500ms to complete the second 2000ms window
      act(() => { jest.advanceTimersByTime(500); });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
  });

  describe('componentDidUpdate — tooltipErrorTime changes', () => {
    it('shows the error tooltip when tooltipErrorTime changes', () => {
      const { rerender } = renderComponent({ tooltipErrorTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} />);
      });
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    it('auto-dismisses the error tooltip after 2000ms', () => {
      const { rerender } = renderComponent({ tooltipErrorTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} />);
      });
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      act(() => { jest.advanceTimersByTime(2000); });
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });

    it('resets the error dismiss timer when tooltipErrorTime changes again while showing', () => {
      const { rerender } = renderComponent({ tooltipErrorTime: 1 });
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} />); });
      act(() => { jest.advanceTimersByTime(1500); });
      // Still showing — not yet 2000ms
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      // Trigger again — resets timer
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={3} />); });
      act(() => { jest.advanceTimersByTime(1500); });
      // Only 1500ms since reset — still showing
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      act(() => { jest.advanceTimersByTime(500); });
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });
  });

  describe('componentDidUpdate — both tooltipToggleTime and tooltipErrorTime change', () => {
    it('shows both tooltips simultaneously when both props change', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1, tooltipErrorTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} tooltipErrorTime={2} />);
      });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
    });

    it('dismisses both tooltips independently after 2000ms', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1, tooltipErrorTime: 1 });
      act(() => {
        rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} tooltipErrorTime={2} />);
      });
      act(() => { jest.advanceTimersByTime(2000); });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });
  });

  describe('componentDidUpdate — activeTab changes', () => {
    it('hides the copied tooltip immediately when activeTab changes', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1 });
      // Show the tooltip first
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />); });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      // Change the active tab — should hide all tooltips
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} activeTab="short" />); });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    it('hides the error tooltip immediately when activeTab changes', () => {
      const { rerender } = renderComponent({ tooltipErrorTime: 1 });
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} />); });
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} activeTab="short" />); });
      expect(screen.queryByText('Link cannot be shortened at this time.')).not.toBeInTheDocument();
    });

    it('cancels pending dismiss timers when activeTab changes', () => {
      const { rerender } = renderComponent({ tooltipToggleTime: 1 });
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />); });
      // Tab change clears timers
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} activeTab="short" />); });
      // Even after 2000ms, no spurious state updates (both already false)
      act(() => { jest.advanceTimersByTime(2000); });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
  });

  describe('componentWillUnmount', () => {
    it('clears pending timeouts on unmount without errors', () => {
      const { rerender, unmount } = renderComponent({ tooltipToggleTime: 1 });
      // Open tooltip — starts a 2000ms dismiss timer
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipToggleTime={2} />); });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
      // Unmount before timer fires — should clear timeout, no setState on unmounted component
      expect(() => {
        act(() => { unmount(); });
        act(() => { jest.runAllTimers(); });
      }).not.toThrow();
    });

    it('clears error tooltip timeout on unmount', () => {
      const { rerender, unmount } = renderComponent({ tooltipErrorTime: 1 });
      act(() => { rerender(<ShareToolTips {...defaultProps} tooltipErrorTime={2} />); });
      expect(screen.getByText('Link cannot be shortened at this time.')).toBeInTheDocument();
      expect(() => {
        act(() => { unmount(); });
        act(() => { jest.runAllTimers(); });
      }).not.toThrow();
    });
  });
});
