/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./coverage-line', () => function MockCoverageLine({
  lineType, id, startDate, endDate, color, options, axisWidth,
  positionTransformX, layerPeriod, index,
}) {
  return (
    <div
      data-testid={`coverage-line-${index}`}
      data-line-type={lineType}
      data-id={id}
      data-start={startDate}
      data-end={String(endDate)}
      data-color={color}
      data-axis-width={String(axisWidth)}
      data-position-transform={String(positionTransformX)}
      data-layer-period={layerPeriod}
      data-options-count={String(options.length)}
    />
  );
});

import CoverageItemContainer from './coverage-item-container';

const defaultLayer = {
  id: 'layer-abc',
  startDate: '2020-01-01',
  endDate: '2020-12-31',
  visible: true,
  dateRanges: [],
};

const defaultProps = {
  axisWidth: 800,
  backDate: '2020-12-31',
  frontDate: '2020-01-01',
  layer: defaultLayer,
  layerPeriod: 'day',
  positionTransformX: 50,
  needDateRangeBuilt: false,
  getLayerItemStyles: jest.fn(() => ({ lineBackgroundColor: '#ff0000' })),
  getMatchingCoverageLineDimensions: jest.fn(() => [{ visible: true }]),
  getMaxEndDate: jest.fn(() => new Date('2020-12-31')),
  getDatesInDateRange: jest.fn(() => []),
  getRangeDateEndWithAddedInterval: jest.fn(() => new Date('2020-02-01')),
};

const renderComponent = (props = {}) => render(
  <CoverageItemContainer {...defaultProps} {...props} />,
);

