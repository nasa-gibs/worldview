/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, act } from '@testing-library/react';
import TimelineRangeSelector from './range-selection';

jest.mock('react-draggable', () => function MockDraggable({ children }) {
  return <g data-testid="draggable">{children}</g>;
});

// Capture the onDrag/onStop callbacks passed to child mocks so tests can invoke them directly
let capturedDraggerOnDrag = null;
let capturedRangeOnDrag = null;
let capturedOnStop = null;

jest.mock('./dragger', () => function MockDragger({ onDrag, onStop, id }) {
  capturedDraggerOnDrag = onDrag;
  capturedOnStop = onStop;
  return <g data-testid={`dragger-${id}`} />;
});

jest.mock('./dragger-range', () => function MockDraggerRange({ onDrag }) {
  capturedRangeOnDrag = onDrag;
  return <g data-testid="dragger-range" />;
});

const defaultProps = {
  axisWidth: 1000,
  startLocation: 100,
  endLocation: 400,
  startLocationDate: new Date('2023-01-01T00:00:00Z'),
  endLocationDate: new Date('2023-06-01T00:00:00Z'),
  timelineStartDateLimit: '2020-01-01T00:00:00Z',
  timelineEndDateLimit: '2025-01-01T00:00:00Z',
  timeScale: 'day',
  frontDate: '2023-01-01',
  position: 0,
  transformX: 0,
  pinWidth: 5,
  max: { width: 800, start: false, end: false, startOffset: 0 },
  updateAnimationDateAndLocation: jest.fn(),
};

function renderSelector(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(
    <svg>
      <TimelineRangeSelector {...props} />
    </svg>,
  );
}

