/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dragger from './timeline-dragger';

let mockDraggableProps = {};

jest.mock('react-draggable', () => function MockDraggable(props) {
  mockDraggableProps = props;
  return props.children;
});

const defaultProps = {
  axisWidth: 800,
  disabled: false,
  draggerName: 'selected',
  draggerPosition: 100,
  draggerVisible: true,
  handleDragDragger: jest.fn(),
  isCompareModeActive: false,
  selectDragger: jest.fn(),
  toggleShowDraggerTime: jest.fn(),
  transformX: 0,
};

const renderComponent = (props = {}) => render(
  <svg>
    <Dragger {...defaultProps} {...props} />
  </svg>,
);

beforeEach(() => {
  mockDraggableProps = {};
  jest.clearAllMocks();
});

describe('Dragger', () => {
  describe('render — visibility', () => {
    it('returns null when draggerVisible is false', () => {
      const { container } = renderComponent({ draggerVisible: false });
      expect(container.querySelector('.timeline-dragger')).not.toBeInTheDocument();
    });

    it('renders when draggerVisible is true', () => {
      const { container } = renderComponent({ draggerVisible: true });
      expect(container.querySelector('.timeline-dragger')).toBeInTheDocument();
    });
  });

  describe('render — dragger name and letter', () => {
    it('renders draggerA class and letter A for draggerName="selected"', () => {
      const { container } = renderComponent({ draggerName: 'selected', isCompareModeActive: true });
      expect(container.querySelector('.draggerA')).toBeInTheDocument();
      expect(container.querySelector('text').textContent).toBe('A');
    });

    it('renders draggerB class and letter B for draggerName="selectedB"', () => {
      const { container } = renderComponent({ draggerName: 'selectedB', isCompareModeActive: true });
      expect(container.querySelector('.draggerB')).toBeInTheDocument();
      expect(container.querySelector('text').textContent).toBe('B');
    });
  });

  describe('render — compare mode content', () => {
    it('renders a text element when isCompareModeActive=true', () => {
      const { container } = renderComponent({ isCompareModeActive: true });
      expect(container.querySelector('text')).toBeInTheDocument();
      expect(container.querySelectorAll('rect[pointer-events="none"]')).toHaveLength(0);
    });

    it('renders 3 rects when isCompareModeActive=false', () => {
      const { container } = renderComponent({ isCompareModeActive: false });
      expect(container.querySelector('text')).not.toBeInTheDocument();
      expect(container.querySelectorAll('rect[pointer-events="none"]')).toHaveLength(3);
    });
  });

  describe('render — text fill in compare mode', () => {
    it('text fill is #ccc when disabled=true', () => {
      const { container } = renderComponent({ isCompareModeActive: true, disabled: true });
      expect(container.querySelector('text').getAttribute('fill')).toBe('#ccc');
    });

    it('text fill is #000 when disabled=false', () => {
      const { container } = renderComponent({ isCompareModeActive: true, disabled: false });
      expect(container.querySelector('text').getAttribute('fill')).toBe('#000');
    });
  });

  describe('render — Draggable props', () => {
    it('Draggable position.x is draggerPosition + 25', () => {
      renderComponent({ draggerPosition: 100 });
      expect(mockDraggableProps.position).toEqual({ x: 125, y: 0 });
    });

    it('Draggable disabled=true is forwarded', () => {
      renderComponent({ disabled: true });
      expect(mockDraggableProps.disabled).toBe(true);
    });

    it('Draggable disabled=false is forwarded', () => {
      renderComponent({ disabled: false });
      expect(mockDraggableProps.disabled).toBe(false);
    });
  });

  describe('render — g element attributes', () => {
    it('g has transform derived from transformX', () => {
      const { container } = renderComponent({ transformX: 42 });
      expect(container.querySelector('.timeline-dragger').getAttribute('transform')).toBe('translate(42)');
    });

    it('g clipPath is selectedDraggerClipA for dragger A', () => {
      const { container } = renderComponent({ draggerName: 'selected' });
      expect(container.querySelector('.timeline-dragger').getAttribute('clip-path')).toBe('url(#selectedDraggerClipA)');
    });

    it('g clipPath is selectedDraggerClipB for dragger B', () => {
      const { container } = renderComponent({ draggerName: 'selectedB' });
      expect(container.querySelector('.timeline-dragger').getAttribute('clip-path')).toBe('url(#selectedDraggerClipB)');
    });
  });

  describe('draggerFill (path fill) — not hovered', () => {
    it('disabled=true, not hovered → #666666', () => {
      const { container } = renderComponent({ disabled: true });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#666666');
    });

    it('disabled=false, not hovered → #ccc', () => {
      const { container } = renderComponent({ disabled: false });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#ccc');
    });
  });

  describe('draggerFill (path fill) — hovered via mouseEnter', () => {
    it('disabled=false, hovered, isCompareModeActive=true → #a3a3a3', () => {
      const { container } = renderComponent({ disabled: false, isCompareModeActive: true });
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.timeline-dragger'));
      });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#a3a3a3');
    });

    it('disabled=false, hovered, isCompareModeActive=false → #8e8e8e', () => {
      const { container } = renderComponent({ disabled: false, isCompareModeActive: false });
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.timeline-dragger'));
      });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#8e8e8e');
    });

    it('disabled=true, hovered → #8e8e8e', () => {
      const { container } = renderComponent({ disabled: true });
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.timeline-dragger'));
      });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#8e8e8e');
    });
  });

  describe('draggerStroke and draggerRectFill', () => {
    it('not hovered → path stroke #333, rect fill #515151', () => {
      const { container } = renderComponent({ isCompareModeActive: false });
      expect(container.querySelector('path').getAttribute('stroke')).toBe('#333');
      expect(container.querySelectorAll('rect[pointer-events="none"]')[0].getAttribute('fill')).toBe('#515151');
    });

    it('hovered → path stroke #ccc, rect fill #ccc', () => {
      const { container } = renderComponent({ isCompareModeActive: false });
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.timeline-dragger'));
      });
      expect(container.querySelector('path').getAttribute('stroke')).toBe('#ccc');
      expect(container.querySelectorAll('rect[pointer-events="none"]')[0].getAttribute('fill')).toBe('#ccc');
    });
  });

  describe('handleHoverMouseEnter / handleHoverMouseLeave', () => {
    it('mouseEnter sets isHoveredDrag=true — fill shifts to hovered value', () => {
      const { container } = renderComponent({ disabled: false, isCompareModeActive: false });
      act(() => {
        fireEvent.mouseEnter(container.querySelector('.timeline-dragger'));
      });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#8e8e8e');
    });

    it('mouseLeave after mouseEnter restores fill to non-hovered value', () => {
      const { container } = renderComponent({ disabled: false });
      const g = container.querySelector('.timeline-dragger');
      act(() => { fireEvent.mouseEnter(g); });
      act(() => { fireEvent.mouseLeave(g); });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#ccc');
    });
  });

  describe('selectDragger', () => {
    it('calls props.selectDragger with draggerName "selected" and event on mouseDown', () => {
      const selectDragger = jest.fn();
      renderComponent({ selectDragger, draggerName: 'selected' });
      const fakeEvent = { type: 'mousedown' };
      act(() => { mockDraggableProps.onMouseDown(fakeEvent); });
      expect(selectDragger).toHaveBeenCalledWith('selected', fakeEvent);
    });

    it('calls props.selectDragger with draggerName "selectedB" for dragger B', () => {
      const selectDragger = jest.fn();
      renderComponent({ selectDragger, draggerName: 'selectedB' });
      const fakeEvent = {};
      act(() => { mockDraggableProps.onMouseDown(fakeEvent); });
      expect(selectDragger).toHaveBeenCalledWith('selectedB', fakeEvent);
    });
  });

  describe('startShowDraggerTime / stopShowDraggerTime', () => {
    it('onStart calls toggleShowDraggerTime(true)', () => {
      const toggleShowDraggerTime = jest.fn();
      renderComponent({ toggleShowDraggerTime });
      act(() => { mockDraggableProps.onStart(); });
      expect(toggleShowDraggerTime).toHaveBeenCalledWith(true);
    });

    it('onStop calls toggleShowDraggerTime(false)', () => {
      const toggleShowDraggerTime = jest.fn();
      renderComponent({ toggleShowDraggerTime });
      act(() => { mockDraggableProps.onStop(); });
      expect(toggleShowDraggerTime).toHaveBeenCalledWith(false);
    });

    it('onStop sets isHoveredDragging=false — fill returns to non-hovered value', () => {
      const { container } = renderComponent({ disabled: false, isCompareModeActive: false });
      // Set isHoveredDragging=true via onDrag
      act(() => { mockDraggableProps.onDrag(null, { deltaX: 0, x: 50 }); });
      // onStop clears it
      act(() => { mockDraggableProps.onStop(); });
      expect(container.querySelector('path').getAttribute('fill')).toBe('#ccc');
    });
  });

  describe('handleDragDragger', () => {
    it('always sets isHoveredDragging=true when drag fires', () => {
      const { container } = renderComponent({ disabled: false, isCompareModeActive: false });
      act(() => { mockDraggableProps.onDrag(null, { deltaX: 0, x: 50 }); });
      // isHoveredDragging=true → isHovered=true → fill shifts
      expect(container.querySelector('path').getAttribute('fill')).toBe('#8e8e8e');
    });

    it('calls prop handleDragDragger when dragger is left of axis buffer (draggerPosition <= -15)', () => {
      const handleDragDragger = jest.fn();
      // -20 <= -15 → isDraggerLeftOfAxisBuffer=true
      renderComponent({ draggerPosition: -20, handleDragDragger });
      act(() => { mockDraggableProps.onDrag(null, { deltaX: 5, x: 0 }); });
      expect(handleDragDragger).toHaveBeenCalled();
    });

    it('calls prop handleDragDragger when dragger is right of axis buffer (draggerPosition + 85 >= axisWidth)', () => {
      const handleDragDragger = jest.fn();
      // 715 + 85 = 800 >= 800 → isDraggerRightOfAxisBuffer=true
      renderComponent({ draggerPosition: 715, axisWidth: 800, handleDragDragger });
      act(() => { mockDraggableProps.onDrag(null, { deltaX: 5, x: 0 }); });
      expect(handleDragDragger).toHaveBeenCalled();
    });

    it('returns false when deltaX<0 and dragger x is at axis start (x <= -15)', () => {
      const handleDragDragger = jest.fn();
      // draggerPosition=100 → not in any buffer zone
      renderComponent({ draggerPosition: 100, handleDragDragger });
      let result;
      act(() => {
        result = mockDraggableProps.onDrag(null, { deltaX: -5, x: -20 });
      });
      expect(result).toBe(false);
      expect(handleDragDragger).not.toHaveBeenCalled();
    });

    it('returns false when deltaX>0 and dragger x is at axis end (x + 36 >= axisWidth)', () => {
      const handleDragDragger = jest.fn();
      renderComponent({ draggerPosition: 100, axisWidth: 800, handleDragDragger });
      let result;
      act(() => {
        // 800 + 36 = 836 >= 800
        result = mockDraggableProps.onDrag(null, { deltaX: 5, x: 800 });
      });
      expect(result).toBe(false);
      expect(handleDragDragger).not.toHaveBeenCalled();
    });

    it('calls prop handleDragDragger once for normal rightward drag (no buffer, no edge)', () => {
      const handleDragDragger = jest.fn();
      renderComponent({ draggerPosition: 100, axisWidth: 800, handleDragDragger });
      act(() => { mockDraggableProps.onDrag(null, { deltaX: 5, x: 50 }); });
      expect(handleDragDragger).toHaveBeenCalledTimes(1);
    });

    it('calls prop handleDragDragger once for normal leftward drag (not at start)', () => {
      const handleDragDragger = jest.fn();
      renderComponent({ draggerPosition: 100, axisWidth: 800, handleDragDragger });
      act(() => { mockDraggableProps.onDrag(null, { deltaX: -5, x: 50 }); });
      expect(handleDragDragger).toHaveBeenCalledTimes(1);
    });
  });
});
