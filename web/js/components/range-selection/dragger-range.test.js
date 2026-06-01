/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import '@testing-library/jest-dom';
import { render, act } from '@testing-library/react';
import TimelineDraggerRange from './dragger-range';

jest.mock('react-draggable', () => function MockDraggable({
  children, onDrag, onStop,
}) {
  return (
    <g
      data-testid="draggable"
      onMouseMove={(e) => onDrag && onDrag(e, { deltaX: 10, x: 100 })}
      onMouseUp={() => onStop && onStop()}
    >
      {children}
    </g>
  );
});

const BASE_DATE = new Date('2023-06-01T00:00:00Z');
const LIMIT_DATE = '2023-12-31T00:00:00Z';

const defaultProps = {
  startLocation: 100,
  endLocation: 300,
  startLocationDate: new Date('2023-01-01T00:00:00Z'),
  endLocationDate: BASE_DATE,
  timelineStartDateLimit: '2020-01-01T00:00:00Z',
  timelineEndDateLimit: LIMIT_DATE,
  timeScale: 'day',
  deltaStart: 0,
  max: { width: 800, start: false, end: false, startOffset: 0 },
  height: 64,
  width: 5,
  color: '#45bdff',
  opacity: 0.3,
  draggerID: 'range-dragger',
  onDrag: jest.fn(),
  onStop: jest.fn(),
};

function renderRange(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(
    <svg>
      <TimelineDraggerRange {...props} />
    </svg>,
  );
}

