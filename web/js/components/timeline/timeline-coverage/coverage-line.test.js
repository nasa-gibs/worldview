/* eslint-disable react/jsx-props-no-spreading */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoverageLine from './coverage-line';

jest.mock('../../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => `MOCK_${date.toISOString().split('T')[0]}`),
}));

const defaultOption = {
  leftOffset: 0,
  isWidthGreaterThanRendered: false,
  width: 100,
  layerStartBeforeAxisFront: false,
  layerEndBeforeAxisBack: false,
};

const defaultProps = {
  id: 'test-layer',
  options: [{ ...defaultOption }],
  lineType: 'SINGLE',
  startDate: '2020-01-01T00:00:00.000Z',
  endDate: '2020-12-31T00:00:00.000Z',
  color: 'rgb(0, 69, 123)',
  layerPeriod: 'days',
  index: '0',
  positionTransformX: 50,
};

const renderComponent = (props = {}) => render(
  <svg>
    <CoverageLine {...defaultProps} {...props} />
  </svg>,
);

const getRect = (container) => container.querySelector('.layer-coverage-line');

describe('CoverageLine', () => {
  describe('getFormattedDisplayDates — SINGLE lineType', () => {
    it('formats both dates and builds toolTipText', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'SINGLE', '2020-01-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z', 'days',
      );
      expect(result.dateRangeStart).toBe('MOCK_2020-01-01');
      expect(result.dateRangeEnd).toBe('MOCK_2020-12-31');
      expect(result.toolTipText).toBe('MOCK_2020-01-01 to MOCK_2020-12-31');
    });

    it('uses "Start" when startDate is null', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'SINGLE', null, '2020-12-31T00:00:00.000Z', 'days',
      );
      expect(result.dateRangeStart).toBe('Start');
      expect(result.toolTipText).toBe('Start to MOCK_2020-12-31');
    });

    it('uses "Present" when endDate is null', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'SINGLE', '2020-01-01T00:00:00.000Z', null, 'days',
      );
      expect(result.dateRangeEnd).toBe('Present');
      expect(result.toolTipText).toBe('MOCK_2020-01-01 to Present');
    });

    it('uses "Start" and "Present" when both dates are null', () => {
      const result = CoverageLine.getFormattedDisplayDates('SINGLE', null, null, 'days');
      expect(result.dateRangeStart).toBe('Start');
      expect(result.dateRangeEnd).toBe('Present');
      expect(result.toolTipText).toBe('Start to Present');
    });
  });

  describe('getFormattedDisplayDates — MULTI lineType / minutes period', () => {
    it('extracts time portion and builds hh:mm toolTipText', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'MULTI', '2020-01-01T14:50:00.000Z', '2020-01-01T15:00:00.000Z', 'minutes',
      );
      expect(result.toolTipText).toBe('14:50 to 15:00');
    });

    it('replaces colons and dots in dateRangeStart with underscores', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'MULTI', '2020-01-01T14:50:00.000Z', '2020-01-01T15:00:00.000Z', 'minutes',
      );
      expect(result.dateRangeStart).toBe('14_50_00_000Z');
    });

    it('replaces colons and dots in dateRangeEnd with underscores', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'MULTI', '2020-01-01T14:50:00.000Z', '2020-01-01T15:00:00.000Z', 'minutes',
      );
      expect(result.dateRangeEnd).toBe('15_00_00_000Z');
    });
  });

  describe('getFormattedDisplayDates — MULTI lineType / non-minutes period', () => {
    it('formats full dates for days period', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'MULTI', '2020-01-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z', 'days',
      );
      expect(result.dateRangeStart).toBe('MOCK_2020-01-01');
      expect(result.dateRangeEnd).toBe('MOCK_2020-12-31');
      expect(result.toolTipText).toBe('MOCK_2020-01-01 to MOCK_2020-12-31');
    });

    it('formats full dates for months period', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'MULTI', '2020-01-01T00:00:00.000Z', '2020-06-01T00:00:00.000Z', 'months',
      );
      expect(result.toolTipText).toBe('MOCK_2020-01-01 to MOCK_2020-06-01');
    });
  });

  describe('getFormattedDisplayDates — unknown lineType', () => {
    it('returns undefined values for unrecognised lineType', () => {
      const result = CoverageLine.getFormattedDisplayDates(
        'UNKNOWN', '2020-01-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z', 'days',
      );
      expect(result.dateRangeStart).toBeUndefined();
      expect(result.dateRangeEnd).toBeUndefined();
      expect(result.toolTipText).toBeUndefined();
    });
  });

  describe('rendering', () => {
    it('renders a <g> with clipPath per option', () => {
      const { container } = renderComponent();
      const groups = container.querySelectorAll('g[clip-path="url(#coverageLineBoundary)"]');
      expect(groups).toHaveLength(1);
    });

    it('renders multiple <g> elements for multiple options', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption }, { ...defaultOption, leftOffset: 10 }],
      });
      const groups = container.querySelectorAll('g[clip-path="url(#coverageLineBoundary)"]');
      expect(groups).toHaveLength(2);
    });

    it('renders a <rect> with class layer-coverage-line', () => {
      const { container } = renderComponent();
      expect(getRect(container)).toBeInTheDocument();
    });

    it('rect has a <title> containing the toolTipText', () => {
      const { container } = renderComponent();
      const title = getRect(container).querySelector('title');
      expect(title.textContent).toBe('MOCK_2020-01-01 to MOCK_2020-12-31');
    });

    it('rect id encodes layer id, dateRangeStart and dateRangeEnd', () => {
      const { container } = renderComponent();
      const rect = getRect(container);
      expect(rect.id).toContain('test-layer');
      expect(rect.id).toContain('MOCK_2020-01-01');
      expect(rect.id).toContain('MOCK_2020-12-31');
    });

    it('rect id for minutes MULTI uses underscore-encoded time strings', () => {
      const { container } = renderComponent({
        lineType: 'MULTI',
        layerPeriod: 'minutes',
        startDate: '2020-01-01T14:50:00.000Z',
        endDate: '2020-01-01T15:00:00.000Z',
      });
      const rect = getRect(container);
      expect(rect.id).toContain('14_50_00_000Z');
      expect(rect.id).toContain('15_00_00_000Z');
    });

    it('renders nothing when options array is empty', () => {
      const { container } = renderComponent({ options: [] });
      expect(container.querySelector('.layer-coverage-line')).not.toBeInTheDocument();
    });
  });

  describe('patternType — rect fill', () => {
    it('uses coverage-line-pattern for blue color', () => {
      const { container } = renderComponent({ color: 'rgb(0, 69, 123)' });
      expect(getRect(container).getAttribute('fill')).toBe('url(#coverage-line-pattern)');
    });

    it('uses coverage-line-pattern-hidden for non-blue color', () => {
      const { container } = renderComponent({ color: 'rgb(116, 116, 116)' });
      expect(getRect(container).getAttribute('fill')).toBe('url(#coverage-line-pattern-hidden)');
    });
  });

  describe('lineWidth — Math.max(width, 0)', () => {
    it('uses positive width as-is', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, width: 80 }],
      });
      expect(getRect(container).getAttribute('width')).toBe('80px');
    });

    it('clamps negative width to 0', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, width: -10 }],
      });
      expect(getRect(container).getAttribute('width')).toBe('0px');
    });

    it('uses 0 for zero width', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, width: 0 }],
      });
      expect(getRect(container).getAttribute('width')).toBe('0px');
    });
  });

  describe('rectTransform', () => {
    it('uses positionTransformX when leftOffset=0, isWidthGreaterThanRendered=true, layerEndBeforeAxisBack=false', () => {
      const { container } = renderComponent({
        positionTransformX: 50,
        options: [{
          ...defaultOption,
          leftOffset: 0,
          isWidthGreaterThanRendered: true,
          layerEndBeforeAxisBack: false,
        }],
      });
      expect(getRect(container).getAttribute('transform')).toBe('translate(50)');
    });

    it('uses leftOffset when leftOffset is non-zero', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, leftOffset: 30 }],
      });
      expect(getRect(container).getAttribute('transform')).toBe('translate(30)');
    });

    it('uses leftOffset when isWidthGreaterThanRendered is false', () => {
      const { container } = renderComponent({
        positionTransformX: 50,
        options: [{ ...defaultOption, leftOffset: 0, isWidthGreaterThanRendered: false }],
      });
      expect(getRect(container).getAttribute('transform')).toBe('translate(0)');
    });
  });

  describe('lineRadius — rect rx attribute', () => {
    it('is "6" when isWidthGreaterThanRendered is false', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, isWidthGreaterThanRendered: false }],
      });
      expect(getRect(container).getAttribute('rx')).toBe('6');
    });

    it('is "6" when isWidthGreaterThanRendered=true and leftOffset is non-zero', () => {
      const { container } = renderComponent({
        options: [{ ...defaultOption, isWidthGreaterThanRendered: true, leftOffset: 5 }],
      });
      expect(getRect(container).getAttribute('rx')).toBe('6');
    });

    it('is "0" when isWidthGreaterThanRendered=true, leftOffset=0, no false-transform', () => {
      const { container } = renderComponent({
        options: [{
          ...defaultOption,
          leftOffset: 0,
          isWidthGreaterThanRendered: true,
          layerEndBeforeAxisBack: false,
          layerStartBeforeAxisFront: false,
        }],
      });
      expect(getRect(container).getAttribute('rx')).toBe('0');
    });
  });

  describe('false transform branch', () => {
    it('fires when isWidthGreaterThanRendered=true and layerEndBeforeAxisBack=true: adjusts width, transform, rx=6', () => {
      const { container } = renderComponent({
        positionTransformX: 50,
        options: [{
          ...defaultOption,
          leftOffset: 0,
          isWidthGreaterThanRendered: true,
          layerEndBeforeAxisBack: true,
          width: 100,
        }],
      });
      const rect = getRect(container);
      expect(rect.getAttribute('width')).toBe('50px');           // 100 - 50
      expect(rect.getAttribute('transform')).toBe('translate(50)'); // 0 + 50
      expect(rect.getAttribute('rx')).toBe('6');
    });

    it('fires when isWidthGreaterThanRendered=false and layerStartBeforeAxisFront=true: adjusts width, transform, rx=6', () => {
      const { container } = renderComponent({
        positionTransformX: 50,
        options: [{
          ...defaultOption,
          leftOffset: 0,
          isWidthGreaterThanRendered: false,
          layerStartBeforeAxisFront: true,
          width: 100,
        }],
      });
      const rect = getRect(container);
      expect(rect.getAttribute('width')).toBe('50px');
      expect(rect.getAttribute('transform')).toBe('translate(50)');
      expect(rect.getAttribute('rx')).toBe('6');
    });

    it('does not fire when leftOffset is non-zero', () => {
      const { container } = renderComponent({
        positionTransformX: 50,
        options: [{
          ...defaultOption,
          leftOffset: 10,
          isWidthGreaterThanRendered: true,
          layerEndBeforeAxisBack: true,
          width: 100,
        }],
      });
      const rect = getRect(container);
      expect(rect.getAttribute('width')).toBe('100px');
      expect(rect.getAttribute('transform')).toBe('translate(10)');
    });
  });
});
