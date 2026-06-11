/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VisibilitySensor from './visibility-sensor';

// Helpers to capture and fire IntersectionObserver callbacks
let observerCallback;
let observerOptions;
let observeTarget;
const mockDisconnect = jest.fn();
const mockObserve = jest.fn((el) => { observeTarget = el; });

function MockIntersectionObserver(cb, options) {
  observerCallback = cb;
  observerOptions = options;
  return { observe: mockObserve, disconnect: mockDisconnect };
}

function fireIntersection(isIntersecting) {
  act(() => {
    observerCallback([{ isIntersecting }]);
  });
}

const defaultProps = {
  children: <span data-testid="child">child</span>,
};

const renderComponent = (props = {}) => render(
  <VisibilitySensor {...defaultProps} {...props} />,
);

beforeEach(() => {
  observerCallback = null;
  observerOptions = null;
  observeTarget = null;
  mockDisconnect.mockClear();
  mockObserve.mockClear();
  global.IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  delete global.IntersectionObserver;
});

describe('VisibilitySensor', () => {
  describe('rendering', () => {
    it('renders a wrapper div with display:contents style', () => {
      const { container } = renderComponent();
      const wrapper = container.firstChild;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).toHaveStyle({ display: 'contents' });
    });

    it('renders node children', () => {
      renderComponent();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders function children, passing isVisible', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="fn-child">{isVisible ? 'visible' : 'hidden'}</span>
        ),
      });
      expect(screen.getByTestId('fn-child')).toHaveTextContent('hidden');
    });
  });

  describe('IntersectionObserver setup', () => {
    it('creates an IntersectionObserver and observes the container element', () => {
      const { container } = renderComponent();
      expect(mockObserve).toHaveBeenCalledTimes(1);
      expect(observeTarget).toBe(container.firstChild);
    });

    it('uses threshold=1 by default (partialVisibility=false)', () => {
      renderComponent();
      expect(observerOptions.threshold).toBe(1);
    });

    it('uses threshold=0 when partialVisibility=true', () => {
      renderComponent({ partialVisibility: true });
      expect(observerOptions.threshold).toBe(0);
    });

    it('uses root=null by default (containment not provided)', () => {
      renderComponent();
      expect(observerOptions.root).toBeNull();
    });

    it('uses the provided containment element as root', () => {
      const containment = document.createElement('div');
      renderComponent({ containment });
      expect(observerOptions.root).toBe(containment);
    });

    it('disconnects the observer on unmount', () => {
      const { unmount } = renderComponent();
      unmount();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('visibility state', () => {
    it('isVisible starts as false', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      expect(screen.getByTestId('state')).toHaveTextContent('false');
    });

    it('sets isVisible=true when entry.isIntersecting=true', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      fireIntersection(true);
      expect(screen.getByTestId('state')).toHaveTextContent('true');
    });

    it('sets isVisible=false when entry.isIntersecting=false', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      fireIntersection(true);
      fireIntersection(false);
      expect(screen.getByTestId('state')).toHaveTextContent('false');
    });

    it('passes updated isVisible to function children', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="fn-child">{isVisible ? 'visible' : 'hidden'}</span>
        ),
      });
      expect(screen.getByTestId('fn-child')).toHaveTextContent('hidden');
      fireIntersection(true);
      expect(screen.getByTestId('fn-child')).toHaveTextContent('visible');
    });
  });

  describe('IntersectionObserver callback edge cases', () => {
    it('handles empty entries array gracefully (isVisible stays false)', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      act(() => { observerCallback([]); });
      expect(screen.getByTestId('state')).toHaveTextContent('false');
    });

    it('handles null entries gracefully', () => {
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      act(() => { observerCallback(null); });
      expect(screen.getByTestId('state')).toHaveTextContent('false');
    });
  });

  describe('fallback when IntersectionObserver is unavailable', () => {
    it('sets isVisible=true immediately when IntersectionObserver is undefined', () => {
      delete global.IntersectionObserver;
      renderComponent({
        children: ({ isVisible }) => (
          <span data-testid="state">{String(isVisible)}</span>
        ),
      });
      expect(screen.getByTestId('state')).toHaveTextContent('true');
    });

    it('does not throw when IntersectionObserver is unavailable', () => {
      delete global.IntersectionObserver;
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('re-render on prop changes', () => {
    it('recreates the observer when partialVisibility changes', () => {
      const { rerender } = renderComponent({ partialVisibility: false });
      expect(observerOptions.threshold).toBe(1);
      act(() => {
        rerender(
          <VisibilitySensor partialVisibility>
            <span>child</span>
          </VisibilitySensor>,
        );
      });
      expect(observerOptions.threshold).toBe(0);
    });

    it('recreates the observer when containment changes', () => {
      const root1 = document.createElement('div');
      const root2 = document.createElement('div');
      const { rerender } = renderComponent({ containment: root1 });
      expect(observerOptions.root).toBe(root1);
      act(() => {
        rerender(
          <VisibilitySensor containment={root2}>
            <span>child</span>
          </VisibilitySensor>,
        );
      });
      expect(observerOptions.root).toBe(root2);
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
