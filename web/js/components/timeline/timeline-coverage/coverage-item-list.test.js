/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <svg data-testid={`icon-${icon}`} />,
}));

jest.mock('../../util/monospace-date', () => function MockMonospaceDate({ date }) {
  return <span data-testid="monospace-date">{date}</span>;
});

jest.mock('../../../modules/date/util', () => ({
  formatDisplayDate: jest.fn((date) => `FMT:${date.toISOString().slice(0, 10)}`),
}));

jest.mock('../../../modules/layers/util', () => ({
  datesInDateRanges: jest.fn(() => []),
}));

jest.mock('../../../util/util', () => ({
  events: { on: jest.fn(), off: jest.fn() },
  getUTCNumbers: jest.fn((date, prefix) => ({
    [`${prefix}Year`]: date.getUTCFullYear(),
    [`${prefix}Month`]: date.getUTCMonth(),
    [`${prefix}Day`]: date.getUTCDate(),
    [`${prefix}Hour`]: date.getUTCHours(),
    [`${prefix}Minute`]: date.getUTCMinutes(),
  })),
  getTimezoneOffsetDate: jest.fn(
    (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000),
  ),
  encodeId: jest.fn((id) => id),
}));

// Capture the last set of props passed to CoverageItemContainer.
// Assignment happens during React render (not at mock-factory time), so
// `let` here is TDZ-safe — the variable is initialized before any render runs.
let capturedContainerProps = null;
jest.mock('./coverage-item-container', () => function MockCIC(props) {
  capturedContainerProps = props;
  return (
    <div
      data-testid="coverage-item-container"
      data-layer-id={props.layer.id}
      data-need-date-range={String(props.needDateRangeBuilt)}
      data-layer-period={props.layerPeriod}
      data-axis-width={String(props.axisWidth)}
      data-position-transform={String(props.positionTransformX)}
    />
  );
});

import util from '../../../util/util';
import { datesInDateRanges } from '../../../modules/layers/util';
import CoverageItemList from './coverage-item-list';

const appNow = new Date('2021-01-01T00:00:00Z');

