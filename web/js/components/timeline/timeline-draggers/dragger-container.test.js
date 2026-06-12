/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockCapturedDraggers = {};
jest.mock('./timeline-dragger', () => function MockDragger(props) {
  mockCapturedDraggers[props.draggerName] = props;
  return <g data-testid={`dragger-${props.draggerName}`} />;
});

jest.mock('../date-util', () => ({
  getISODateFormatted: jest.fn((date) => `${new Date(date).toISOString()
    .split('.')[0]}Z`),
  getIsBetween: jest.fn((date, front, back) => {
    const d = new Date(date).getTime();
    return d >= new Date(front).getTime() && d <= new Date(back).getTime();
  }),
}));

jest.mock('../../../modules/date/constants', () => ({
  timeScaleOptions: {
    day: { timeAxis: { gridWidth: 12, scaleMs: 86400000 } },
    month: { timeAxis: { gridWidth: 12, scaleMs: null } },
    year: { timeAxis: { gridWidth: 18, scaleMs: null } },
    // synthetic scale to exercise the neither-year-nor-month branch in handleDragDragger
    decade: { timeAxis: { gridWidth: 36, scaleMs: null } },
  },
}));

import DraggerContainer from './dragger-container';

const defaultProps = {
  axisWidth: 800,
  backDate: '2020-12-31T00:00:00Z',
  draggerPosition: 100,
  draggerPositionB: 200,
  draggerSelected: 'selected',
  draggerTimeState: '2020-06-01T00:00:00Z',
  draggerTimeStateB: '2020-09-01T00:00:00Z',
  draggerVisible: true,
  draggerVisibleB: true,
  frontDate: '2020-01-01T00:00:00Z',
  isCompareModeActive: false,
  isDraggerDragging: false,
  onChangeSelectedDragger: jest.fn(),
  position: 0,
  setDraggerVisibility: jest.fn(),
  timelineEndDateLimit: '2021-01-01T00:00:00Z',
  timelineStartDateLimit: '2019-01-01T00:00:00Z',
  timeScale: 'day',
  toggleShowDraggerTime: jest.fn(),
  transformX: 0,
  updateDraggerDatePosition: jest.fn(),
};

const renderComponent = (props = {}) => render(
  <DraggerContainer {...defaultProps} {...props} />,
);

