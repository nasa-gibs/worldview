/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeToDelete from './swipe-to-delete';

// JSDOM 26.x ships without PointerEvent. Without this polyfill, fireEvent falls
// back to a plain Event whose pointerId is always undefined, causing the
// pointerIdRef mismatch that silently swallows onPointerUp/onPointerCancel calls.
if (typeof PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.pointerType = params.pointerType ?? '';
      this.isPrimary = params.isPrimary ?? false;
    }
  }
  global.PointerEvent = PointerEventPolyfill;
}

const defaultProps = {
  children: <span>child content</span>,
  onDelete: jest.fn(),
  item: { id: 1 },
  deleteSwipe: 0.33,
};

const renderComponent = (props = {}) => {
  const merged = { ...defaultProps, ...props };
  const result = render(<SwipeToDelete {...merged}>{merged.children}</SwipeToDelete>);
  const div = result.container.firstChild;
  div.getBoundingClientRect = jest.fn(() => ({ width: 300 }));
  div.setPointerCapture = jest.fn();
  return { ...result, div };
};

// RTL v16 no longer wraps fireEvent in act(), so React 19 state updates
// (setTranslateX, setIsDragging) are not flushed before assertions run.
// Wrapping each helper in act() ensures the DOM reflects state after every event.
const pdown = (el, x, y, id = 1) => {
  act(() => { fireEvent.pointerDown(el, { pointerId: id, clientX: x, clientY: y }); });
};
const pmove = (el, x, y, id = 1) => {
  act(() => { fireEvent.pointerMove(el, { pointerId: id, clientX: x, clientY: y }); });
};
const pup = (el, id = 1) => act(() => { fireEvent.pointerUp(el, { pointerId: id }); });
const pcancel = (el, id = 1) => act(() => { fireEvent.pointerCancel(el, { pointerId: id }); });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SwipeToDelete', () => {
  describe('rendering', () => {
    it('renders children', () => {
      const { getByText } = renderComponent();
      expect(getByText('child content')).toBeInTheDocument();
    });

    it('renders a div wrapper', () => {
      const { div } = renderComponent();
      expect(div.tagName).toBe('DIV');
    });

    it('sets touchAction pan-y on the wrapper element', () => {
      const { div } = renderComponent();
      // toHaveStyle cannot verify touch-action via getComputedStyle in JSDOM
      expect(div.style.touchAction).toBe('pan-y');
    });

    it('starts with translateX(0px) transform', () => {
      const { div } = renderComponent();
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('starts with ease-out transition when not dragging', () => {
      const { div } = renderComponent();
      expect(div).toHaveStyle({ transition: 'transform 150ms ease-out' });
    });
  });

  describe('onPointerDown', () => {
    it('calls setPointerCapture with the pointer id', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0, 1);
      expect(div.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('ignores a second pointer while one is already tracked', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0, 1);
      pdown(div, 50, 0, 2);
      pmove(div, 100, 0, 2); // second pointer — ignored
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('does not throw when setPointerCapture is absent on the element', () => {
      const { div } = renderComponent();
      delete div.setPointerCapture;
      expect(() => pdown(div, 0, 0)).not.toThrow();
    });
  });

  describe('onPointerMove — jitter threshold', () => {
    it('ignores tiny movements (< 10px on both axes)', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, 5, 5);
      expect(div).toHaveStyle({ transform: 'translateX(0px)', transition: 'transform 150ms ease-out' });
    });

    it('ignores move events from a different pointer id', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0, 1);
      pmove(div, -50, 0, 2);
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });
  });

  describe('onPointerMove — horizontal swipe', () => {
    it('sets transition to "none" while dragging horizontally', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -20, 0);
      expect(div).toHaveStyle({ transition: 'none' });
    });

    it('updates translateX for a left swipe', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      expect(div).toHaveStyle({ transform: 'translateX(-50px)' });
    });

    it('clamps a right swipe to translateX(0px)', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, 50, 0);
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('calls e.preventDefault when the move event is cancelable', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -20, 0); // decide direction as horizontal first
      const moveEvent = new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: -40,
        clientY: 0,
        cancelable: true,
        bubbles: true,
      });
      const preventSpy = jest.spyOn(moveEvent, 'preventDefault');
      act(() => { div.dispatchEvent(moveEvent); });
      expect(preventSpy).toHaveBeenCalled();
    });

    it('does not call e.preventDefault when the move event is not cancelable', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -20, 0);
      const moveEvent = new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: -40,
        clientY: 0,
        cancelable: false,
        bubbles: true,
      });
      const preventSpy = jest.spyOn(moveEvent, 'preventDefault');
      act(() => { div.dispatchEvent(moveEvent); });
      expect(preventSpy).not.toHaveBeenCalled();
    });
  });

  describe('onPointerMove — vertical swipe', () => {
    it('does not translate when swipe is vertical', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, 0, 50);
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('does not set isDragging when swipe is vertical', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, 0, 50);
      expect(div).toHaveStyle({ transition: 'transform 150ms ease-out' });
    });
  });

  describe('onPointerUp — delete threshold', () => {
    it('calls onDelete when left swipe meets the threshold', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete, item: { id: 42 } });
      pdown(div, 0, 0);
      pmove(div, -100, 0); // |-100| = 100 >= 99
      pup(div);
      expect(onDelete).toHaveBeenCalledWith({ id: 42 });
    });

    it('does not call onDelete when swipe is below the threshold', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0);
      pmove(div, -50, 0); // |-50| = 50 < 99
      pup(div);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not call onDelete for a vertical swipe', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0);
      pmove(div, 0, 200);
      pup(div);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not call onDelete when getBoundingClientRect returns zero width', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      div.getBoundingClientRect = jest.fn(() => ({ width: 0 }));
      pdown(div, 0, 0);
      pmove(div, -300, 0);
      pup(div);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not call onDelete when deleteSwipe is 0', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete, deleteSwipe: 0 });
      pdown(div, 0, 0);
      pmove(div, -300, 0);
      pup(div);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not throw when onDelete is null', () => {
      const { div } = renderComponent({ onDelete: null });
      pdown(div, 0, 0);
      pmove(div, -200, 0);
      expect(() => pup(div)).not.toThrow();
    });

    it('resets translateX to 0 after pointer up', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pup(div);
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('restores ease-out transition after pointer up', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pup(div);
      expect(div).toHaveStyle({ transition: 'transform 150ms ease-out' });
    });

    it('ignores pointer up from a different pointer id', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0, 1);
      pmove(div, -200, 0, 1);
      pup(div, 2); // wrong id — no delete
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('allows a new gesture after one completes', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pup(div); // below threshold
      pdown(div, 0, 0);
      pmove(div, -100, 0);
      pup(div); // above threshold
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('onPointerCancel', () => {
    it('resets translateX to 0 on cancel', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pcancel(div);
      expect(div).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('restores ease-out transition on cancel', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pcancel(div);
      expect(div).toHaveStyle({ transition: 'transform 150ms ease-out' });
    });

    it('ignores cancel from a different pointer id', () => {
      const { div } = renderComponent();
      pdown(div, 0, 0, 1);
      pmove(div, -50, 0, 1);
      pcancel(div, 2); // wrong id — gesture stays live
      expect(div).toHaveStyle({ transform: 'translateX(-50px)' });
    });

    it('does not call onDelete on cancel even when swipe exceeds threshold', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0);
      pmove(div, -200, 0);
      pcancel(div);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('allows a new gesture after cancel', () => {
      const onDelete = jest.fn();
      const { div } = renderComponent({ onDelete });
      pdown(div, 0, 0);
      pmove(div, -50, 0);
      pcancel(div);
      pdown(div, 0, 0);
      pmove(div, -200, 0);
      pup(div);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