const defaultLayer = {
  id: 'layer-test',
  title: 'Test Layer',
  subtitle: 'Sub',
  startDate: '2020-01-01',
  endDate: '2020-12-31',
  visible: true,
  ongoing: false,
  period: 'daily',
  dateRanges: [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' }],
};

const defaultProps = {
  activeLayers: [defaultLayer],
  appNow,
  axisWidth: 800,
  backDate: '2020-12-31',
  frontDate: '2020-01-01',
  getMatchingCoverageLineDimensions: jest.fn(() => []),
  positionTransformX: 50,
  timeScale: 'day',
};

const renderComponent = (props = {}) => render(
  <CoverageItemList {...defaultProps} {...props} />,
);

describe('CoverageItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedContainerProps = null;
  });

  // ── Static methods ────────────────────────────────────────────────────────

  describe('getFormattedTimePeriod', () => {
    it('maps "daily" → "day"', () => {
      expect(CoverageItemList.getFormattedTimePeriod('daily')).toBe('day');
    });

    it('maps "monthly" → "monthly"', () => {
      expect(CoverageItemList.getFormattedTimePeriod('monthly')).toBe('monthly');
    });

    it('maps "yearly" → "year"', () => {
      expect(CoverageItemList.getFormattedTimePeriod('yearly')).toBe('year');
    });

    it('maps anything else → "minute"', () => {
      expect(CoverageItemList.getFormattedTimePeriod('subdaily')).toBe('minute');
      expect(CoverageItemList.getFormattedTimePeriod(undefined)).toBe('minute');
    });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders outer container with layer-coverage-layer-list class', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toHaveClass('layer-coverage-layer-list');
    });

    it('renders empty message when activeLayers is empty', () => {
      const { getByTestId } = renderComponent({ activeLayers: [] });
      expect(getByTestId('icon-exclamation-triangle')).toBeInTheDocument();
    });

    it('renders one layer item per active layer', () => {
      const layers = [
        { ...defaultLayer, id: 'layer-1' },
        { ...defaultLayer, id: 'layer-2' },
      ];
      const { getAllByTestId } = renderComponent({ activeLayers: layers });
      expect(getAllByTestId('coverage-item-container')).toHaveLength(2);
    });

    it('returns null (no container) for a layer without dateRanges and startDate', () => {
      const layerWithNothing = { ...defaultLayer, dateRanges: undefined, startDate: undefined };
      const { queryByTestId } = renderComponent({ activeLayers: [layerWithNothing] });
      expect(queryByTestId('coverage-item-container')).not.toBeInTheDocument();
    });

    it('renders a layer that has startDate but no dateRanges', () => {
      const layer = { ...defaultLayer, dateRanges: undefined, startDate: '2020-01-01' };
      const { getByTestId } = renderComponent({ activeLayers: [layer] });
      expect(getByTestId('coverage-item-container')).toBeInTheDocument();
    });

    it('passes axisWidth to CoverageItemContainer', () => {
      const { getByTestId } = renderComponent({ axisWidth: 640 });
      expect(getByTestId('coverage-item-container').dataset.axisWidth).toBe('640');
    });

    it('passes positionTransformX to CoverageItemContainer', () => {
      const { getByTestId } = renderComponent({ positionTransformX: 123 });
      expect(getByTestId('coverage-item-container').dataset.positionTransform).toBe('123');
    });

    it('appends "s" to layerPeriod before passing to CoverageItemContainer', () => {
      // period='daily' → getFormattedTimePeriod → 'day' → 'days'
      const { getByTestId } = renderComponent();
      expect(getByTestId('coverage-item-container').dataset.layerPeriod).toBe('days');
    });

    it('applies visible layer background style', () => {
      const { container } = renderComponent({ activeLayers: [{ ...defaultLayer, visible: true }] });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(204, 204, 204)');
    });

    it('applies invisible layer background style', () => {
      const layer = { ...defaultLayer, visible: false };
      const { container } = renderComponent({ activeLayers: [layer] });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(79, 79, 79)');
    });
  });

  // ── needDateRangeBuilt logic ──────────────────────────────────────────────

  describe('needDateRangeBuilt', () => {
    it('is false when period=daily, timeScale=day, interval=1 (equal zoom, interval not >1)', () => {
      const { getByTestId } = renderComponent({
        timeScale: 'day',
        activeLayers: [{
          ...defaultLayer,
          period: 'daily',
          dateRanges: [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' }],
        }],
      });
      expect(getByTestId('coverage-item-container').dataset.needDateRange).toBe('false');
    });

    it('is true when period=daily, timeScale=day, interval=2 (equal zoom, interval >1)', () => {
      const { getByTestId } = renderComponent({
        timeScale: 'day',
        activeLayers: [{
          ...defaultLayer,
          period: 'daily',
          dateRanges: [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '2' }],
        }],
      });
      expect(getByTestId('coverage-item-container').dataset.needDateRange).toBe('true');
    });

    it('is true when layer period is coarser than zoom level (year < day)', () => {
      const { getByTestId } = renderComponent({
        timeScale: 'day',
        activeLayers: [{
          ...defaultLayer,
          period: 'yearly',
          dateRanges: [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' }],
        }],
      });
      expect(getByTestId('coverage-item-container').dataset.needDateRange).toBe('true');
    });

    it('is false for an id in the ignored-layer list', () => {
      const { getByTestId } = renderComponent({
        activeLayers: [{
          ...defaultLayer,
          id: 'GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI',
          dateRanges: [{ startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '2' }],
        }],
      });
      expect(getByTestId('coverage-item-container').dataset.needDateRange).toBe('false');
    });

    it('is false when dateRanges is falsy', () => {
      const { getByTestId } = renderComponent({
        activeLayers: [{
          ...defaultLayer,
          dateRanges: undefined,
          startDate: '2020-01-01',
        }],
      });
      expect(getByTestId('coverage-item-container').dataset.needDateRange).toBe('false');
    });
  });

  // ── Header DOM element ────────────────────────────────────────────────────

  describe('layer header', () => {
    it('renders layer title', () => {
      const { getByText } = renderComponent({ activeLayers: [{ ...defaultLayer, title: 'My Layer' }] });
      expect(getByText('My Layer')).toBeInTheDocument();
    });

    it('renders layer subtitle', () => {
      const { getByText } = renderComponent({ activeLayers: [{ ...defaultLayer, subtitle: 'v2' }] });
      expect(getByText('v2')).toBeInTheDocument();
    });

    it('shows formatted startDate from formatDisplayDate', () => {
      const { getAllByTestId } = renderComponent();
      const dates = getAllByTestId('monospace-date').map((el) => el.textContent);
      expect(dates.some((d) => d.startsWith('FMT:'))).toBe(true);
    });

    it('shows " Start " placeholder when layer has no startDate', () => {
      const { getAllByTestId } = renderComponent({
        activeLayers: [{ ...defaultLayer, startDate: undefined }],
      });
      expect(getAllByTestId('monospace-date')[0].textContent).toBe(' Start ');
    });

    it('shows " Present " placeholder when layer has no endDate', () => {
      const { getAllByTestId } = renderComponent({
        activeLayers: [{ ...defaultLayer, endDate: undefined }],
      });
      const texts = getAllByTestId('monospace-date').map((el) => el.textContent);
      expect(texts).toContain(' Present ');
    });

    it('date range container width is 205px when any layer is not ongoing', () => {
      // inactiveLayers = some(!ongoing) → at least one layer with ongoing=false
      const { container } = renderComponent({
        activeLayers: [{ ...defaultLayer, ongoing: false }],
      });
      const dateRangeEl = container.querySelector('.layer-coverage-item-date-range');
      expect(dateRangeEl.style.width).toBe('205px');
    });

    it('date range container width is 175px when all ongoing and no endDate', () => {
      const layer = { ...defaultLayer, ongoing: true, endDate: undefined };
      const { container } = renderComponent({ activeLayers: [layer] });
      const dateRangeEl = container.querySelector('.layer-coverage-item-date-range');
      expect(dateRangeEl.style.width).toBe('175px');
    });
  });

  // ── componentDidMount / componentWillUnmount ──────────────────────────────

  describe('lifecycle', () => {
    it('registers SIDEBAR_LAYER_HOVER callback on mount', () => {
      renderComponent();
      expect(util.events.on).toHaveBeenCalledWith('sidebar:layer-hover', expect.any(Function));
    });

    it('unregisters SIDEBAR_LAYER_HOVER callback on unmount', () => {
      const { unmount } = renderComponent();
      unmount();
      expect(util.events.off).toHaveBeenCalledWith('sidebar:layer-hover', expect.any(Function));
    });
  });

  // ── layerHoverCallback ────────────────────────────────────────────────────

  describe('layerHoverCallback', () => {
    const getHoverCallback = () => util.events.on.mock.calls[0][1];

    it('hovering a matching layer id sets lighter background', () => {
      const { container } = renderComponent();
      act(() => { getHoverCallback()('layer-test', true); });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(230, 230, 230)');
    });

    it('hovering a matching layer adds an outline', () => {
      const { container } = renderComponent();
      act(() => { getHoverCallback()('layer-test', true); });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.outline)
        .toBe('1px solid rgb(204, 204, 204)');
    });

    it('deactivating hover (active=false) restores standard background', () => {
      const { container } = renderComponent();
      act(() => { getHoverCallback()('layer-test', true); });
      act(() => { getHoverCallback()('layer-test', false); });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(204, 204, 204)');
    });

    it('hovering a different id does not lighten this layer', () => {
      const { container } = renderComponent();
      act(() => { getHoverCallback()('other-layer', true); });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(204, 204, 204)');
    });

    it('invisible hovered layer uses gray lighter color', () => {
      const { container } = renderComponent({
        activeLayers: [{ ...defaultLayer, visible: false }],
      });
      act(() => { getHoverCallback()('layer-test', true); });
      expect(container.querySelector('.layer-coverage-layer-list-item').style.background)
        .toBe('rgb(101, 101, 101)');
    });
  });

  // ── getLayerItemStyles (via capturedContainerProps) ───────────────────────

  describe('getLayerItemStyles', () => {
    it('visible=true gives blue lineBackgroundColor', () => {
      renderComponent();
      const styles = capturedContainerProps.getLayerItemStyles(true, 'layer-test');
      expect(styles.lineBackgroundColor).toBe('rgb(0, 69, 123)');
    });

    it('visible=false gives gray lineBackgroundColor', () => {
      renderComponent();
      const styles = capturedContainerProps.getLayerItemStyles(false, 'layer-test');
      expect(styles.lineBackgroundColor).toBe('rgb(116, 116, 116)');
    });

    it('non-hovered layer has no outline', () => {
      renderComponent();
      const styles = capturedContainerProps.getLayerItemStyles(true, 'layer-test');
      expect(styles.layerItemOutline).toBe('');
    });
  });

  // ── getMaxEndDate ─────────────────────────────────────────────────────────

  describe('getMaxEndDate', () => {
    const simpleLayer = { endDate: '2020-12-31', futureTime: false, ongoing: false };

    it('returns backDate when backDate <= appNow', () => {
      // backDate='2020-12-31', appNow='2021-01-01' → backDate < appNow → keep backDate
      renderComponent({ backDate: '2020-12-31', appNow: new Date('2021-01-01T00:00:00Z') });
      const result = capturedContainerProps.getMaxEndDate(simpleLayer, false);
      expect(result).toEqual(new Date('2020-12-31'));
    });

    it('caps at appNow when backDate > appNow and no futureTime', () => {
      const testAppNow = new Date('2020-06-01T00:00:00Z');
      renderComponent({ backDate: '2021-01-01', appNow: testAppNow });
      const result = capturedContainerProps.getMaxEndDate(simpleLayer, false);
      expect(result).toEqual(testAppNow);
    });

    it('keeps backDate when futureTime=true even if backDate > appNow', () => {
      renderComponent({ backDate: '2022-01-01', appNow: new Date('2020-06-01T00:00:00Z') });
      const futureLayer = { ...simpleLayer, futureTime: true };
      const result = capturedContainerProps.getMaxEndDate(futureLayer, false);
      expect(result).toEqual(new Date('2022-01-01'));
    });

    it('ongoing + isLastInRange + futureTime + endDateLimit > layerEndDate → caps at layerEndDate', () => {
      // backDate='2022-01-01' > appNow='2020-06-01', futureTime=true → endDateLimit=2022-01-01
      // layerEndDate='2020-12-31' < endDateLimit → cap at layerEndDate
      renderComponent({ backDate: '2022-01-01', appNow: new Date('2020-06-01T00:00:00Z') });
      const layer = { endDate: '2020-12-31', futureTime: true, ongoing: true };
      const result = capturedContainerProps.getMaxEndDate(layer, true);
      expect(result).toEqual(new Date('2020-12-31'));
    });

    it('ongoing + isLastInRange + futureTime + endDateLimit <= layerEndDate → keeps endDateLimit', () => {
      // backDate='2020-06-01', appNow='2021-01-01', futureTime=true → endDateLimit=2020-06-01
      // layerEndDate='2022-01-01' > endDateLimit → keep endDateLimit
      renderComponent({ backDate: '2020-06-01', appNow: new Date('2021-01-01T00:00:00Z') });
      const layer = { endDate: '2022-01-01', futureTime: true, ongoing: true };
      const result = capturedContainerProps.getMaxEndDate(layer, true);
      expect(result).toEqual(new Date('2020-06-01'));
    });

    it('ongoing + isLastInRange + no futureTime + endDateLimit > appNow → caps at appNow', () => {
      const testAppNow = new Date('2020-06-01T00:00:00Z');
      renderComponent({ backDate: '2022-01-01', appNow: testAppNow });
      // backDate '2022-01-01' > appNow '2020-06-01' → endDateLimit = appNow = 2020-06-01
      // ongoing+isLastInRange, no futureTime, endDateLimit (2020-06-01) > appNow (2020-06-01)?
      // They're equal, so else-if is false. First if already capped endDateLimit=appNow.
      // The first if already set endDateLimit=appNow; the else-if won't change it.
      const layer = { endDate: '2020-12-31', futureTime: false, ongoing: true };
      const result = capturedContainerProps.getMaxEndDate(layer, true);
      expect(result).toEqual(testAppNow);
    });

    it('ongoing + isLastInRange + futureTime=true + no endDate → caps at appNow', () => {
      const testAppNow = new Date('2020-06-01T00:00:00Z');
      renderComponent({ backDate: '2022-01-01', appNow: testAppNow });
      // futureTime=true skips the first cap; endDate=undefined makes (futureTime && endDate)
      // false → else-if fires → caps endDateLimit at appNow
      const layer = { endDate: undefined, futureTime: true, ongoing: true };
      const result = capturedContainerProps.getMaxEndDate(layer, true);
      expect(result).toEqual(testAppNow);
    });

    it('isLastInRange=false skips ongoing checks', () => {
      const testAppNow = new Date('2021-01-01T00:00:00Z');
      renderComponent({ backDate: '2020-12-31', appNow: testAppNow });
      const layer = { endDate: '2019-01-01', futureTime: false, ongoing: true };
      const result = capturedContainerProps.getMaxEndDate(layer, false);
      expect(result).toEqual(new Date('2020-12-31'));
    });
  });

  // ── getRangeDateEndWithAddedInterval ──────────────────────────────────────

  describe('getRangeDateEndWithAddedInterval', () => {
    const rangeDate = new Date('2020-01-01T00:00:00Z');

    it('caps rangeDateEnd at appNow when appNow is before computed end (no futureTime)', () => {
      const earlyNow = new Date('2020-01-15T00:00:00Z');
      renderComponent({ appNow: earlyNow });
      // interval=365 days puts rangeDateEnd far into the future, so appNow caps it
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'days',
        365,
        undefined,
      );
      expect(result).toBe(earlyNow.toISOString());
    });

    it('caps at endDate when futureTime=true and endDate is before rangeDateEnd', () => {
      const earlyNow = new Date('2020-01-15T00:00:00Z');
      const endDate = '2020-01-05';
      renderComponent({ appNow: earlyNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate, futureTime: true },
        rangeDate,
        'days',
        365,
        undefined,
      );
      // appNow (2020-01-15) < rangeDateEnd (2020+365days) → enter if
      // futureTime=true → new Date('2020-01-05') > rangeDateEnd? No → use new Date(endDate)
      expect(result).toBe(new Date(endDate).toISOString());
    });

    it('uses nextDate when nextDate is before computed rangeDateEnd', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      const nextDate = { date: '2020-01-03T00:00:00Z' }; // before rangeDate + 365 days
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'days',
        365,
        nextDate,
      );
      // nextDate (2020-01-03) < rangeDateEnd (2021-01-01) → use nextDate
      expect(result).toBe(new Date(nextDate.date).toISOString());
    });

    it('adds years when layerPeriod=years', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      // rangeDate UTC: year=2020, month=0, day=1 + yearAdd=2 → year 2022
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'years',
        2,
        undefined,
      );
      // new Date(2020+2, 0, 1, ...) = Jan 1 2022 local; result contains '2022'
      expect(result).toContain('2022');
    });

    it('does not use nextDate when nextDate is after computed rangeDateEnd', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      // nextDate is far in the future — after the computed +365-day end
      const nextDate = { date: '2022-01-01T00:00:00Z' };
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'days',
        365,
        nextDate,
      );
      // nextDate (2022) > computed end (Dec 2020) → nextDate not used
      // appNow (2025) >= computed end → no appNow cap → result is computed end
      expect(result).not.toBe(new Date(nextDate.date).toISOString());
      expect(result).toContain('2020');
    });

    it('adds months when layerPeriod=months', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'months',
        3,
        undefined,
      );
      expect(result).toContain('2020');
    });

    it('adds hours when layerPeriod=hours', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'hours',
        6,
        undefined,
      );
      expect(result).toContain('2020');
    });

    it('adds minutes when layerPeriod=minutes', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'minutes',
        30,
        undefined,
      );
      expect(result).toContain('2020');
    });

    it('keeps computed rangeDateEnd when appNow is after it (no cap applied)', () => {
      const futureNow = new Date('2025-01-01T00:00:00Z');
      renderComponent({ appNow: futureNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: false },
        rangeDate,
        'days',
        1,
        undefined,
      );
      // appNow (2025) >= rangeDateEnd (2020-01-02) → no cap → contains '2020'
      expect(result).toContain('2020');
    });

    it('futureTime=true: keeps rangeDateEnd when endDate is greater than rangeDateEnd', () => {
      const earlyNow = new Date('2020-01-15T00:00:00Z');
      renderComponent({ appNow: earlyNow });
      const result = capturedContainerProps.getRangeDateEndWithAddedInterval(
        { endDate: '2025-01-01', futureTime: true },
        rangeDate,
        'days',
        365,
        undefined,
      );
      // appNow (2020-01-15) < computed end → futureTime=true
      // endDate (2025) > computed end → keep computed end (not capped to endDate)
      expect(result).not.toContain('2025');
      expect(result).toContain('2020');
    });
  });

  // ── getDatesInDateRange ───────────────────────────────────────────────────

  describe('getDatesInDateRange', () => {
    const validRange = { startDate: '2020-01-01', endDate: '2020-12-31', dateInterval: '1' };
    const endDateLimit = new Date('2021-01-01');

    const makeDef = (overrides = {}) => ({
      id: 'layer-test',
      period: 'daily',
      futureTime: false,
      ongoing: false,
      ...overrides,
    });

    it('calls datesInDateRanges when range overlaps axis window', () => {
      renderComponent();
      capturedContainerProps.getDatesInDateRange(makeDef(), validRange, endDateLimit, false);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });

    it('returns [] when startDate is after endDateLimit', () => {
      renderComponent();
      const futureRange = { ...validRange, startDate: '2022-01-01' };
      const result = capturedContainerProps
        .getDatesInDateRange(makeDef(), futureRange, endDateLimit, false);
      expect(result).toEqual([]);
      expect(datesInDateRanges).not.toHaveBeenCalled();
    });

    it('returns [] when rangeEnd is before startDateLimit', () => {
      renderComponent();
      // rangeEnd = new Date('2019-01-01'), startDateLimit ≈ 2019-12-31
      const pastRange = { startDate: '2020-01-01', endDate: '2019-01-01', dateInterval: '1' };
      const result = capturedContainerProps
        .getDatesInDateRange(makeDef(), pastRange, endDateLimit, false);
      expect(result).toEqual([]);
      expect(datesInDateRanges).not.toHaveBeenCalled();
    });

    it('caches the result and avoids duplicate datesInDateRanges calls', () => {
      renderComponent();
      capturedContainerProps.getDatesInDateRange(makeDef(), validRange, endDateLimit, false);
      capturedContainerProps.getDatesInDateRange(makeDef(), validRange, endDateLimit, false);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });

    it('uses cached result for second call', () => {
      const fakeDate = new Date('2020-06-01');
      datesInDateRanges.mockReturnValueOnce([fakeDate]);
      renderComponent();
      capturedContainerProps.getDatesInDateRange(makeDef(), validRange, endDateLimit, false);
      const second = capturedContainerProps
        .getDatesInDateRange(makeDef(), validRange, endDateLimit, false);
      expect(second).toEqual([fakeDate]);
    });

    it('ongoing + isLastInRange + futureTime → rangeEnd = endDate', () => {
      renderComponent();
      const def = makeDef({ ongoing: true, futureTime: true });
      const range = { startDate: '2020-01-01', endDate: '2020-06-01', dateInterval: '1' };
      capturedContainerProps.getDatesInDateRange(def, range, endDateLimit, true);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });

    it('ongoing + isLastInRange + no futureTime → rangeEnd = appNow', () => {
      renderComponent();
      const def = makeDef({ ongoing: true, futureTime: false });
      capturedContainerProps.getDatesInDateRange(def, validRange, endDateLimit, true);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });

    it('startDate < frontDate → startDateLimit uses frontDate', () => {
      // startDate = 2019-01-01, frontDate = 2020-01-01 → startDateLimit = frontDate
      renderComponent({ frontDate: '2020-01-01' });
      const earlyRange = { startDate: '2019-01-01', endDate: '2020-12-31', dateInterval: '1' };
      capturedContainerProps.getDatesInDateRange(makeDef(), earlyRange, endDateLimit, false);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });

    it('startDate >= frontDate → startDateLimit uses startDate', () => {
      // startDate = 2020-06-01, frontDate = 2020-01-01 → startDateLimit = startDate
      renderComponent({ frontDate: '2020-01-01' });
      const laterRange = { startDate: '2020-06-01', endDate: '2020-12-31', dateInterval: '1' };
      capturedContainerProps.getDatesInDateRange(makeDef(), laterRange, endDateLimit, false);
      expect(datesInDateRanges).toHaveBeenCalledTimes(1);
    });
  });
});
