/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./axis-timescale-change-controls', () => function MockControls({
  timeScale,
  hasSubdailyLayers,
  toolTipHovered,
  changeTimeScale,
  incrementTimeScale,
  decrementTimeScale,
}) {
  return (
    <div
      data-testid="controls"
      data-timescale={timeScale}
      data-has-subdaily={String(hasSubdailyLayers)}
      data-tooltip-hovered={String(toolTipHovered)}
    >
      <button type="button" data-testid="increment-btn" onClick={incrementTimeScale}>increment</button>
      <button type="button" data-testid="decrement-btn" onClick={decrementTimeScale}>decrement</button>
      <button type="button" data-testid="change-btn" onClick={() => changeTimeScale(3)}>change</button>
    </div>
  );
});

import AxisTimeScaleChange from './axis-timescale-change';

const defaultProps = {
  timeScale: 'day',
  timelineHidden: false,
  hasSubdailyLayers: false,
  isDraggerDragging: false,
  changeTimeScale: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <AxisTimeScaleChange {...defaultProps} {...props} />,
);

describe('AxisTimeScaleChange', () => {
  beforeEach(() => {
    defaultProps.changeTimeScale.mockClear();
  });

  describe('rendering', () => {
    it('renders outer container with zoom-level-change class', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass('zoom-level-change');
    });

    it('shows controls when timeScale is provided', () => {
      const { getByTestId } = renderComponent({ timeScale: 'day' });
      expect(getByTestId('controls')).toBeInTheDocument();
    });

    it('renders nothing inside hover wrapper when timeScale is falsy', () => {
      const { queryByTestId } = renderComponent({ timeScale: '' });
      expect(queryByTestId('controls')).not.toBeInTheDocument();
    });

    it('is visible when timelineHidden is false', () => {
      const { container } = renderComponent({ timelineHidden: false });
      expect(container.firstChild.style.display).toBe('block');
    });

    it('is hidden when timelineHidden is true', () => {
      const { container } = renderComponent({ timelineHidden: true });
      expect(container.firstChild.style.display).toBe('none');
    });
  });

  describe('prop forwarding to controls', () => {
    it('passes timeScale to controls', () => {
      const { getByTestId } = renderComponent({ timeScale: 'month' });
      expect(getByTestId('controls').dataset.timescale).toBe('month');
    });

    it('passes hasSubdailyLayers=true to controls', () => {
      const { getByTestId } = renderComponent({ hasSubdailyLayers: true });
      expect(getByTestId('controls').dataset.hasSubdaily).toBe('true');
    });

    it('passes hasSubdailyLayers=false to controls', () => {
      const { getByTestId } = renderComponent({ hasSubdailyLayers: false });
      expect(getByTestId('controls').dataset.hasSubdaily).toBe('false');
    });

    it('initially passes toolTipHovered=false to controls', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('false');
    });

    it('passes changeTimeScale through to controls and it is callable', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ changeTimeScale });
      fireEvent.click(getByTestId('change-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(3);
    });
  });

  describe('toolTipHoverOn / toolTipHoverOff', () => {
    it('sets toolTipHovered to true on mouseenter when not dragging', () => {
      const { getByTestId, container } = renderComponent({ isDraggerDragging: false });
      fireEvent.mouseEnter(container.firstChild.firstChild);
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('true');
    });

    it('does not set toolTipHovered when isDraggerDragging is true', () => {
      const { getByTestId, container } = renderComponent({ isDraggerDragging: true });
      fireEvent.mouseEnter(container.firstChild.firstChild);
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('false');
    });

    it('sets toolTipHovered back to false on mouseleave', () => {
      const { getByTestId, container } = renderComponent({ isDraggerDragging: false });
      const hoverWrapper = container.firstChild.firstChild;
      fireEvent.mouseEnter(hoverWrapper);
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('true');
      fireEvent.mouseLeave(hoverWrapper);
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('false');
    });

    it('mouseleave resets tooltip even if dragging prevented hover-on', () => {
      const { getByTestId, container } = renderComponent({ isDraggerDragging: true });
      const hoverWrapper = container.firstChild.firstChild;
      fireEvent.mouseLeave(hoverWrapper);
      expect(getByTestId('controls').dataset.tooltipHovered).toBe('false');
    });
  });

  describe('disableMapScales', () => {
    it('sets opacity to 0 on imperial and metric scale elements on hover', () => {
      const imperial = document.createElement('div');
      imperial.className = 'wv-map-scale-imperial';
      imperial.style.opacity = '1';
      const metric = document.createElement('div');
      metric.className = 'wv-map-scale-metric';
      metric.style.opacity = '1';
      document.body.appendChild(imperial);
      document.body.appendChild(metric);

      const { container } = renderComponent({ isDraggerDragging: false });
      fireEvent.mouseEnter(container.firstChild.firstChild);

      expect(imperial.style.opacity).toBe('0');
      expect(metric.style.opacity).toBe('0');

      document.body.removeChild(imperial);
      document.body.removeChild(metric);
    });

    it('restores opacity to 1 on mouse leave', () => {
      const imperial = document.createElement('div');
      imperial.className = 'wv-map-scale-imperial';
      const metric = document.createElement('div');
      metric.className = 'wv-map-scale-metric';
      document.body.appendChild(imperial);
      document.body.appendChild(metric);

      const { container } = renderComponent({ isDraggerDragging: false });
      const hoverWrapper = container.firstChild.firstChild;
      fireEvent.mouseEnter(hoverWrapper);
      fireEvent.mouseLeave(hoverWrapper);

      expect(imperial.style.opacity).toBe('1');
      expect(metric.style.opacity).toBe('1');

      document.body.removeChild(imperial);
      document.body.removeChild(metric);
    });
  });

  describe('incrementTimeScale', () => {
    it('calls changeTimeScale with timeScaleNumber+1 when below max (no subdaily)', () => {
      const changeTimeScale = jest.fn();
      // day=3, max=3 without subdaily — use month(2) so it can increment
      const { getByTestId } = renderComponent({ timeScale: 'month', hasSubdailyLayers: false, changeTimeScale });
      fireEvent.click(getByTestId('increment-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(3);
    });

    it('does not call changeTimeScale when already at max without subdaily (day=3)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'day', hasSubdailyLayers: false, changeTimeScale });
      fireEvent.click(getByTestId('increment-btn'));
      expect(changeTimeScale).not.toHaveBeenCalled();
    });

    it('calls changeTimeScale when below subdaily max (hour=4 → minute=5)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'hour', hasSubdailyLayers: true, changeTimeScale });
      fireEvent.click(getByTestId('increment-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(5);
    });

    it('does not call changeTimeScale at subdaily max (minute=5)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'minute', hasSubdailyLayers: true, changeTimeScale });
      fireEvent.click(getByTestId('increment-btn'));
      expect(changeTimeScale).not.toHaveBeenCalled();
    });

    it('increments day(3) to hour(4) when hasSubdailyLayers is true', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'day', hasSubdailyLayers: true, changeTimeScale });
      fireEvent.click(getByTestId('increment-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(4);
    });
  });

  describe('decrementTimeScale', () => {
    it('calls changeTimeScale with timeScaleNumber-1 when above min (day=3 → month=2)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'day', changeTimeScale });
      fireEvent.click(getByTestId('decrement-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(2);
    });

    it('does not call changeTimeScale when already at min (year=1)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'year', changeTimeScale });
      fireEvent.click(getByTestId('decrement-btn'));
      expect(changeTimeScale).not.toHaveBeenCalled();
    });

    it('decrements month(2) to year(1)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'month', changeTimeScale });
      fireEvent.click(getByTestId('decrement-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(1);
    });

    it('decrements minute(5) to hour(4)', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderComponent({ timeScale: 'minute', hasSubdailyLayers: true, changeTimeScale });
      fireEvent.click(getByTestId('decrement-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith(4);
    });
  });
});
