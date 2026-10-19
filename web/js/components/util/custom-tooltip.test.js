/* eslint-disable react/jsx-props-no-spreading */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomTooltip from './custom-tooltip';

const defaultProps = {
  id: 'evt1',
  text: 'Tooltip text',
  hideTooltip: false,
  isSelected: false,
};

const renderComponent = (props = {}) => render(
  <CustomTooltip {...defaultProps} {...props}>
    <span data-testid="child">hover me</span>
  </CustomTooltip>,
);

const getTooltip = (id = 'evt1') => document.getElementById(`tooltip-${id}`);
const getArrow = (id = 'evt1') => document.getElementById(`arrow-tooltip-${id}`);

const mockRect = (overrides = {}) => ({
  x: 100,
  y: 200,
  width: 80,
  height: 20,
  top: 200,
  left: 100,
  right: 180,
  bottom: 220,
  ...overrides,
});

beforeEach(() => {
  // Clean up any marker-container between tests
  const mc = document.getElementById('marker-container');
  if (mc) mc.remove();
});

afterEach(() => {
  const mc = document.getElementById('marker-container');
  if (mc) mc.remove();
});

describe('CustomTooltip', () => {
  describe('initialization (useEffect)', () => {
    it('renders the wrapper div', () => {
      renderComponent();
      expect(screen.getByTestId('child').parentElement.tagName).toBe('DIV');
    });

    it('creates tooltip div with id "tooltip-{id}"', () => {
      renderComponent();
      expect(getTooltip()).toBeInTheDocument();
    });

    it('tooltip div has class "events-tooltip"', () => {
      renderComponent();
      expect(getTooltip()).toHaveClass('events-tooltip');
    });

    it('tooltip div innerHTML equals the text prop', () => {
      renderComponent({ text: 'Hello World' });
      expect(document.getElementById('tooltip-evt1').innerHTML).toBe('Hello World');
    });

    it('creates arrow div with id "arrow-tooltip-{id}"', () => {
      renderComponent();
      expect(getArrow()).toBeInTheDocument();
    });

    it('arrow div has class "events-tooltip-arrow"', () => {
      renderComponent();
      expect(getArrow()).toHaveClass('events-tooltip-arrow');
    });

    it('creates marker-container and appends to body when absent', () => {
      renderComponent();
      const mc = document.getElementById('marker-container');
      expect(mc).toBeInTheDocument();
      expect(document.body.contains(mc)).toBe(true);
    });

    it('reuses existing marker-container instead of creating a new one', () => {
      const existing = document.createElement('div');
      existing.setAttribute('id', 'marker-container');
      document.body.appendChild(existing);

      renderComponent();

      const allMC = document.querySelectorAll('#marker-container');
      expect(allMC.length).toBe(1);
    });

    it('appends both tooltip and arrow to marker-container', () => {
      renderComponent();
      const mc = document.getElementById('marker-container');
      expect(mc.contains(getTooltip())).toBe(true);
      expect(mc.contains(getArrow())).toBe(true);
    });

    it('removes tooltip and arrow divs on unmount', () => {
      const { unmount } = renderComponent();
      act(() => { unmount(); });
      expect(getTooltip()).not.toBeInTheDocument();
      expect(getArrow()).not.toBeInTheDocument();
    });
  });

  describe('children', () => {
    it('renders children inside the wrapper', () => {
      renderComponent();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('handleOnEnter — mouseenter', () => {
    it('does nothing when hideTooltip is true', () => {
      renderComponent({ hideTooltip: true });
      const wrapper = screen.getByTestId('child').parentElement;
      // Should not throw
      fireEvent.mouseEnter(wrapper);
      expect(getTooltip().style.visibility).not.toBe('visible');
    });

    it('returns early when tooltip element is not found in DOM', () => {
      renderComponent();
      // Remove tooltip from DOM to simulate null case
      getTooltip().remove();
      const wrapper = screen.getByTestId('child').parentElement;
      expect(() => fireEvent.mouseEnter(wrapper)).not.toThrow();
    });

    it('sets tooltip visibility to "visible" on mouseenter', () => {
      renderComponent();
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());
      fireEvent.mouseEnter(wrapper);
      expect(getTooltip().style.visibility).toBe('visible');
    });

    it('sets arrow visibility to "visible" on mouseenter', () => {
      renderComponent();
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());
      fireEvent.mouseEnter(wrapper);
      expect(getArrow().style.visibility).toBe('visible');
    });

    it('positions tooltip using default (not selected) formula', () => {
      renderComponent({ isSelected: false });
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect({ x: 100, y: 200, height: 20, width: 80 }));
      jest.spyOn(getTooltip(), 'getBoundingClientRect').mockReturnValue(mockRect({ width: 60, height: 20, x: 70, y: 180 }));

      fireEvent.mouseEnter(wrapper);

      // Non-selected: tooltipTop = y - height/2 - 20 - 0 = 200 - 10 - 20 - 0 = 170px
      expect(getTooltip().style.top).toBe('170px');
      // tooltipLeft = x - width/2 + 13 = 100 - 30 + 13 = 83px
      expect(getTooltip().style.left).toBe('83px');
    });

    it('positions tooltip using isSelected formula', () => {
      renderComponent({ isSelected: true });
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect({ x: 100, y: 200, height: 20, width: 80 }));
      jest.spyOn(getTooltip(), 'getBoundingClientRect').mockReturnValue(mockRect({ width: 60, height: 20, x: 70, y: 180 }));

      fireEvent.mouseEnter(wrapper);

      // isSelected: tooltipTop = y - height/2 - 0 - 10 = 200 - 10 - 0 - 10 = 180px
      expect(getTooltip().style.top).toBe('180px');
      // tooltipLeft = x - width/2 + 17 = 100 - 30 + 17 = 87px
      expect(getTooltip().style.left).toBe('87px');
    });

    it('adds wrappedText offset of 10 when tooltip height > 30', () => {
      renderComponent({ isSelected: false });
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect({ x: 100, y: 200, height: 20, width: 80 }));
      // height > 30 → wrappedText = 10
      jest.spyOn(getTooltip(), 'getBoundingClientRect').mockReturnValue(mockRect({ width: 60, height: 40, x: 70, y: 150 }));

      fireEvent.mouseEnter(wrapper);

      // tooltipTop = 200 - 10 - 20 - 10 = 160px
      expect(getTooltip().style.top).toBe('160px');
    });

    it('positions the arrow relative to the (re-read) tooltip rect', () => {
      renderComponent();
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());
      const tooltipEl = getTooltip();
      // First call returns initial rect; second (for arrow calc) returns updated rect
      jest.spyOn(tooltipEl, 'getBoundingClientRect')
        .mockReturnValueOnce(mockRect({ width: 60, height: 20, x: 70, y: 180 }))
        .mockReturnValueOnce(mockRect({ width: 60, height: 20, x: 70, y: 170 }));

      fireEvent.mouseEnter(wrapper);

      // arrowTop = y + 5 + wrappedText + 0 = 170 + 5 + 0 + 0 = 175px
      expect(getArrow().style.top).toBe('175px');
      // arrowLeft = x + width/2 - 10 = 70 + 30 - 10 = 90px
      expect(getArrow().style.left).toBe('90px');
    });

    it('adds extra 3px to arrow top when wrappedText > 0', () => {
      renderComponent({ isSelected: false });
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect({ x: 100, y: 200, height: 20, width: 80 }));
      const tooltipEl = getTooltip();
      // height > 30 → wrappedText = 10
      jest.spyOn(tooltipEl, 'getBoundingClientRect')
        .mockReturnValueOnce(mockRect({ width: 60, height: 40, x: 70, y: 150 }))
        .mockReturnValueOnce(mockRect({ width: 60, height: 40, x: 70, y: 160 }));

      fireEvent.mouseEnter(wrapper);

      // arrowTop = y + 5 + 10 + 3 = 160 + 5 + 10 + 3 = 178px
      expect(getArrow().style.top).toBe('178px');
    });
  });

  describe('handleOnLeave — mouseleave', () => {
    it('sets tooltip visibility to "hidden" on mouseleave', () => {
      renderComponent();
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());
      fireEvent.mouseEnter(wrapper);
      fireEvent.mouseLeave(wrapper);
      expect(getTooltip().style.visibility).toBe('hidden');
    });

    it('sets arrow visibility to "hidden" on mouseleave', () => {
      renderComponent();
      const wrapper = screen.getByTestId('child').parentElement;
      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect());
      fireEvent.mouseEnter(wrapper);
      fireEvent.mouseLeave(wrapper);
      expect(getArrow().style.visibility).toBe('hidden');
    });

    it('returns early without error when tooltip element is missing from DOM', () => {
      renderComponent();
      getTooltip().remove();
      const wrapper = screen.getByTestId('child').parentElement;
      expect(() => fireEvent.mouseLeave(wrapper)).not.toThrow();
    });
  });
});