describe('TimelineRangeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDraggerOnDrag = null;
    capturedRangeOnDrag = null;
    capturedOnStop = null;
  });

  describe('rendering', () => {
    it('renders the range selector svg element', () => {
      const { container } = renderSelector();
      // The component renders its own svg inside our wrapper svg
      expect(
        container.querySelector('#wv-timeline-range-selector'),
      ).toBeInTheDocument();
    });

    it('sets svg width from axisWidth prop', () => {
      const { container } = renderSelector({ axisWidth: 1200 });
      const inner = container.querySelector('#wv-timeline-range-selector');
      expect(inner.getAttribute('width')).toBe('1200');
    });

    it('renders two Dragger and one DraggerRange child components', () => {
      const { getByTestId } = renderSelector();
      expect(getByTestId('dragger-start')).toBeInTheDocument();
      expect(getByTestId('dragger-end')).toBeInTheDocument();
      expect(getByTestId('dragger-range')).toBeInTheDocument();
    });
  });

  describe('componentDidMount / updateLocation', () => {
    it('syncs startLocation and endLocation into state on mount without error', () => {
      // animationDraggerPositionUpdate is only called when delta != 0;
      // on mount state == props so delta == 0, no callback triggered
      const update = jest.fn();
      expect(() => renderSelector({ updateAnimationDateAndLocation: update }))
        .not.toThrow();
    });
  });

  describe('componentDidUpdate – updateLocation', () => {
    it('syncs new startLocation into state when prop changes', () => {
      // After prop change, drag to confirm state was updated via the new location
      const update = jest.fn();
      const { rerender } = renderSelector({ updateAnimationDateAndLocation: update });
      act(() => {
        rerender(
          <svg>
            <TimelineRangeSelector
              {...defaultProps}
              startLocation={200}
              updateAnimationDateAndLocation={update}
            />
          </svg>,
        );
      });
      update.mockClear();
      // Now drag the start dragger — it should read the updated startLocation (200)
      act(() => { capturedDraggerOnDrag(10, 'start'); }); // 200+10=210 < 400
      expect(update).toHaveBeenCalled();
    });

    it('syncs new endLocation into state when prop changes', () => {
      const update = jest.fn();
      const { rerender } = renderSelector({ updateAnimationDateAndLocation: update });
      act(() => {
        rerender(
          <svg>
            <TimelineRangeSelector
              {...defaultProps}
              endLocation={600}
              updateAnimationDateAndLocation={update}
            />
          </svg>,
        );
      });
      update.mockClear();
      // Drag end dragger — should read updated endLocation (600)
      act(() => { capturedDraggerOnDrag(10, 'end'); }); // 600+10=610 < 800
      expect(update).toHaveBeenCalled();
    });
  });

  describe('onItemDrag – start dragger', () => {
    it('updates state when start dragger moves within bounds', () => {
      const update = jest.fn();
      renderSelector({ updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(10, 'start'); }); // 100→110 < endLocation 400
      expect(update).toHaveBeenCalled();
    });

    it('ignores start drag that would go below 0', () => {
      const update = jest.fn();
      renderSelector({ startLocation: 5, updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(-20, 'start'); }); // 5-20 = -15 < 0
      expect(update).not.toHaveBeenCalled();
    });

    it('ignores start drag that would exceed endLocation', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 390,
        endLocation: 400,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(50, 'start'); }); // 390+50=440 > 400
      expect(update).not.toHaveBeenCalled();
    });

    it('pushes end dragger forward when start + pinWidth >= end', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 395,
        endLocation: 400,
        pinWidth: 5,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      // 396+5=401 >= 400, and 401 < 800 → end is pushed to 401, allowed
      act(() => { capturedDraggerOnDrag(1, 'start'); });
      expect(update).toHaveBeenCalled();
    });

    it('ignores start drag when start + pinWidth would exceed max width', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 795,
        endLocation: 800,
        pinWidth: 5,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(1, 'start'); }); // 796+5=801 >= 800
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('onItemDrag – end dragger', () => {
    it('updates state when end dragger moves within bounds', () => {
      const update = jest.fn();
      renderSelector({ updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(20, 'end'); }); // 400+20=420 < 800
      expect(update).toHaveBeenCalled();
    });

    it('ignores end drag that would exceed max width', () => {
      const update = jest.fn();
      renderSelector({ endLocation: 790, updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(20, 'end'); }); // 790+20=810 > 800
      expect(update).not.toHaveBeenCalled();
    });

    it('ignores end drag when startX > endX', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 400,
        endLocation: 410,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(-50, 'end'); }); // end=360, start(400) > 360
      expect(update).not.toHaveBeenCalled();
    });

    it('pulls start dragger back when start + 2*pinWidth >= end', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 395,
        endLocation: 406,
        pinWidth: 5,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(-1, 'end'); }); // end=405, 395+10=405 → start=400
      expect(update).toHaveBeenCalled();
    });
  });

  describe('onRangeDrag', () => {
    it('calls updateAnimationDateAndLocation when range is dragged', () => {
      const update = jest.fn();
      renderSelector({ updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedRangeOnDrag(10, 50); }); // shifts both start and end by 10
      expect(update).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        expect.any(Number),
        expect.any(Number),
        true, // isDragging
      );
    });

    it('shifts both start and end locations by the delta', () => {
      const update = jest.fn();
      renderSelector({
        startLocation: 100,
        endLocation: 400,
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedRangeOnDrag(50, 0); });
      const [, , newStart, newEnd] = update.mock.calls[0];
      expect(newStart).toBe(150);
      expect(newEnd).toBe(450);
    });
  });

  describe('onDragStop', () => {
    it('calls updateAnimationDateAndLocation with isDragging=false on stop', () => {
      const update = jest.fn();
      renderSelector({ updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedOnStop(); });
      const args = update.mock.calls[0];
      expect(args[4]).toBe(false); // isDragging
    });
  });

  describe('animationDraggerPositionUpdate – date limit clamping', () => {
    it('clamps end date to timelineStartDateLimit when end is before the start limit', () => {
      const update = jest.fn();
      renderSelector({
        endLocationDate: new Date('2019-01-01T00:00:00Z'),
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedOnStop(); });
      const [, endDate] = update.mock.calls[0];
      expect(new Date(endDate).toISOString()).toBe('2020-01-01T00:00:00.000Z');
    });

    it('clamps start date to timelineStartDateLimit when start is before start limit', () => {
      const update = jest.fn();
      renderSelector({
        startLocationDate: new Date('2019-01-01T00:00:00Z'),
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedOnStop(); });
      const [startDate] = update.mock.calls[0];
      expect(new Date(startDate).toISOString()).toBe('2020-01-01T00:00:00.000Z');
    });

    it('clamps end date to timelineEndDateLimit when end is after end limit', () => {
      const update = jest.fn();
      renderSelector({
        endLocationDate: new Date('2030-01-01T00:00:00Z'),
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedOnStop(); });
      const [, endDate] = update.mock.calls[0];
      expect(new Date(endDate).toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('clamps start date to timelineEndDateLimit when start is after end limit', () => {
      const update = jest.fn();
      renderSelector({
        startLocationDate: new Date('2030-01-01T00:00:00Z'),
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedOnStop(); });
      const [startDate] = update.mock.calls[0];
      expect(new Date(startDate).toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('getAnimationLocateDateUpdate – month/year timeScale', () => {
    it('computes a new date for month timeScale (scaleMs is null)', () => {
      const update = jest.fn();
      renderSelector({ timeScale: 'month', updateAnimationDateAndLocation: update });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(12, 'start'); });
      expect(update).toHaveBeenCalled();
    });

    it('computes a new date for year timeScale (scaleMs is null)', () => {
      const update = jest.fn();
      renderSelector({
        timeScale: 'year',
        frontDate: '2023-01-01',
        updateAnimationDateAndLocation: update,
      });
      update.mockClear();
      act(() => { capturedDraggerOnDrag(18, 'start'); });
      expect(update).toHaveBeenCalled();
    });
  });
});
