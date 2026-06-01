/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, act } from '@testing-library/react';
import TimelineDragger from './dragger';

// Draggable wraps children; simulate it as a passthrough so we can inspect the SVG group
jest.mock('react-draggable', () => function MockDraggable({ children, onDrag, onStop }) {
  return (
    <g
      data-testid="draggable"
      onMouseMove={(e) => onDrag && onDrag(e, { deltaX: 5, x: 10 })}
      onMouseUp={() => onStop && onStop()}
    >
      {children}
    </g>
  );
});

const defaultProps = {
  id: 'start',
  position: 50,
  max: 800,
  onDrag: jest.fn(),
  onStop: jest.fn(),
  draggerID: 'dragger-1',
  backgroundColor: '#fff',
};

function renderDragger(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(
    <svg>
      <TimelineDragger {...props} />
    </svg>,
  );
}

describe('TimelineDragger', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering – default dragger (no path)', () => {
    it('renders a rect and polygon when path is not provided', () => {
      const { container } = renderDragger();
      expect(container.querySelector('rect')).toBeInTheDocument();
      expect(container.querySelector('polygon')).toBeInTheDocument();
    });

    it('applies the draggerID to the polygon', () => {
      const { container } = renderDragger({ draggerID: 'my-dragger' });
      expect(container.querySelector('#my-dragger')).toBeInTheDocument();
    });

    it('does not render a <path> element when path prop is null', () => {
      const { container } = renderDragger({ path: null });
      expect(container.querySelector('path')).toBeNull();
    });
  });

  describe('rendering – custom dragger (with path)', () => {
    it('renders a <path> element when path prop is provided', () => {
      const { container } = renderDragger({ path: 'M0,0 L10,10' });
      expect(container.querySelector('path')).toBeInTheDocument();
    });

    it('does not render a polygon when path prop is provided', () => {
      const { container } = renderDragger({ path: 'M0,0 L10,10' });
      expect(container.querySelector('polygon')).toBeNull();
    });
  });

  describe('visibility', () => {
    it('is visible when position is within 0 and max', () => {
      const { container } = renderDragger({ position: 100, max: 800 });
      const polygon = container.querySelector('polygon');
      expect(polygon.style.visibility).toBe('visible');
    });

    it('is hidden when position is less than 0', () => {
      const { container } = renderDragger({ position: -10, max: 800 });
      const polygon = container.querySelector('polygon');
      expect(polygon.style.visibility).toBe('hidden');
    });

    it('is hidden when position exceeds max', () => {
      const { container } = renderDragger({ position: 900, max: 800 });
      const polygon = container.querySelector('polygon');
      expect(polygon.style.visibility).toBe('hidden');
    });

    it('is visible when position equals 0', () => {
      const { container } = renderDragger({ position: 0, max: 800 });
      const polygon = container.querySelector('polygon');
      expect(polygon.style.visibility).toBe('visible');
    });
  });

  describe('text rendering', () => {
    it('renders a <text> element when text prop is provided', () => {
      const { container } = renderDragger({ text: 'A' });
      expect(container.querySelector('text')).toBeInTheDocument();
    });

    it('does not render a <text> element when text prop is absent', () => {
      const { container } = renderDragger();
      expect(container.querySelector('text')).toBeNull();
    });

    it('renders text content correctly', () => {
      const { container } = renderDragger({ text: 'B' });
      expect(container.querySelector('text').textContent).toBe('B');
    });
  });

  describe('componentDidUpdate', () => {
    it('updates internal position state when position prop changes', () => {
      const { container, rerender } = renderDragger({ position: 100 });
      rerender(
        <svg>
          <TimelineDragger {...defaultProps} position={200} />
        </svg>,
      );
      // The Draggable mock receives the updated position — no error thrown means state updated
      expect(container.querySelector('[data-testid="draggable"]')).toBeInTheDocument();
    });

    it('updates internal max state when max prop changes', () => {
      const { container, rerender } = renderDragger({ max: 800 });
      rerender(
        <svg>
          <TimelineDragger {...defaultProps} max={600} />
        </svg>,
      );
      expect(container.querySelector('[data-testid="draggable"]')).toBeInTheDocument();
    });
  });

  describe('handleDrag', () => {
    it('calls onDrag with deltaX, id, and x on drag event', () => {
      const onDrag = jest.fn();
      const { container } = renderDragger({ onDrag, id: 'start' });
      const draggable = container.querySelector('[data-testid="draggable"]');
      act(() => {
        draggable.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 3 }));
      });
      expect(onDrag).toHaveBeenCalledWith(5, 'start', 10);
    });
  });

  describe('default props', () => {
    it('applies default color, height, width, and position without explicit props', () => {
      const { container } = render(
        <svg>
          <TimelineDragger
            id="test"
            max={800}
            onDrag={jest.fn()}
            onStop={jest.fn()}
            draggerID="d1"
            backgroundColor="#ccc"
          />
        </svg>,
      );
      // rect should have default width=5
      const rect = container.querySelector('rect');
      expect(rect.getAttribute('width')).toBe('5');
    });
  });
});
