import { render } from '@testing-library/react';
import AxisHoverLine from './axis-hover-line';

const layers = [
  { startDate: '2020-01-01', visible: true },
  { startDate: '2020-01-01', visible: false },
  { startDate: null, visible: true },
];

function renderLine(props = {}) {
  return render(
    <AxisHoverLine
      activeLayers={props.activeLayers || layers}
      axisWidth={props.axisWidth ?? 1000}
      hoverLinePosition={props.hoverLinePosition ?? 200}
      selectedDraggerPosition={props.selectedDraggerPosition ?? 100}
      isAnimationDraggerDragging={props.isAnimationDraggerDragging || false}
      isTimelineDragging={props.isTimelineDragging || false}
      isDraggerDragging={props.isDraggerDragging || false}
      isTimelineLayerCoveragePanelOpen={props.isTimelineLayerCoveragePanelOpen || false}
      showHoverLine={props.showHoverLine || false}
      shouldIncludeHiddenLayers={props.shouldIncludeHiddenLayers || false}
    />,
  );
}

describe('AxisHoverLine', () => {
  it('renders nothing when there is nothing to display', () => {
    const { container } = renderLine({ showHoverLine: false });
    expect(container.querySelector('.axis-hover-line-container')).toBeNull();
  });

  it('renders the hover line when showHoverLine is set and nothing is blocking', () => {
    const { container } = renderLine({ showHoverLine: true });
    const svg = container.querySelector('.axis-hover-line-container');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('1000');
    expect(svg.getAttribute('height')).toBe('63');
  });

  it('positions the inner line at the hover position', () => {
    const { container } = renderLine({ showHoverLine: true, hoverLinePosition: 200 });
    const line = container.querySelector('.axis-hover-line');
    expect(line.getAttribute('transform')).toBe('translate(201)');
    expect(line.getAttribute('y2')).toBe('63');
  });

  it('does not display while the timeline is being dragged', () => {
    const { container } = renderLine({ showHoverLine: true, isTimelineDragging: true });
    expect(container.querySelector('.axis-hover-line-container')).toBeNull();
  });

  it('does not display while the animation dragger is being dragged', () => {
    const { container } = renderLine({ showHoverLine: true, isAnimationDraggerDragging: true });
    expect(container.querySelector('.axis-hover-line-container')).toBeNull();
  });

  it('increases line height based on visible layer count when the coverage panel is open', () => {
    // two visible layers with startDate -> layerLengthCoef 2 -> 112 + 80 = 192
    const { container } = renderLine({
      showHoverLine: true,
      isTimelineLayerCoveragePanelOpen: true,
      activeLayers: [
        { startDate: '2020-01-01', visible: true },
        { startDate: '2020-01-01', visible: true },
      ],
    });
    const svg = container.querySelector('.axis-hover-line-container');
    expect(svg.getAttribute('height')).toBe('192');
  });

  it('counts hidden layers when shouldIncludeHiddenLayers is set', () => {
    // two layers have startDate (regardless of visibility) -> coef 2 -> 192
    const { container } = renderLine({
      showHoverLine: true,
      isTimelineLayerCoveragePanelOpen: true,
      shouldIncludeHiddenLayers: true,
    });
    const svg = container.querySelector('.axis-hover-line-container');
    expect(svg.getAttribute('height')).toBe('192');
  });

  it('displays the dragger hover line in the coverage panel even without showHoverLine', () => {
    const { container } = renderLine({
      showHoverLine: false,
      isTimelineLayerCoveragePanelOpen: true,
      isDraggerDragging: true,
      selectedDraggerPosition: 100,
      activeLayers: [
        { startDate: '2020-01-01', visible: true },
        { startDate: '2020-01-01', visible: true },
      ],
    });
    const line = container.querySelector('.axis-hover-line');
    expect(line).toBeTruthy();
    // linePosition = selectedDraggerPosition + 47 = 147; transform translate(148)
    expect(line.getAttribute('transform')).toBe('translate(148)');
    // lineHeightInner = 47 + min(2,5)*40.5 = 47 + 81 = 128
    expect(line.getAttribute('y2')).toBe('128');
  });

  it('uses a minimum layer coefficient of 1 when there are no qualifying layers', () => {
    const { container } = renderLine({
      showHoverLine: true,
      isTimelineLayerCoveragePanelOpen: true,
      activeLayers: [{ startDate: null, visible: false }],
    });
    const svg = container.querySelector('.axis-hover-line-container');
    // 112 + min(1,5)*40 = 152
    expect(svg.getAttribute('height')).toBe('152');
  });
});
