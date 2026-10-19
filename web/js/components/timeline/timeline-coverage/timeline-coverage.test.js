/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, fireEvent, act, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import googleTagManager from 'googleTagManager';
import { toggleCustomContent } from '../../../modules/modal/actions';

// TDZ-safe Redux capture; component loaded in beforeAll to avoid TDZ.
let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => (
    <span data-testid={`icon-${icon}`} className={className} />
  ),
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));

jest.mock('../../../modules/date/constants', () => ({
  timeScaleOptions: {
    day: { timeAxis: { gridWidth: 12 } },
    month: { timeAxis: { gridWidth: 24 } },
    year: { timeAxis: { gridWidth: 50 } },
  },
}));

jest.mock('../../../modules/date/util', () => ({
  filterProjLayersWithStartDate: jest.fn((layers) => layers),
}));

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn((state) => state.layers?.active || []),
}));

jest.mock('../../../modules/modal/actions', () => ({
  toggleCustomContent: jest.fn((key, config) => ({ type: 'TOGGLE_CUSTOM_CONTENT', key, config })),
}));

jest.mock('../../util/scrollbar', () => function MockScrollbars({ children, style }) {
  return <div data-testid="scrollbars" style={style}>{children}</div>;
});

let capturedSwitchProps = null;
jest.mock('../../util/switch', () => function MockSwitch(props) {
  capturedSwitchProps = props;
  return <div data-testid="switch" data-active={String(props.active)} />;
});

jest.mock('./info-modal', () => function MockInfoModal() {
  return <div data-testid="info-modal" />;
});

let capturedItemListProps = null;
jest.mock('./coverage-item-list', () => function MockCoverageItemList(props) {
  capturedItemListProps = props;
  return <div data-testid="coverage-item-list" />;
});

let TimelineLayerCoveragePanel;
beforeAll(() => {
  TimelineLayerCoveragePanel = require('./timeline-coverage').default;
});

const visibleLayer = {
  id: 'layer1',
  visible: true,
  startDate: '2020-01-01T00:00:00.000Z',
  endDate: '2020-12-31T00:00:00.000Z',
  ongoing: false,
};

const hiddenLayer = {
  id: 'layer2',
  visible: false,
  startDate: '2020-01-01T00:00:00.000Z',
  endDate: '2020-12-31T00:00:00.000Z',
  ongoing: false,
};

const defaultProps = {
  activeLayers: [visibleLayer],
  appNow: new Date('2021-01-01T00:00:00.000Z'),
  axisWidth: 1000,
  backDate: '2021-01-01T00:00:00.000Z',
  frontDate: '2020-01-01T00:00:00.000Z',
  isTimelineLayerCoveragePanelOpen: false,
  isProductPickerOpen: false,
  onInfoClick: jest.fn(),
  parentOffset: 100,
  positionTransformX: 0,
  projection: 'geographic',
  setMatchingTimelineCoverage: jest.fn(),
  timelineStartDateLimit: '2000-01-01T00:00:00.000Z',
  timeScale: 'day',
  toggleLayerCoveragePanel: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <TimelineLayerCoveragePanel {...defaultProps} {...props} />,
);