describe('CoverageItemContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.getLayerItemStyles.mockReturnValue({ lineBackgroundColor: '#ff0000' });
    defaultProps.getMatchingCoverageLineDimensions.mockReturnValue([{ visible: true }]);
    defaultProps.getMaxEndDate.mockReturnValue(new Date('2020-12-31'));
    defaultProps.getDatesInDateRange.mockReturnValue([]);
    defaultProps.getRangeDateEndWithAddedInterval.mockReturnValue(new Date('2020-02-01'));
  });

  describe('rendering — single line (needDateRangeBuilt=false)', () => {
    it('renders outer div with layer-coverage-line class', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass('layer-coverage-line');
    });

    it('applies axisWidth to container style', () => {
      const { container } = renderComponent({ axisWidth: 600 });
      expect(container.firstChild.style.width).toBe('600px');
    });

    it('renders svg with layer-coverage-line-svg class', () => {
      const { container } = renderComponent();
      expect(container.querySelector('svg')).toHaveClass('layer-coverage-line-svg');
    });

    it('sets svg width from axisWidth', () => {
      const { container } = renderComponent({ axisWidth: 700 });
      expect(container.querySelector('svg').getAttribute('width')).toBe('700px');
    });

    it('renders a single CoverageLine with lineType SINGLE', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('coverage-line-layer-abc-0').dataset.lineType).toBe('SINGLE');
    });

    it('passes layer startDate and endDate to single CoverageLine', () => {
      const layer = { ...defaultLayer, startDate: '2019-01-01', endDate: '2021-12-31' };
      const { getByTestId } = renderComponent({ layer });
      const el = getByTestId('coverage-line-layer-abc-0');
      expect(el.dataset.start).toBe('2019-01-01');
      expect(el.dataset.end).toBe('2021-12-31');
    });

    it('passes lineBackgroundColor from getLayerItemStyles as color', () => {
      defaultProps.getLayerItemStyles.mockReturnValue({ lineBackgroundColor: '#00ff00' });
      const { getByTestId } = renderComponent();
      expect(getByTestId('coverage-line-layer-abc-0').dataset.color).toBe('#00ff00');
    });

    it('passes axisWidth to single CoverageLine', () => {
      const { getByTestId } = renderComponent({ axisWidth: 400 });
      expect(getByTestId('coverage-line-layer-abc-0').dataset.axisWidth).toBe('400');
    });

    it('passes positionTransformX to single CoverageLine', () => {
      const { getByTestId } = renderComponent({ positionTransformX: 123 });
      expect(getByTestId('coverage-line-layer-abc-0').dataset.positionTransform).toBe('123');
    });

    it('passes layerPeriod to single CoverageLine', () => {
      const { getByTestId } = renderComponent({ layerPeriod: 'month' });
      expect(getByTestId('coverage-line-layer-abc-0').dataset.layerPeriod).toBe('month');
    });

    it('calls getLayerItemStyles with layer visible and id', () => {
      const getLayerItemStyles = jest.fn(() => ({ lineBackgroundColor: '#abc' }));
      renderComponent({ getLayerItemStyles });
      expect(getLayerItemStyles).toHaveBeenCalledWith(true, 'layer-abc');
    });

    it('calls getMatchingCoverageLineDimensions with layer for single mode', () => {
      const getMatchingCoverageLineDimensions = jest.fn(() => [{ visible: true }]);
      renderComponent({ getMatchingCoverageLineDimensions });
      expect(getMatchingCoverageLineDimensions).toHaveBeenCalledWith(defaultLayer);
    });

    it('filters out invisible dimensions for single line', () => {
      defaultProps.getMatchingCoverageLineDimensions.mockReturnValue([
        { visible: true },
        { visible: false },
        { visible: true },
      ]);
      const { getByTestId } = renderComponent();
      expect(getByTestId('coverage-line-layer-abc-0').dataset.optionsCount).toBe('2');
    });
  });

  describe('componentDidMount — needDateRangeBuilt=false', () => {
    it('does not call getDatesInDateRange when needDateRangeBuilt is false', () => {
      const getDatesInDateRange = jest.fn();
      renderComponent({ needDateRangeBuilt: false, getDatesInDateRange });
      expect(getDatesInDateRange).not.toHaveBeenCalled();
    });

    it('does not call getMaxEndDate when needDateRangeBuilt is false', () => {
      const getMaxEndDate = jest.fn();
      renderComponent({ needDateRangeBuilt: false, getMaxEndDate });
      expect(getMaxEndDate).not.toHaveBeenCalled();
    });
  });

  describe('componentDidMount — needDateRangeBuilt=true', () => {
    const dateInRange = new Date('2020-06-15');
    const singleRange = [{
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      dateInterval: '1',
    }];

    it('calls getDatesInDateRange on mount', () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      renderComponent({ needDateRangeBuilt: true, layer, getDatesInDateRange });
      expect(getDatesInDateRange).toHaveBeenCalledTimes(1);
    });

    it('calls getMaxEndDate with layer and isLastInRange=true for single range', () => {
      const getMaxEndDate = jest.fn(() => new Date('2020-12-31'));
      const layer = { ...defaultLayer, dateRanges: singleRange };
      renderComponent({ needDateRangeBuilt: true, layer, getMaxEndDate });
      expect(getMaxEndDate).toHaveBeenCalledWith(layer, true);
    });

    it('renders MULTI CoverageLines for dates within range', async () => {
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { getByTestId } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange,
      });
      await waitFor(() => {
        expect(getByTestId('coverage-line-layer-abc-0').dataset.lineType).toBe('MULTI');
      });
    });

    it('renders no MULTI CoverageLines when all dates fall outside range', () => {
      const outOfRange = new Date('2019-01-01');
      const getDatesInDateRange = jest.fn(() => [outOfRange]);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { container } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange,
      });
      expect(container.querySelectorAll('[data-line-type="MULTI"]')).toHaveLength(0);
    });

    it('renders no CoverageLines when dateRanges is empty', () => {
      const layer = { ...defaultLayer, dateRanges: [] };
      const { container } = renderComponent({ needDateRangeBuilt: true, layer });
      expect(container.querySelectorAll('[data-line-type="MULTI"]')).toHaveLength(0);
    });

    it('passes isLastInRange=false for non-last and true for last in multi-range', () => {
      const twoRanges = [
        { startDate: '2019-01-01', endDate: '2019-12-31', dateInterval: '1' },
        { startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' },
      ];
      const getMaxEndDate = jest.fn(() => new Date('2020-12-31'));
      const layer = { ...defaultLayer, dateRanges: twoRanges };
      renderComponent({ needDateRangeBuilt: true, layer, getMaxEndDate });
      expect(getMaxEndDate).toHaveBeenCalledWith(layer, false);
      expect(getMaxEndDate).toHaveBeenCalledWith(layer, true);
    });

    it('passes MULTI start date from itemRange.date', async () => {
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { getByTestId } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange,
      });
      await waitFor(() => {
        expect(getByTestId('coverage-line-layer-abc-0').dataset.start).toBe(dateInRange.toISOString());
      });
    });

    it('calls getRangeDateEndWithAddedInterval for each range item', async () => {
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const getRangeDateEndWithAddedInterval = jest.fn(() => new Date('2020-07-01'));
      const layer = { ...defaultLayer, dateRanges: singleRange };
      renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange, getRangeDateEndWithAddedInterval,
      });
      await waitFor(() => {
        expect(getRangeDateEndWithAddedInterval).toHaveBeenCalledTimes(1);
        expect(getRangeDateEndWithAddedInterval).toHaveBeenCalledWith(
          layer,
          new Date(dateInRange.toISOString()),
          'day',
          1,
          undefined,
        );
      });
    });

    it('uses dateInterval as numeric interval in getRangeDateEndWithAddedInterval', async () => {
      const rangeWith5Interval = [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '5' }];
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const getRangeDateEndWithAddedInterval = jest.fn(() => new Date('2020-06-20'));
      const layer = { ...defaultLayer, dateRanges: rangeWith5Interval };
      renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange, getRangeDateEndWithAddedInterval,
      });
      await waitFor(() => {
        expect(getRangeDateEndWithAddedInterval).toHaveBeenCalledWith(
          layer,
          expect.any(Date),
          'day',
          5,
          undefined,
        );
      });
    });

    it('calls getMatchingCoverageLineDimensions per MULTI range item', async () => {
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const getMatchingCoverageLineDimensions = jest.fn(() => [{ visible: true }]);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      renderComponent({
        needDateRangeBuilt: true,
        layer,
        getDatesInDateRange,
        getMatchingCoverageLineDimensions,
      });
      // once for the single MULTI item
      await waitFor(() => {
        expect(getMatchingCoverageLineDimensions).toHaveBeenCalledWith(
          layer,
          expect.any(Date),
          expect.any(Date),
        );
      });
    });

    it('filters invisible dimensions for MULTI range items', async () => {
      const getDatesInDateRange = jest.fn(() => [dateInRange]);
      const getMatchingCoverageLineDimensions = jest.fn(() => [
        { visible: true },
        { visible: false },
      ]);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { getByTestId } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange, getMatchingCoverageLineDimensions,
      });
      await waitFor(() => {
        expect(getByTestId('coverage-line-layer-abc-0').dataset.optionsCount).toBe('1');
      });
    });

    it('deduplicates dates from overlapping ranges via object key overwrite', async () => {
      const duplicateDate = new Date('2020-06-15');
      const twoRanges = [
        { startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' },
        { startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '2' },
      ];
      // both ranges return the same date → key overwritten → only 1 entry
      const getDatesInDateRange = jest.fn(() => [duplicateDate]);
      const layer = { ...defaultLayer, dateRanges: twoRanges };
      const { container } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange,
      });
      await waitFor(() => {
        expect(container.querySelectorAll('[data-line-type="MULTI"]')).toHaveLength(1);
      });
    });
  });

  describe('componentDidUpdate', () => {
    const dateInRange = new Date('2020-06-15');
    const singleRange = [{
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      dateInterval: '1',
    }];

    it('rebuilds date ranges when frontDate changes', () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { rerender } = renderComponent({
        needDateRangeBuilt: true,
        layer,
        getDatesInDateRange,
      });
      const callsBefore = getDatesInDateRange.mock.calls.length;

      rerender(
        <CoverageItemContainer
          {...defaultProps}
          needDateRangeBuilt
          layer={layer}
          getDatesInDateRange={getDatesInDateRange}
          frontDate="2020-03-01"
        />,
      );
      expect(getDatesInDateRange.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('rebuilds date ranges when backDate changes', () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { rerender } = renderComponent({
        needDateRangeBuilt: true,
        layer,
        getDatesInDateRange,
      });
      const callsBefore = getDatesInDateRange.mock.calls.length;

      rerender(
        <CoverageItemContainer
          {...defaultProps}
          needDateRangeBuilt
          layer={layer}
          getDatesInDateRange={getDatesInDateRange}
          backDate="2020-09-01"
        />,
      );
      expect(getDatesInDateRange.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('does not rebuild when neither frontDate nor backDate changes', () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { rerender } = renderComponent({
        needDateRangeBuilt: true,
        layer,
        getDatesInDateRange,
      });
      const callsBefore = getDatesInDateRange.mock.calls.length;

      rerender(
        <CoverageItemContainer
          {...defaultProps}
          needDateRangeBuilt
          layer={layer}
          getDatesInDateRange={getDatesInDateRange}
          layerPeriod="month"
        />,
      );
      expect(getDatesInDateRange.mock.calls.length).toBe(callsBefore);
    });

    it('does not rebuild when date changes but needDateRangeBuilt is false', () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { rerender } = renderComponent({
        needDateRangeBuilt: false,
        layer,
        getDatesInDateRange,
      });

      rerender(
        <CoverageItemContainer
          {...defaultProps}
          needDateRangeBuilt={false}
          layer={layer}
          getDatesInDateRange={getDatesInDateRange}
          frontDate="2020-03-01"
        />,
      );
      expect(getDatesInDateRange).not.toHaveBeenCalled();
    });

    it('reflects updated layerDateRanges in render after frontDate change', async () => {
      const getDatesInDateRange = jest.fn(() => []);
      const layer = { ...defaultLayer, dateRanges: singleRange };
      const { rerender, container } = renderComponent({
        needDateRangeBuilt: true, layer, getDatesInDateRange,
      });
      expect(container.querySelectorAll('[data-line-type="MULTI"]')).toHaveLength(0);

      getDatesInDateRange.mockReturnValue([dateInRange]);
      rerender(
        <CoverageItemContainer
          {...defaultProps}
          needDateRangeBuilt
          layer={layer}
          getDatesInDateRange={getDatesInDateRange}
          frontDate="2020-03-01"
        />,
      );
      await waitFor(() => {
        expect(container.querySelectorAll('[data-line-type="MULTI"]')).toHaveLength(1);
      });
    });
  });
});
