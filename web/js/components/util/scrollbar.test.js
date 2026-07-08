/* eslint-disable react/prop-types */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Scrollbars from './scrollbar';

let mockContentEl;
let mockContentWrapperEl;
let mockSkipRefAssignment = false;

jest.mock('simplebar-react', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, style, className, autoHide }, ref) => {
      // useLayoutEffect runs before the parent's useEffect, ensuring ref.current
      // is populated before Scrollbars' toggle-class logic reads it.
      React.useLayoutEffect(() => {
        if (ref && !mockSkipRefAssignment && !ref.current) {
          mockContentEl = global.document.createElement('div');
          mockContentWrapperEl = global.document.createElement('div');
          ref.current = { contentEl: mockContentEl, contentWrapperEl: mockContentWrapperEl };
        }
      });
      return (
        <div
          data-testid="simplebar"
          data-auto-hide={String(autoHide)}
          style={style}
          className={className}
        >
          {children}
        </div>
      );
    }),
  };
});

// Make debounce a pass-through so the wrapped function executes synchronously.
jest.mock('lodash', () => ({
  debounce: (fn) => fn,
}));

function setOffsetHeight(el, value) {
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => value });
}

beforeEach(() => {
  mockContentEl = undefined;
  mockContentWrapperEl = undefined;
  mockSkipRefAssignment = false;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Scrollbars', () => {
  describe('render', () => {
    it('renders without throwing', () => {
      expect(() => render(<Scrollbars />)).not.toThrow();
    });

    it('renders the SimpleBarReact wrapper', () => {
      render(<Scrollbars />);
      expect(screen.getByTestId('simplebar')).toBeInTheDocument();
    });

    it('renders children inside SimpleBarReact', () => {
      render(<Scrollbars><span data-testid="child">content</span></Scrollbars>);
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('passes style prop to SimpleBarReact', () => {
      render(<Scrollbars style={{ height: 300 }} />);
      expect(screen.getByTestId('simplebar')).toHaveStyle({ height: '300px' });
    });

    it('passes className prop to SimpleBarReact', () => {
      render(<Scrollbars className="my-scroll" />);
      expect(screen.getByTestId('simplebar')).toHaveClass('my-scroll');
    });

    it('always passes autoHide={false} to SimpleBarReact', () => {
      render(<Scrollbars />);
      expect(screen.getByTestId('simplebar')).toHaveAttribute('data-auto-hide', 'false');
    });
  });

  describe('useEffect — scrollbar-visible class', () => {
    it('does not throw when ref.current is not yet set (early-return path)', () => {
      mockSkipRefAssignment = true;
      expect(() => render(<Scrollbars />)).not.toThrow();
    });

    it('adds scrollbar-visible when contentEl is taller than contentWrapperEl', () => {
      const { rerender } = render(<Scrollbars />);
      setOffsetHeight(mockContentEl, 200);
      setOffsetHeight(mockContentWrapperEl, 100);
      rerender(<Scrollbars />);
      expect(mockContentEl.classList.contains('scrollbar-visible')).toBe(true);
    });

    it('removes scrollbar-visible when contentEl is not taller than contentWrapperEl', () => {
      const { rerender } = render(<Scrollbars />);
      mockContentEl.classList.add('scrollbar-visible');
      setOffsetHeight(mockContentEl, 50);
      setOffsetHeight(mockContentWrapperEl, 100);
      rerender(<Scrollbars />);
      expect(mockContentEl.classList.contains('scrollbar-visible')).toBe(false);
    });

    it('adds scrollbar-visible after the 800ms setTimeout (taller case)', () => {
      const { rerender } = render(<Scrollbars />);
      setOffsetHeight(mockContentEl, 200);
      setOffsetHeight(mockContentWrapperEl, 100);
      rerender(<Scrollbars />);
      act(() => { jest.advanceTimersByTime(800); });
      expect(mockContentEl.classList.contains('scrollbar-visible')).toBe(true);
    });

    it('removes scrollbar-visible after the 800ms setTimeout (not-taller case)', () => {
      const { rerender } = render(<Scrollbars />);
      mockContentEl.classList.add('scrollbar-visible');
      setOffsetHeight(mockContentEl, 50);
      setOffsetHeight(mockContentWrapperEl, 200);
      rerender(<Scrollbars />);
      act(() => { jest.advanceTimersByTime(800); });
      expect(mockContentEl.classList.contains('scrollbar-visible')).toBe(false);
    });
  });
});