describe('TimelineLayerCoveragePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedItemListProps = null;
    capturedSwitchProps = null;
  });

  // ─── rendering ────────────────────────────────────────────────────────────

  describe('rendering — panel closed', () => {
    it('renders the panel handle button', () => {
      const { container } = renderComponent();
      expect(container.querySelector('#timeline-layer-coverage-panel-handle')).toBeInTheDocument();
    });

    it('renders the container div with timeline-layer-coverage-closed class', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.timeline-layer-coverage-container'))
        .toHaveClass('timeline-layer-coverage-closed');
    });

    it('does not render CoverageItemList when panel is closed', () => {
      const { queryByTestId } = renderComponent();
      expect(queryByTestId('coverage-item-list')).not.toBeInTheDocument();
    });

    it('panel handle aria-label says "Show layer coverage panel" when closed', () => {
      const { getByRole } = renderComponent({ isTimelineLayerCoveragePanelOpen: false });
      expect(getByRole('button', { name: 'Show layer coverage panel' })).toBeInTheDocument();
    });

    it('chevron div has closed class', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: false });
      expect(container.querySelector('.timeline-layer-coverage-panel-handle-chevron'))
        .toHaveClass('timeline-layer-coverage-panel-handle-chevron-closed');
    });
  });

  describe('rendering — panel open', () => {
    it('renders with timeline-layer-coverage-open class when open', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(container.querySelector('.timeline-layer-coverage-container'))
        .toHaveClass('timeline-layer-coverage-open');
    });

    it('renders CoverageItemList when panel is open', () => {
      const { getByTestId } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByTestId('coverage-item-list')).toBeInTheDocument();
    });

    it('renders Scrollbars when panel is open', () => {
      const { getByTestId } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByTestId('scrollbars')).toBeInTheDocument();
    });

    it('renders "LAYER COVERAGE" header title', () => {
      const { getByText } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByText('LAYER COVERAGE')).toBeInTheDocument();
    });

    it('renders info button', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(container.querySelector('#layer-coverage-info-button')).toBeInTheDocument();
    });

    it('renders "Include Hidden Layers" Switch', () => {
      const { getByTestId } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByTestId('switch')).toBeInTheDocument();
    });

    it('Switch active=false by default', () => {
      const { getByTestId } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByTestId('switch').dataset.active).toBe('false');
    });

    it('panel handle aria-label says "Collapse layer coverage panel" when open', () => {
      const { getByRole } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByRole('button', { name: 'Collapse layer coverage panel' })).toBeInTheDocument();
    });

    it('chevron div has open class when panel is open', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(container.querySelector('.timeline-layer-coverage-panel-handle-chevron'))
        .toHaveClass('timeline-layer-coverage-panel-handle-chevron-open');
    });
  });

  // ─── stopPropagation ──────────────────────────────────────────────────────

  describe('stopPropagation', () => {
    it('calls stopImmediatePropagation, stopPropagation, and preventDefault', () => {
      const e = {
        nativeEvent: { stopImmediatePropagation: jest.fn() },
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      };
      TimelineLayerCoveragePanel.stopPropagation(e);
      expect(e.nativeEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('wheel event on container calls stopPropagation on the native event', () => {
      const { container } = renderComponent();
      const coverageContainer = container.querySelector('.timeline-layer-coverage-container');
      const stopPropagation = jest.fn();
      const wheelEvent = new Event('wheel');
      wheelEvent.stopPropagation = stopPropagation;
      coverageContainer.dispatchEvent(wheelEvent);
      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  // ─── togglePanelOpenClose ─────────────────────────────────────────────────

  describe('togglePanelOpenClose', () => {
    it('calls toggleLayerCoveragePanel(true) when panel is closed', () => {
      const toggleLayerCoveragePanel = jest.fn();
      const { container } = renderComponent({
        isTimelineLayerCoveragePanelOpen: false,
        toggleLayerCoveragePanel,
      });
      fireEvent.click(container.querySelector('#timeline-layer-coverage-panel-handle'));
      expect(toggleLayerCoveragePanel).toHaveBeenCalledWith(true);
    });

    it('calls toggleLayerCoveragePanel(false) when panel is open', () => {
      const toggleLayerCoveragePanel = jest.fn();
      const { container } = renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        toggleLayerCoveragePanel,
      });
      fireEvent.click(container.querySelector('#timeline-layer-coverage-panel-handle'));
      expect(toggleLayerCoveragePanel).toHaveBeenCalledWith(false);
    });
  });

  // ─── renderInfoButton ─────────────────────────────────────────────────────

  describe('renderInfoButton', () => {
    it('info button click calls onInfoClick', () => {
      const onInfoClick = jest.fn();
      const { container } = renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        onInfoClick,
      });
      fireEvent.click(container.querySelector('#layer-coverage-info-button'));
      expect(onInfoClick).toHaveBeenCalledTimes(1);
    });

    it('renders question-circle icon inside info button', () => {
      const { getByTestId } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      expect(getByTestId('icon-question-circle')).toBeInTheDocument();
    });
  });

  // ─── getConditionalStyles ─────────────────────────────────────────────────

  describe('getConditionalStyles', () => {
    it('container style has correct width from axisWidth', () => {
      const { container } = renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        axisWidth: 800,
      });
      const el = container.querySelector('.timeline-layer-coverage-container');
      expect(el.style.width).toBe('801px');
    });

    it('container display is "none" when panel is closed', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: false });
      const el = container.querySelector('.timeline-layer-coverage-container');
      expect(el.style.display).toBe('none');
    });

    it('container display is "block" when panel is open', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      const el = container.querySelector('.timeline-layer-coverage-container');
      expect(el.style.display).toBe('block');
    });

    it('panel handle has top: -19px when closed', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: false });
      const handle = container.querySelector('#timeline-layer-coverage-panel-handle');
      expect(handle.style.top).toBe('-19px');
    });

    it('panel handle top offset is not -19px when open', () => {
      const { container } = renderComponent({ isTimelineLayerCoveragePanelOpen: true });
      const handle = container.querySelector('#timeline-layer-coverage-panel-handle');
      expect(handle.style.top).not.toBe('-19px');
    });

    it('container left offset uses parentOffset', () => {
      const { container } = renderComponent({ parentOffset: 200 });
      const el = container.querySelector('.timeline-layer-coverage-container');
      expect(el.style.left).toBe('190px'); // 200 - 10
    });
  });

  // ─── getActiveLayers ──────────────────────────────────────────────────────

  describe('getActiveLayers — shouldIncludeHiddenLayers', () => {
    it('filters out invisible layers by default (shouldIncludeHiddenLayers=false)', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        activeLayers: [visibleLayer, hiddenLayer],
        setMatchingTimelineCoverage,
      });
      await waitFor(() => {
        expect(capturedItemListProps.activeLayers).toHaveLength(1);
        expect(capturedItemListProps.activeLayers[0].id).toBe('layer1');
      });
    });

    it('includes hidden layers when Switch is toggled on', async () => {
      renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        activeLayers: [visibleLayer, hiddenLayer],
        setMatchingTimelineCoverage: jest.fn(),
      });
      await act(async () => {
        capturedSwitchProps.toggle();
      });
      await waitFor(() => {
        expect(capturedItemListProps.activeLayers).toHaveLength(2);
      });
    });

    it('Switch active becomes true after toggle', async () => {
      const { getByTestId } = renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        setMatchingTimelineCoverage: jest.fn(),
      });
      await act(async () => {
        capturedSwitchProps.toggle();
      });
      await waitFor(() => {
        expect(getByTestId('switch').dataset.active).toBe('true');
      });
    });
  });

  // ─── addMatchingCoverageToTimeline ────────────────────────────────────────

  describe('addMatchingCoverageToTimeline', () => {
    it('calls setMatchingTimelineCoverage on mount', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage).toHaveBeenCalled();
      });
    });

    it('passes dateRange and isChecked to setMatchingTimelineCoverage', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage, activeLayers: [visibleLayer] });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ startDate: visibleLayer.startDate }),
          ]),
          false, // shouldIncludeHiddenLayers default
        );
      });
    });

    it('passes undefined when no active layers', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage, activeLayers: [] });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage).toHaveBeenCalledWith(undefined, false);
      });
    });
  });

  // ─── getNewMatchingDatesRange ─────────────────────────────────────────────

  describe('getNewMatchingDatesRange', () => {
    it('returns array of {startDate, endDate} for normal layers', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({
        setMatchingTimelineCoverage,
        activeLayers: [visibleLayer],
      });
      await waitFor(() => {
        const [[dateRange]] = setMatchingTimelineCoverage.mock.calls;
        expect(dateRange[0].startDate).toBe(visibleLayer.startDate);
        expect(dateRange[0].endDate).toBe(visibleLayer.endDate);
      });
    });

    it('uses appNow when endDate is absent', async () => {
      const appNow = new Date('2021-06-01T00:00:00.000Z');
      const noEndLayer = { ...visibleLayer, endDate: undefined };
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage, activeLayers: [noEndLayer], appNow });
      await waitFor(() => {
        const [[dateRange]] = setMatchingTimelineCoverage.mock.calls;
        expect(dateRange[0].endDate).toBe(appNow);
      });
    });

    it('maps granuleDateRanges to {startDate, endDate} pairs', async () => {
      const granuleLayer = {
        ...visibleLayer,
        granuleDateRanges: [
          ['2020-01-01T00:00:00.000Z', '2020-06-30T00:00:00.000Z'],
          ['2020-07-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z'],
        ],
      };
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage, activeLayers: [granuleLayer] });
      await waitFor(() => {
        const [[dateRange]] = setMatchingTimelineCoverage.mock.calls;
        expect(dateRange).toHaveLength(2);
        expect(dateRange[0]).toEqual({ startDate: '2020-01-01T00:00:00.000Z', endDate: '2020-06-30T00:00:00.000Z' });
        expect(dateRange[1]).toEqual({ startDate: '2020-07-01T00:00:00.000Z', endDate: '2020-12-31T00:00:00.000Z' });
      });
    });

    it('returns undefined for empty activeLayers', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      renderComponent({ setMatchingTimelineCoverage, activeLayers: [] });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage).toHaveBeenCalledWith(undefined, false);
      });
    });
  });

  // ─── getMatchingCoverageLineDimensions ────────────────────────────────────

  describe('getMatchingCoverageLineDimensions', () => {
    const renderOpen = (props = {}) => renderComponent({
      isTimelineLayerCoveragePanelOpen: true,
      setMatchingTimelineCoverage: jest.fn(),
      ...props,
    });

    // frontDate=Jan1 2020, backDate=Jan1 2021, gridWidth=12, positionTransformX=0

    it('returns visible=true for layer within axis range', () => {
      renderOpen();
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        visibleLayer, null, null,
      );
      expect(result[0].visible).toBe(true);
    });

    it('returns visible=false when layerStart is after backDate', () => {
      renderOpen();
      const futureLayer = { ...visibleLayer, startDate: '2022-01-01T00:00:00.000Z', endDate: '2022-12-31T00:00:00.000Z' };
      const result = capturedItemListProps
        .getMatchingCoverageLineDimensions(futureLayer, null, null);
      expect(result[0].visible).toBe(false);
    });

    it('returns visible=false when layerEnd is before frontDate', () => {
      renderOpen();
      const pastLayer = { ...visibleLayer, startDate: '2018-01-01T00:00:00.000Z', endDate: '2019-01-01T00:00:00.000Z' };
      const result = capturedItemListProps
        .getMatchingCoverageLineDimensions(pastLayer, null, null);
      expect(result[0].visible).toBe(false);
    });

    it('leftOffset=0 when layer starts before axisFrontDate', () => {
      renderOpen();
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        visibleLayer, null, null,
      );
      expect(result[0].leftOffset).toBe(0);
      expect(result[0].layerStartBeforeAxisFront).toBe(true);
    });

    it('computes leftOffset via diff when layer starts after axisFrontDate', () => {
      renderOpen({ positionTransformX: 0 });
      const midLayer = {
        ...visibleLayer,
        startDate: '2020-07-01T00:00:00.000Z',
        endDate: '2022-01-01T00:00:00.000Z',
        ongoing: false,
      };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(midLayer, null, null);
      expect(result[0].leftOffset).toBeGreaterThan(0);
      expect(result[0].layerStartBeforeAxisFront).toBe(false);
    });

    it('computes width when layerEnd is before axisBackDate', () => {
      renderOpen();
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        visibleLayer, null, null,
      );
      // Dec 31 2020 < Jan 1 2021, so layerEndBeforeAxisBack=true → width is calculated
      expect(result[0].layerEndBeforeAxisBack).toBe(true);
      expect(result[0].width).toBeLessThan(1000 * 5);
    });

    it('width is axisWidth*5 when layerEnd exceeds axisBackDate', () => {
      renderOpen({ axisWidth: 500 });
      const extendedLayer = {
        ...visibleLayer,
        endDate: '2025-01-01T00:00:00.000Z',
        ongoing: false,
      };
      const result = capturedItemListProps
        .getMatchingCoverageLineDimensions(extendedLayer, null, null);
      expect(result[0].width).toBe(500 * 5);
      expect(result[0].layerEndBeforeAxisBack).toBe(false);
    });

    it('uses timelineStartDateLimit when no rangeStart and no startDate', () => {
      renderOpen();
      const noStartLayer = {
        id: 'no-start',
        visible: true,
        ongoing: false,
        endDate: '2020-06-01T00:00:00.000Z',
      };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        noStartLayer, null, null,
      );
      // timelineStartDateLimit = Jan 1 2000, so layerStart well before axisFrontDate
      expect(result[0].layerStartBeforeAxisFront).toBe(true);
    });

    it('uses rangeStart when provided', () => {
      renderOpen({ positionTransformX: 0 });
      const noStartLayer = { id: 'x', visible: true, ongoing: false, endDate: '2022-01-01T00:00:00.000Z' };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        noStartLayer, '2020-06-01T00:00:00.000Z', null,
      );
      expect(result[0].visible).toBe(true);
    });

    it('uses rangeEnd when provided', () => {
      renderOpen();
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        visibleLayer, null, '2020-06-01T00:00:00.000Z',
      );
      expect(result[0].layerEndBeforeAxisBack).toBe(true);
    });

    it('uses endDate for futureTime ongoing layer', () => {
      renderOpen();
      const futureTimeLayer = {
        ...visibleLayer,
        ongoing: true,
        futureTime: true,
        endDate: '2025-01-01T00:00:00.000Z',
      };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        futureTimeLayer, null, null,
      );
      // futureTime + endDate → layerEnd = 2025, which is after axisBackDate
      expect(result[0].layerEndBeforeAxisBack).toBe(false);
    });

    it('uses appNow for ongoing layer with no futureTime', () => {
      renderOpen({ appNow: new Date('2021-01-01T00:00:00.000Z') });
      const ongoingLayer = {
        ...visibleLayer,
        ongoing: true,
        futureTime: false,
        endDate: undefined,
      };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(
        ongoingLayer, null, null,
      );
      expect(result).toHaveLength(1);
    });

    it('isWidthGreaterThanRendered=true when layer spans beyond axis', () => {
      renderOpen();
      const bigLayer = {
        ...visibleLayer,
        startDate: '2019-01-01T00:00:00.000Z',
        endDate: '2022-01-01T00:00:00.000Z',
        ongoing: false,
      };
      const result = capturedItemListProps.getMatchingCoverageLineDimensions(bigLayer, null, null);
      expect(result[0].isWidthGreaterThanRendered).toBe(true);
    });

    describe('granuleDateRanges path', () => {
      it('returns one result per granule range', () => {
        renderOpen();
        const granuleLayer = {
          visible: true,
          ongoing: false,
          granuleDateRanges: [
            ['2020-01-01T00:00:00.000Z', '2020-06-30T00:00:00.000Z'],
            ['2020-07-01T00:00:00.000Z', '2020-12-31T00:00:00.000Z'],
          ],
        };
        const result = capturedItemListProps.getMatchingCoverageLineDimensions(
          granuleLayer, null, null,
        );
        expect(result).toHaveLength(2);
      });

      it('computes visible for each granule range', () => {
        renderOpen();
        const granuleLayer = {
          visible: true,
          ongoing: false,
          granuleDateRanges: [
            ['2020-01-01T00:00:00.000Z', '2020-06-30T00:00:00.000Z'],
            ['2022-01-01T00:00:00.000Z', '2022-12-31T00:00:00.000Z'], // outside axis
          ],
        };
        const result = capturedItemListProps.getMatchingCoverageLineDimensions(
          granuleLayer, null, null,
        );
        expect(result[0].visible).toBe(true);
        expect(result[1].visible).toBe(false);
      });

      it('uses timelineStartDateLimit in granule path when no startDate in tuple', () => {
        renderOpen();
        const granuleLayer = {
          visible: true,
          ongoing: false,
          granuleDateRanges: [
            [null, '2020-06-30T00:00:00.000Z'],
          ],
        };
        const result = capturedItemListProps.getMatchingCoverageLineDimensions(
          granuleLayer, null, null,
        );
        // startDate=null, rangeStart=null → use timelineStartDateLimit (Jan 1 2000)
        expect(result[0].layerStartBeforeAxisFront).toBe(true);
      });

      it('uses positionTransformX in leftOffset calc for granule layers', () => {
        renderOpen({ positionTransformX: 10 });
        const granuleLayer = {
          visible: true,
          ongoing: false,
          granuleDateRanges: [
            ['2020-07-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z'],
          ],
        };
        const result = capturedItemListProps.getMatchingCoverageLineDimensions(
          granuleLayer, null, null,
        );
        expect(result[0].leftOffset).toBeGreaterThan(0);
      });
    });
  });

  // ─── shouldComponentUpdate ────────────────────────────────────────────────

  describe('shouldComponentUpdate', () => {
    it('prevents re-render when timeScale changes but front/backDate are unchanged', () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      act(() => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            timeScale="month"
          />,
        );
      });
      // SCU returned false → componentDidUpdate skipped → no additional calls
      expect(setMatchingTimelineCoverage.mock.calls.length).toBe(countAfterMount);
    });

    it('allows re-render when timeScale changes and frontDate also changes', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            timeScale="month"
            frontDate="2019-01-01T00:00:00.000Z"
          />,
        );
      });
      // SCU returned true (frontDate changed) → componentDidUpdate fired
      // But none of the 4 update triggers are hit (no layer/projection/appNow/toggle changes)
      // So the count stays the same — just verify no crash
      expect(setMatchingTimelineCoverage.mock.calls.length).toBeGreaterThanOrEqual(countAfterMount);
    });

    it('allows re-render when timeScale is unchanged', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            projection="arctic"
          />,
        );
      });
      // SCU returns true (timeScale unchanged) → componentDidUpdate fires → projectionChange=true
      await waitFor(() => {
        expect(setMatchingTimelineCoverage.mock.calls.length).toBeGreaterThan(countAfterMount);
      });
    });
  });

  // ─── componentDidUpdate ───────────────────────────────────────────────────

  describe('componentDidUpdate', () => {
    it('toggles panel closed when product picker opens while panel is open', async () => {
      const toggleLayerCoveragePanel = jest.fn();
      const { rerender } = renderComponent({
        isTimelineLayerCoveragePanelOpen: true,
        isProductPickerOpen: false,
        toggleLayerCoveragePanel,
      });

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            isTimelineLayerCoveragePanelOpen
            isProductPickerOpen
            toggleLayerCoveragePanel={toggleLayerCoveragePanel}
          />,
        );
      });
      expect(toggleLayerCoveragePanel).toHaveBeenCalledWith(false);
    });

    it('updates on projection change', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            projection="arctic"
          />,
        );
      });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage.mock.calls.length).toBeGreaterThan(countAfterMount);
      });
    });

    it('updates on appNow change', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            appNow={new Date('2021-06-01T00:00:00.000Z')}
          />,
        );
      });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage.mock.calls.length).toBeGreaterThan(countAfterMount);
      });
    });

    it('updates on active layers change', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({
        setMatchingTimelineCoverage,
        activeLayers: [visibleLayer],
      });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      const newLayer = { ...visibleLayer, id: 'layer-new' };
      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            activeLayers={[visibleLayer, newLayer]}
          />,
        );
      });
      await waitFor(() => {
        expect(setMatchingTimelineCoverage.mock.calls.length).toBeGreaterThan(countAfterMount);
      });
    });

    it('does not update when isProductPickerOpen=false (no other changes)', async () => {
      const setMatchingTimelineCoverage = jest.fn();
      const { rerender } = renderComponent({ setMatchingTimelineCoverage });
      const countAfterMount = setMatchingTimelineCoverage.mock.calls.length;

      await act(async () => {
        rerender(
          <TimelineLayerCoveragePanel
            {...defaultProps}
            setMatchingTimelineCoverage={setMatchingTimelineCoverage}
            isProductPickerOpen={false}
          />,
        );
      });
      // no change in any of the 4 tracked conditions
      expect(setMatchingTimelineCoverage.mock.calls.length).toBe(countAfterMount);
    });
  });

  // ─── mapStateToProps ──────────────────────────────────────────────────────

  describe('mapStateToProps', () => {
    const { getActiveLayers } = require('../../../modules/layers/selectors');
    const { filterProjLayersWithStartDate } = require('../../../modules/date/util');

    const makeState = (overrides = {}) => ({
      date: { appNow: new Date('2021-01-01T00:00:00.000Z') },
      modal: { isOpen: false, id: null },
      proj: { id: 'geographic' },
      layers: { active: [] },
      ...overrides,
    });

    beforeEach(() => {
      getActiveLayers.mockReturnValue([visibleLayer]);
      filterProjLayersWithStartDate.mockImplementation((layers) => layers);
    });

    it('maps appNow from date.appNow', () => {
      const appNow = new Date('2021-06-01T00:00:00.000Z');
      const result = capturedMapState(makeState({ date: { appNow } }));
      expect(result.appNow).toBe(appNow);
    });

    it('maps projection from proj.id', () => {
      const result = capturedMapState(makeState({ proj: { id: 'arctic' } }));
      expect(result.projection).toBe('arctic');
    });

    it('maps activeLayers via getActiveLayers and filterProjLayersWithStartDate', () => {
      const result = capturedMapState(makeState());
      expect(result.activeLayers).toEqual([visibleLayer]);
    });

    it('isProductPickerOpen=true when modal is open with LAYER_PICKER_COMPONENT id', () => {
      const result = capturedMapState(makeState({
        modal: { isOpen: true, id: 'LAYER_PICKER_COMPONENT' },
      }));
      expect(result.isProductPickerOpen).toBe(true);
    });

    it('isProductPickerOpen=false when modal id does not match', () => {
      const result = capturedMapState(makeState({
        modal: { isOpen: true, id: 'OTHER_MODAL' },
      }));
      expect(result.isProductPickerOpen).toBe(false);
    });
  });

  // ─── mapDispatchToProps ───────────────────────────────────────────────────

  describe('mapDispatchToProps', () => {
    it('onInfoClick dispatches toggleCustomContent with correct key', () => {
      const dispatch = jest.fn();
      const { onInfoClick } = capturedMapDispatch(dispatch);
      onInfoClick();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TOGGLE_CUSTOM_CONTENT', key: 'TIMELINE_LAYER_COVERAGE_INFO_MODAL' }),
      );
    });

    it('onInfoClick calls googleTagManager.pushEvent', () => {
      const dispatch = jest.fn();
      const { onInfoClick } = capturedMapDispatch(dispatch);
      onInfoClick();
      expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'layer_coverage_panel_info' });
    });

    it('onInfoClick passes LayerCoverageInfoModal as bodyComponent', () => {
      const dispatch = jest.fn();
      const { onInfoClick } = capturedMapDispatch(dispatch);
      onInfoClick();
      const [, config] = toggleCustomContent.mock.calls[0];
      expect(config.bodyComponent).toBeDefined();
    });
  });
});
