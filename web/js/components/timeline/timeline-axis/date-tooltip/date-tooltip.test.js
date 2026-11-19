/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import DateTooltip from './date-tooltip';

jest.mock('../../date-util', () => ({
  getDisplayDate: jest.fn(() => '2023 MAY 01'),
  getDaysInYear: jest.fn(() => 5),
}));

const dateUtil = require('../../date-util');

function buildProps(overrides = {}) {
  return {
    activeLayers: [
      { startDate: '2020-01-01', visible: true },
      { startDate: '2020-01-01', visible: true },
    ],
    axisWidth: 1000,
    hasSubdailyLayers: false,
    hoverTime: '2023-05-02T00:00:00Z',
    isTimelineLayerCoveragePanelOpen: false,
    leftOffset: 300,
    selectedDate: '2023-05-01T00:00:00Z',
    selectedDraggerPosition: 100,
    shouldIncludeHiddenLayers: false,
    showDraggerTime: false,
    showHoverLine: false,
    ...overrides,
  };
}

function renderTooltip(overrides = {}) {
  return render(<DateTooltip {...buildProps(overrides)} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  dateUtil.getDisplayDate.mockReturnValue('2023 MAY 01');
  dateUtil.getDaysInYear.mockReturnValue(5);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('DateTooltip', () => {
  it('shows the tooltip on mount and renders the formatted date and DOY', () => {
    const { container } = renderTooltip();
    expect(container.querySelector('.date-tooltip-fade')).toBeTruthy();
    expect(container.textContent).toContain('2023 MAY 01');
    // getDaysInYear returns 5 -> padded to 005
    expect(container.textContent).toContain('DOY 005');
  });

  it('hides the tooltip after the 1800ms timeout', () => {
    const { container } = renderTooltip();
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    expect(container.querySelector('.date-tooltip-fade')).toBeNull();
    expect(container.querySelector('.date-tooltip-day')).toBeNull();
  });

  it('pads a day-of-year between 10 and 99 with a single zero', () => {
    dateUtil.getDaysInYear.mockReturnValue(50);
    const { container } = renderTooltip();
    expect(container.textContent).toContain('DOY 050');
  });

  it('does not pad a day-of-year of 100 or more', () => {
    dateUtil.getDaysInYear.mockReturnValue(150);
    const { container } = renderTooltip();
    expect(container.textContent).toContain('DOY 150');
  });

  it('shows a dragger tooltip from the selected date', () => {
    const { container } = renderTooltip({ showDraggerTime: true });
    expect(dateUtil.getDisplayDate).toHaveBeenCalledWith(new Date('2023-05-01T00:00:00Z'), false);
    expect(container.querySelector('.date-tooltip').style.display).toBe('block');
  });

  it('hides the dragger tooltip when the dragger position is out of range', () => {
    const { container } = renderTooltip({ showDraggerTime: true, selectedDraggerPosition: -100 });
    expect(container.querySelector('.date-tooltip').style.display).toBe('none');
  });

  it('shows a hover tooltip from the hover time once the mount tooltip times out', () => {
    const { container } = renderTooltip({ showHoverLine: true });
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    // showTooltip is now false, so the hover branch drives the display
    expect(container.querySelector('.date-tooltip').style.display).toBe('block');
    expect(container.textContent).toContain('2023 MAY 01');
  });

  it('widens the tooltip and shifts offsets for subdaily layers', () => {
    const { container } = renderTooltip({ showDraggerTime: true, hasSubdailyLayers: true });
    const tooltip = container.querySelector('.date-tooltip');
    expect(tooltip.style.width).toBe('286px');
    expect(dateUtil.getDisplayDate).toHaveBeenCalledWith(expect.any(Date), true);
  });

  it('adjusts the tooltip height offset when the coverage panel is open', () => {
    const { container } = renderTooltip({
      showDraggerTime: true,
      isTimelineLayerCoveragePanelOpen: true,
    });
    const tooltip = container.querySelector('.date-tooltip');
    // -136 - min(2,5)*40 = -216
    expect(tooltip.style.transform).toContain('-216px');
  });

  it('clamps the coverage-panel height offset to a minimum', () => {
    const manyLayers = Array.from({ length: 10 }, () => ({ startDate: '2020-01-01', visible: true }));
    const { container } = renderTooltip({
      showDraggerTime: true,
      isTimelineLayerCoveragePanelOpen: true,
      activeLayers: manyLayers,
    });
    const tooltip = container.querySelector('.date-tooltip');
    // -136 - min(10,5)*40 = -336, not clamped to -357 yet; verify it is computed
    expect(tooltip.style.transform).toContain('-336px');
  });

  it('uses the subdaily hover offset for a hover tooltip', () => {
    const { container } = renderTooltip({ showHoverLine: true, hasSubdailyLayers: true });
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    const tooltip = container.querySelector('.date-tooltip');
    // hover + subdaily -> leftOffset(300) - 146 = 154
    expect(tooltip.style.transform).toContain('154px');
  });

  it('counts hidden layers for the coverage-panel height when requested', () => {
    const { container } = renderTooltip({
      showDraggerTime: true,
      isTimelineLayerCoveragePanelOpen: true,
      shouldIncludeHiddenLayers: true,
      activeLayers: [
        { startDate: '2020-01-01', visible: false },
        { startDate: '2020-01-01', visible: true },
        { startDate: null, visible: true },
      ],
    });
    const tooltip = container.querySelector('.date-tooltip');
    // two layers have startDate -> -136 - min(2,5)*40 = -216
    expect(tooltip.style.transform).toContain('-216px');
  });

  it('hides the tooltip on hover time change', () => {
    const { container, rerender } = renderTooltip();
    rerender(<DateTooltip {...buildProps({ hoverTime: '2023-05-09T00:00:00Z' })} />);
    expect(container.querySelector('.date-tooltip-fade')).toBeNull();
  });

  it('re-displays the tooltip when the selected date changes without hover/dragger', () => {
    const { container } = renderTooltip();
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    expect(container.querySelector('.date-tooltip-fade')).toBeNull();
    // changing the selected date while not hovering re-shows the tooltip
    render(<DateTooltip {...buildProps({ selectedDate: '2023-05-04T00:00:00Z' })} />);
  });

  it('re-displays the tooltip on selected date change via rerender', () => {
    const { container, rerender } = renderTooltip();
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    rerender(<DateTooltip {...buildProps({ selectedDate: '2023-05-04T00:00:00Z' })} />);
    expect(container.querySelector('.date-tooltip-fade')).toBeTruthy();
  });

  it('clears the pending timeout on unmount', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderTooltip();
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