describe('DraggerContainer', () => {
  beforeEach(() => {
    mockCapturedDraggers = {};
    jest.clearAllMocks();
    global.requestAnimationFrame = jest.fn((cb) => { cb(); });
  });

  describe('render — draggerSelected = selected', () => {
    it('renders an svg.dragger-container with the correct axis width', () => {
      const { container } = renderComponent();
      const svg = container.querySelector('svg.dragger-container');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('width')).toBe('800');
    });

    it('renders only the A dragger when compare mode is off', () => {
      const { getByTestId, queryByTestId } = renderComponent();
      expect(getByTestId('dragger-selected')).toBeInTheDocument();
      expect(queryByTestId('dragger-selectedB')).not.toBeInTheDocument();
    });

    it('renders both draggers when compare mode is on: A enabled, B disabled', () => {
      renderComponent({ isCompareModeActive: true });
      expect(mockCapturedDraggers['selected'].disabled).toBe(false);
      expect(mockCapturedDraggers['selectedB'].disabled).toBe(true);
    });

    it('clipPath A width is Math.max(49, 49 + draggerPosition) for positive position', () => {
      const { container } = renderComponent({ draggerPosition: 100 });
      const clipA = container.querySelector('#selectedDraggerClipA rect');
      expect(clipA.getAttribute('width')).toBe('149');
    });

    it('clipPath A width clamps to 49 when draggerPosition is very negative', () => {
      const { container } = renderComponent({ draggerPosition: -200 });
      const clipA = container.querySelector('#selectedDraggerClipA rect');
      expect(clipA.getAttribute('width')).toBe('49');
    });

    it('clipPath B width is Math.max(49, 49 + draggerPositionB)', () => {
      const { container } = renderComponent({ draggerPositionB: 200 });
      const clipB = container.querySelector('#selectedDraggerClipB rect');
      expect(clipB.getAttribute('width')).toBe('249');
    });

    it('passes correct props to the A dragger', () => {
      renderComponent({ draggerPosition: 50, draggerVisible: false });
      expect(mockCapturedDraggers['selected'].draggerPosition).toBe(50);
      expect(mockCapturedDraggers['selected'].draggerVisible).toBe(false);
      expect(mockCapturedDraggers['selected'].draggerName).toBe('selected');
    });
  });

  describe('render — draggerSelected = selectedB', () => {
    it('renders only the B dragger when compare mode is off', () => {
      const { getByTestId, queryByTestId } = renderComponent({ draggerSelected: 'selectedB' });
      expect(getByTestId('dragger-selectedB')).toBeInTheDocument();
      expect(queryByTestId('dragger-selected')).not.toBeInTheDocument();
    });

    it('renders both draggers when compare mode is on: B enabled, A disabled', () => {
      renderComponent({ draggerSelected: 'selectedB', isCompareModeActive: true });
      expect(mockCapturedDraggers['selectedB'].disabled).toBe(false);
      expect(mockCapturedDraggers['selected'].disabled).toBe(true);
    });

    it('passes correct props to the B dragger', () => {
      renderComponent({ draggerSelected: 'selectedB', draggerPositionB: 150, draggerVisibleB: false });
      expect(mockCapturedDraggers['selectedB'].draggerPosition).toBe(150);
      expect(mockCapturedDraggers['selectedB'].draggerVisible).toBe(false);
    });
  });

  describe('componentDidUpdate — compare mode change', () => {
    it('calls setDraggerVisibility(true, true) when compare mode activates', () => {
      const setDraggerVisibility = jest.fn();
      const { rerender } = renderComponent({ setDraggerVisibility, isCompareModeActive: false });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            setDraggerVisibility={setDraggerVisibility}
            isCompareModeActive
          />,
        );
      });
      expect(setDraggerVisibility).toHaveBeenCalledWith(true, true);
    });

    it('calls setDraggerVisibility(true, false) when compare mode deactivates with draggerSelected=selected', () => {
      const setDraggerVisibility = jest.fn();
      const { rerender } = renderComponent({
        setDraggerVisibility, isCompareModeActive: true, draggerSelected: 'selected',
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            setDraggerVisibility={setDraggerVisibility}
            isCompareModeActive={false}
            draggerSelected="selected"
          />,
        );
      });
      expect(setDraggerVisibility).toHaveBeenCalledWith(true, false);
    });

    it('calls setDraggerVisibility(false, true) when compare mode deactivates with draggerSelected=selectedB', () => {
      const setDraggerVisibility = jest.fn();
      const { rerender } = renderComponent({
        setDraggerVisibility, isCompareModeActive: true, draggerSelected: 'selectedB',
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            setDraggerVisibility={setDraggerVisibility}
            isCompareModeActive={false}
            draggerSelected="selectedB"
          />,
        );
      });
      expect(setDraggerVisibility).toHaveBeenCalledWith(false, true);
    });

    it('does not call setDraggerVisibility when compare mode does not change', () => {
      const setDraggerVisibility = jest.fn();
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ setDraggerVisibility, updateDraggerDatePosition });
      setDraggerVisibility.mockClear();
      updateDraggerDatePosition.mockClear();
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            setDraggerVisibility={setDraggerVisibility}
            updateDraggerDatePosition={updateDraggerDatePosition}
            axisWidth={900}
          />,
        );
      });
      expect(setDraggerVisibility).not.toHaveBeenCalled();
    });
  });

  describe('componentDidUpdate — dragger time state changes', () => {
    it('calls updateDraggerDatePosition for A when draggerTimeState changes and selected=selected', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition, draggerSelected: 'selected' });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerSelected="selected"
            draggerTimeState="2020-07-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', expect.any(Number), expect.any(Boolean));
    });

    it('calls updateDraggerDatePosition for A when isCompareModeActive=true and draggerTimeState changes', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({
        updateDraggerDatePosition, isCompareModeActive: true, draggerSelected: 'selectedB',
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            isCompareModeActive
            draggerSelected="selectedB"
            draggerTimeState="2020-07-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', expect.any(Number), expect.any(Boolean));
    });

    it('calls updateDraggerDatePosition for B when draggerTimeStateB changes and selected=selectedB', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition, draggerSelected: 'selectedB' });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerSelected="selectedB"
            draggerTimeStateB="2020-10-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selectedB', expect.any(Number), expect.any(Boolean));
    });

    it('calls updateDraggerDatePosition for B when isCompareModeActive=true and draggerTimeStateB changes', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({
        updateDraggerDatePosition, isCompareModeActive: true, draggerSelected: 'selected',
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            isCompareModeActive
            draggerSelected="selected"
            draggerTimeStateB="2020-10-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selectedB', expect.any(Number), expect.any(Boolean));
    });

    it('does not update position when isDraggerDragging=true', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition, isDraggerDragging: true });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            isDraggerDragging
            draggerTimeState="2020-07-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).not.toHaveBeenCalled();
    });

    it('does not update A when draggerTimeState changes but draggerSelected=selectedB and compare mode is off', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({
        updateDraggerDatePosition, draggerSelected: 'selectedB', isCompareModeActive: false,
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerSelected="selectedB"
            isCompareModeActive={false}
            draggerTimeState="2020-07-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).not.toHaveBeenCalled();
    });
  });

  describe('setDraggerPosition', () => {
    it('reports draggerVisible=true when inputTime is between frontDate and backDate', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerTimeState="2020-07-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', expect.any(Number), true);
    });

    it('uses oldDraggerPosition when inputTime is before frontDate', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition, draggerPosition: 100 });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerPosition={100}
            draggerTimeState="2019-01-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', 100, false);
    });

    it('uses oldDraggerPosition when inputTime is after backDate', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({ updateDraggerDatePosition, draggerPosition: 100 });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerPosition={100}
            draggerTimeState="2022-01-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', 100, false);
    });

    it('uses oldDraggerPosition when newDraggerPosition exceeds endDatePosition', () => {
      const updateDraggerDatePosition = jest.fn();
      // timelineEndDateLimit just 1 day after frontDate makes endDatePosition very small
      const { rerender } = renderComponent({
        updateDraggerDatePosition,
        draggerPosition: 100,
        timelineEndDateLimit: '2020-01-02T00:00:00Z',
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerPosition={100}
            timelineEndDateLimit="2020-01-02T00:00:00Z"
            draggerTimeState="2020-12-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selected', 100, expect.any(Boolean));
    });

    it('uses draggerPositionB and selectedB for isDraggerB=true', () => {
      const updateDraggerDatePosition = jest.fn();
      const { rerender } = renderComponent({
        updateDraggerDatePosition, draggerSelected: 'selectedB', draggerPositionB: 200,
      });
      act(() => {
        rerender(
          <DraggerContainer
            {...defaultProps}
            updateDraggerDatePosition={updateDraggerDatePosition}
            draggerSelected="selectedB"
            draggerPositionB={200}
            draggerTimeStateB="2020-10-01T00:00:00Z"
          />,
        );
      });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(null, 'selectedB', expect.any(Number), expect.any(Boolean));
    });
  });

  describe('selectDragger', () => {
    it('calls onChangeSelectedDragger when a different dragger name is selected', () => {
      const onChangeSelectedDragger = jest.fn();
      renderComponent({ onChangeSelectedDragger, draggerSelected: 'selected' });
      mockCapturedDraggers['selected'].selectDragger('selectedB', null);
      expect(onChangeSelectedDragger).toHaveBeenCalledWith('selectedB');
    });

    it('does not call onChangeSelectedDragger when the same dragger is clicked', () => {
      const onChangeSelectedDragger = jest.fn();
      renderComponent({ onChangeSelectedDragger, draggerSelected: 'selected' });
      mockCapturedDraggers['selected'].selectDragger('selected', null);
      expect(onChangeSelectedDragger).not.toHaveBeenCalled();
    });

    it('calls e.stopPropagation and e.preventDefault when event is provided', () => {
      const onChangeSelectedDragger = jest.fn();
      renderComponent({ onChangeSelectedDragger, draggerSelected: 'selected' });
      const e = { stopPropagation: jest.fn(), preventDefault: jest.fn() };
      mockCapturedDraggers['selected'].selectDragger('selectedB', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('does not throw when event is null', () => {
      renderComponent();
      expect(() => mockCapturedDraggers['selected'].selectDragger('selectedB', null)).not.toThrow();
    });
  });

  describe('handleDragDragger', () => {
    it('returns without updating when deltaX is 0', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 0 });
      expect(updateDraggerDatePosition).not.toHaveBeenCalled();
    });

    it('calls e.stopPropagation and e.preventDefault when event is provided', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition });
      const e = { stopPropagation: jest.fn(), preventDefault: jest.fn() };
      mockCapturedDraggers['selected'].handleDragDragger(e, { deltaX: 0 });
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('updates A dragger position with day scale (scaleMs path)', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition, draggerSelected: 'selected', draggerPosition: 100 });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 5 });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(
        expect.any(String), 'selected', 105, null, null, true,
      );
    });

    it('updates B dragger position with day scale', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({
        updateDraggerDatePosition, draggerSelected: 'selectedB', draggerPositionB: 200,
      });
      mockCapturedDraggers['selectedB'].handleDragDragger(null, { deltaX: 10 });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(
        expect.any(String), 'selectedB', 210, null, null, true,
      );
    });

    it('clamps to timelineEndDateLimit when dragged past the end', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 9999999 });
      expect(updateDraggerDatePosition).toHaveBeenCalledWith(
        '2021-01-01T00:00:00Z',
        'selected',
        expect.any(Number),
        null,
        null,
        true,
      );
    });

    it('returns false without updating when dragged before timelineStartDateLimit', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: -9999999 });
      expect(updateDraggerDatePosition).not.toHaveBeenCalled();
    });

    it('uses month scale complex path (no scaleMs, daysInMonth)', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({ updateDraggerDatePosition, timeScale: 'month', draggerSelected: 'selected', draggerPosition: 100 });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 1 });
      expect(updateDraggerDatePosition).toHaveBeenCalled();
    });

    it('uses year scale complex path with leap year (daysCount=366)', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({
        updateDraggerDatePosition,
        timeScale: 'year',
        draggerSelected: 'selected',
        draggerPosition: 0,
        position: 40,
        frontDate: '2020-01-01T00:00:00Z',
        backDate: '2025-12-31T00:00:00Z',
        timelineEndDateLimit: '2025-01-01T00:00:00Z',
      });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 1 });
      expect(updateDraggerDatePosition).toHaveBeenCalled();
    });

    it('uses year scale complex path with non-leap year (daysCount=365)', () => {
      const updateDraggerDatePosition = jest.fn();
      // frontDate 2021, gridWidth=18: floor(48/18)=2 → add(2,'year') = 2023 (non-leap)
      renderComponent({
        updateDraggerDatePosition,
        timeScale: 'year',
        draggerSelected: 'selected',
        draggerPosition: 0,
        frontDate: '2021-01-01T00:00:00Z',
        draggerTimeState: '2022-06-01T00:00:00Z',
        backDate: '2030-12-31T00:00:00Z',
        timelineEndDateLimit: '2030-01-01T00:00:00Z',
      });
      mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 1 });
      expect(updateDraggerDatePosition).toHaveBeenCalled();
    });

    it('handles neither-year-nor-month scale with null scaleMs (implicit else, daysCount undefined)', () => {
      const updateDraggerDatePosition = jest.fn();
      renderComponent({
        updateDraggerDatePosition,
        timeScale: 'decade',
        draggerSelected: 'selected',
        draggerPosition: 0,
      });
      expect(() => {
        mockCapturedDraggers['selected'].handleDragDragger(null, { deltaX: 1 });
      }).not.toThrow();
      expect(updateDraggerDatePosition).toHaveBeenCalled();
    });
  });
});
