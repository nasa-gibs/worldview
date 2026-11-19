/* eslint-disable react/jsx-props-no-spreading */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import AxisTimeScaleChangeTooltip from './axis-timescale-change-tooltip';

const defaultProps = {
  timeScale: 'day',
  toolTipHovered: false,
  changeTimeScale: jest.fn(),
  hasSubdailyLayers: false,
};

const renderTooltip = (props = {}) => render(
  <AxisTimeScaleChangeTooltip {...defaultProps} {...props} />,
);

describe('AxisTimeScaleChangeTooltip', () => {
  beforeEach(() => {
    defaultProps.changeTimeScale.mockClear();
  });

  describe('rendering', () => {
    it('renders the outer container with id zoom-btn-container-axis', () => {
      const { container } = renderTooltip();
      expect(container.querySelector('#zoom-btn-container-axis')).toBeInTheDocument();
    });

    it('renders the current zoom span with the timeScale text', () => {
      const { getByText } = renderTooltip({ timeScale: 'Month' });
      expect(getByText('Month')).toBeInTheDocument();
    });

    it('current zoom span has zoom-level-display-text class', () => {
      const { container } = renderTooltip();
      expect(container.querySelector('#current-zoom')).toHaveClass('zoom-level-display-text');
    });

    it('current zoom span includes zoom-{timeScale} class (lowercased)', () => {
      const { container } = renderTooltip({ timeScale: 'Day' });
      expect(container.querySelector('#current-zoom')).toHaveClass('zoom-day');
    });

    it('renders YEAR, MONTH, DAY menu items always', () => {
      const { getByText } = renderTooltip();
      expect(getByText('YEAR')).toBeInTheDocument();
      expect(getByText('MONTH')).toBeInTheDocument();
      expect(getByText('DAY')).toBeInTheDocument();
    });

    it('does not render HOUR or MINUTE when hasSubdailyLayers is false', () => {
      const { queryByText } = renderTooltip({ hasSubdailyLayers: false });
      expect(queryByText('HOUR')).not.toBeInTheDocument();
      expect(queryByText('MINUTE')).not.toBeInTheDocument();
    });

    it('renders HOUR and MINUTE when hasSubdailyLayers is true', () => {
      const { getByText } = renderTooltip({ hasSubdailyLayers: true });
      expect(getByText('HOUR')).toBeInTheDocument();
      expect(getByText('MINUTE')).toBeInTheDocument();
    });
  });

  describe('tooltip visibility', () => {
    it('hides the zoom tooltip when toolTipHovered is false', () => {
      const { container } = renderTooltip({ toolTipHovered: false });
      expect(container.querySelector('.wv-zoom-tooltip').style.display).toBe('none');
    });

    it('shows the zoom tooltip when toolTipHovered is true', () => {
      const { container } = renderTooltip({ toolTipHovered: true });
      expect(container.querySelector('.wv-zoom-tooltip').style.display).toBe('block');
    });
  });

  describe('changeTimeScale calls', () => {
    it('calls changeTimeScale with 1 when YEAR is clicked', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale });
      fireEvent.click(getByText('YEAR'));
      expect(changeTimeScale).toHaveBeenCalledWith(1);
    });

    it('calls changeTimeScale with 2 when MONTH is clicked', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale });
      fireEvent.click(getByText('MONTH'));
      expect(changeTimeScale).toHaveBeenCalledWith(2);
    });

    it('calls changeTimeScale with 3 when DAY is clicked', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale });
      fireEvent.click(getByText('DAY'));
      expect(changeTimeScale).toHaveBeenCalledWith(3);
    });

    it('calls changeTimeScale with 4 when HOUR is clicked', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale, hasSubdailyLayers: true });
      fireEvent.click(getByText('HOUR'));
      expect(changeTimeScale).toHaveBeenCalledWith(4);
    });

    it('calls changeTimeScale with 5 when MINUTE is clicked', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale, hasSubdailyLayers: true });
      fireEvent.click(getByText('MINUTE'));
      expect(changeTimeScale).toHaveBeenCalledWith(5);
    });

    it('calls changeTimeScale exactly once per click', () => {
      const changeTimeScale = jest.fn();
      const { getByText } = renderTooltip({ changeTimeScale });
      fireEvent.click(getByText('YEAR'));
      expect(changeTimeScale).toHaveBeenCalledTimes(1);
    });
  });

  describe('zoom span classes and ids', () => {
    it('YEAR span has id zoom-years and class zoom-years', () => {
      const { container } = renderTooltip();
      const el = container.querySelector('#zoom-years');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('zoom-years');
    });

    it('MONTH span has id zoom-months and class zoom-months', () => {
      const { container } = renderTooltip();
      const el = container.querySelector('#zoom-months');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('zoom-months');
    });

    it('DAY span has id zoom-days and class zoom-days', () => {
      const { container } = renderTooltip();
      const el = container.querySelector('#zoom-days');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('zoom-days');
    });

    it('HOUR span has id zoom-hours and class zoom-hours when subdaily', () => {
      const { container } = renderTooltip({ hasSubdailyLayers: true });
      const el = container.querySelector('#zoom-hours');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('zoom-hours');
    });

    it('MINUTE span has id zoom-minutes and class zoom-minutes when subdaily', () => {
      const { container } = renderTooltip({ hasSubdailyLayers: true });
      const el = container.querySelector('#zoom-minutes');
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('zoom-minutes');
    });
  });
});