describe('TimelineDraggerRange', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial render', () => {
    it('renders a rect element', () => {
      const { container } = renderRange();
      expect(container.querySelector('rect')).toBeInTheDocument();
    });

    it('applies the draggerID to the rect', () => {
      const { container } = renderRange({ draggerID: 'my-range' });
      expect(container.querySelector('#my-range')).toBeInTheDocument();
    });

    it('applies color and opacity as fill style', () => {
      const { container } = renderRange({ color: '#ff0000', opacity: 0.5 });
      const rect = container.querySelector('rect');
      expect(rect.getAttribute('fill')).toBe('#ff0000');
      expect(rect.style.fillOpacity).toBe('0.5');
    });

    it('applies height to the rect', () => {
      const { container } = renderRange({ height: 48 });
      expect(container.querySelector('rect').getAttribute('height')).toBe('48');
    });
  });

  describe('checkWidth (width calculation)', () => {
    it('sets rect width to endLocation minus startLocation', () => {
      const { container } = renderRange({ startLocation: 100, endLocation: 400 });
      expect(container.querySelector('rect').getAttribute('width')).toBe('300');
    });

    it('clamps startLocation to 0 when it is negative', () => {
      // start=-50, end=200 → clamped start=0, width=200
      const { container } = renderRange({ startLocation: -50, endLocation: 200 });
      expect(container.querySelector('rect').getAttribute('width')).toBe('200');
    });

    it('clamps endLocation to maxWidth when it exceeds max', () => {
      // start=600, end=900 → clamped end=800, width=200
      const { container } = renderRange({ startLocation: 600, endLocation: 900 });
      expect(container.querySelector('rect').getAttribute('width')).toBe('200');
    });

    it('sets width to 0 when end is less than start', () => {
      const { container } = renderRange({ startLocation: 500, endLocation: 200 });
      expect(container.querySelector('rect').getAttribute('width')).toBe('0');
    });
  });

  describe('handleStartPositionRestriction', () => {
    it('returns startLocation - deltaStart when startLocation > 0', () => {
      // startLocation=100, deltaStart=20 → x = 100-20 = 80
      const { container } = renderRange({ startLocation: 100, deltaStart: 20 });
      const rect = container.querySelector('rect');
      expect(Number(rect.getAttribute('x'))).toBe(80);
    });

    it('returns -deltaStart when startLocation <= 0', () => {
      // startLocation=0, deltaStart=30 → x = -30
      const { container } = renderRange({ startLocation: 0, deltaStart: 30 });
      const rect = container.querySelector('rect');
      expect(Number(rect.getAttribute('x'))).toBe(-30);
    });
  });

  describe('componentDidUpdate', () => {
    it('recalculates width when startLocation prop changes', () => {
      const { container, rerender } = renderRange({ startLocation: 100, endLocation: 400 });
      expect(container.querySelector('rect').getAttribute('width')).toBe('300');
      act(() => {
        rerender(
          <svg>
            <TimelineDraggerRange {...defaultProps} startLocation={200} endLocation={400} />
          </svg>,
        );
      });
      expect(container.querySelector('rect').getAttribute('width')).toBe('200');
    });

    it('recalculates width when endLocation prop changes', () => {
      const { container, rerender } = renderRange({ startLocation: 100, endLocation: 300 });
      act(() => {
        rerender(
          <svg>
            <TimelineDraggerRange {...defaultProps} startLocation={100} endLocation={500} />
          </svg>,
        );
      });
      expect(container.querySelector('rect').getAttribute('width')).toBe('400');
    });
  });

  describe('handleDrag – day scale (scaleMs set)', () => {
    it('calls onDrag when dragged forward within bounds', () => {
      const onDrag = jest.fn();
      const { container } = renderRange({ onDrag });
      act(() => {
        container.querySelector('[data-testid="draggable"]').dispatchEvent(
          new MouseEvent('mousemove', { bubbles: true }),
        );
      });
      expect(onDrag).toHaveBeenCalled();
    });

    it('passes deltaX=0 when endLocationDate has reached the timeline end limit', () => {
      const onDrag = jest.fn();
      // endLocationDate === timelineEndDateLimit → dragging right stops
      renderRange({
        onDrag,
        endLocationDate: new Date(LIMIT_DATE),
        timelineEndDateLimit: LIMIT_DATE,
      });
      // The drag mock sends deltaX=10 (rightward); the component should zero it
      const { container } = renderRange({
        onDrag,
        endLocationDate: new Date(LIMIT_DATE),
        timelineEndDateLimit: LIMIT_DATE,
      });
      act(() => {
        container.querySelector('[data-testid="draggable"]').dispatchEvent(
          new MouseEvent('mousemove', { bubbles: true }),
        );
      });
      // deltaX was throttled to 0 because we are at the end limit
      const [calledDeltaX] = onDrag.mock.calls[0];
      expect(calledDeltaX).toBe(0);
    });
  });

  describe('handleDrag – month/year scale (scaleMs null)', () => {
    it('handles month timeScale without error', () => {
      const onDrag = jest.fn();
      const { container } = renderRange({ onDrag, timeScale: 'month' });
      expect(() => {
        act(() => {
          container.querySelector('[data-testid="draggable"]').dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true }),
          );
        });
      }).not.toThrow();
    });

    it('handles year timeScale without error', () => {
      const onDrag = jest.fn();
      const { container } = renderRange({ onDrag, timeScale: 'year' });
      expect(() => {
        act(() => {
          container.querySelector('[data-testid="draggable"]').dispatchEvent(
            new MouseEvent('mousemove', { bubbles: true }),
          );
        });
      }).not.toThrow();
    });
  });

  describe('handleDraggerClick', () => {
    it('updates previousStartLocation when startLocation has changed', () => {
      const { container, rerender } = renderRange({ startLocation: 100 });
      // Move the start location so startLocation in state != previousStartLocation
      act(() => {
        rerender(
          <svg>
            <TimelineDraggerRange {...defaultProps} startLocation={200} endLocation={400} />
          </svg>,
        );
      });
      // Click the rect — should not throw
      expect(() => {
        act(() => {
          container.querySelector('rect').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      }).not.toThrow();
    });

    it('does not throw when startLocation has not changed (click without drag)', () => {
      const { container } = renderRange({ startLocation: 100 });
      expect(() => {
        act(() => {
          container.querySelector('rect').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      }).not.toThrow();
    });
  });

  describe('onStop', () => {
    it('calls onStop when drag ends', () => {
      const onStop = jest.fn();
      const { container } = renderRange({ onStop });
      act(() => {
        container.querySelector('[data-testid="draggable"]').dispatchEvent(
          new MouseEvent('mouseup', { bubbles: true }),
        );
      });
      expect(onStop).toHaveBeenCalled();
    });
  });
});
