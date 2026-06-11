/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./axis-timescale-change-tooltip', () => function MockTooltip({
  timeScale, toolTipHovered, changeTimeScale, hasSubdailyLayers,
}) {
  return (
    <div
      data-testid="tooltip"
      data-timescale={timeScale}
      data-tooltip-hovered={String(toolTipHovered)}
      data-has-subdaily={String(hasSubdailyLayers)}
    >
      <button type="button" data-testid="change-timescale-btn" onClick={() => changeTimeScale('day')}>
        change
      </button>
    </div>
  );
});

jest.mock('../../util/arrow', () => function MockArrow({ direction, onClick, type }) {
  return (
    <button
      type="button"
      data-testid={`arrow-${direction}`}
      data-type={type}
      onClick={onClick}
    >
      {direction}
    </button>
  );
});

import AxisTimeScaleChangeControls from './axis-timescale-change-controls';

const defaultProps = {
  timeScale: 'day',
  toolTipHovered: false,
  changeTimeScale: jest.fn(),
  hasSubdailyLayers: false,
  decrementTimeScale: jest.fn(),
  incrementTimeScale: jest.fn(),
};

const renderControls = (props = {}) => render(
  <AxisTimeScaleChangeControls {...defaultProps} {...props} />,
);

describe('AxisTimeScaleChangeControls', () => {
  beforeEach(() => {
    defaultProps.changeTimeScale.mockClear();
    defaultProps.decrementTimeScale.mockClear();
    defaultProps.incrementTimeScale.mockClear();
  });

  describe('rendering', () => {
    it('renders the outer container with correct class', () => {
      const { container } = renderControls();
      expect(container.firstChild).toHaveClass('zoom-level-change-arrows');
    });

    it('renders the tooltip child', () => {
      const { getByTestId } = renderControls();
      expect(getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders an up arrow', () => {
      const { getByTestId } = renderControls();
      expect(getByTestId('arrow-up')).toBeInTheDocument();
    });

    it('renders a down arrow', () => {
      const { getByTestId } = renderControls();
      expect(getByTestId('arrow-down')).toBeInTheDocument();
    });

    it('up arrow has zoom-level-up type', () => {
      const { getByTestId } = renderControls();
      expect(getByTestId('arrow-up').dataset.type).toBe('zoom-level-up');
    });

    it('down arrow has zoom-level-down type', () => {
      const { getByTestId } = renderControls();
      expect(getByTestId('arrow-down').dataset.type).toBe('zoom-level-down');
    });
  });

  describe('prop forwarding to tooltip', () => {
    it('passes timeScale to tooltip', () => {
      const { getByTestId } = renderControls({ timeScale: 'month' });
      expect(getByTestId('tooltip').dataset.timescale).toBe('month');
    });

    it('passes toolTipHovered=true to tooltip', () => {
      const { getByTestId } = renderControls({ toolTipHovered: true });
      expect(getByTestId('tooltip').dataset.tooltipHovered).toBe('true');
    });

    it('passes toolTipHovered=false to tooltip', () => {
      const { getByTestId } = renderControls({ toolTipHovered: false });
      expect(getByTestId('tooltip').dataset.tooltipHovered).toBe('false');
    });

    it('passes hasSubdailyLayers=true to tooltip', () => {
      const { getByTestId } = renderControls({ hasSubdailyLayers: true });
      expect(getByTestId('tooltip').dataset.hasSubdaily).toBe('true');
    });

    it('passes hasSubdailyLayers=false to tooltip', () => {
      const { getByTestId } = renderControls({ hasSubdailyLayers: false });
      expect(getByTestId('tooltip').dataset.hasSubdaily).toBe('false');
    });

    it('passes changeTimeScale through to tooltip and it is callable', () => {
      const changeTimeScale = jest.fn();
      const { getByTestId } = renderControls({ changeTimeScale });
      fireEvent.click(getByTestId('change-timescale-btn'));
      expect(changeTimeScale).toHaveBeenCalledWith('day');
    });
  });

  describe('onClickUp', () => {
    it('calls decrementTimeScale when up arrow is clicked', () => {
      const decrementTimeScale = jest.fn();
      const { getByTestId } = renderControls({ decrementTimeScale });
      fireEvent.click(getByTestId('arrow-up'));
      expect(decrementTimeScale).toHaveBeenCalledTimes(1);
    });

    it('does not call incrementTimeScale when up arrow is clicked', () => {
      const incrementTimeScale = jest.fn();
      const { getByTestId } = renderControls({ incrementTimeScale });
      fireEvent.click(getByTestId('arrow-up'));
      expect(incrementTimeScale).not.toHaveBeenCalled();
    });
  });

  describe('onClickDown', () => {
    it('calls incrementTimeScale when down arrow is clicked', () => {
      const incrementTimeScale = jest.fn();
      const { getByTestId } = renderControls({ incrementTimeScale });
      fireEvent.click(getByTestId('arrow-down'));
      expect(incrementTimeScale).toHaveBeenCalledTimes(1);
    });

    it('does not call decrementTimeScale when down arrow is clicked', () => {
      const decrementTimeScale = jest.fn();
      const { getByTestId } = renderControls({ decrementTimeScale });
      fireEvent.click(getByTestId('arrow-down'));
      expect(decrementTimeScale).not.toHaveBeenCalled();
    });
  });
});
