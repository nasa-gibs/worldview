import d3 from 'd3';
export function timelineDataHightlight(layerId, isActivate) {
  if (isActivate) {
    d3.select(
      '#timeline-footer svg g.plot rect[data-layer="' + layerId + '"]'
    ).classed('data-bar-hovered', true);
  } else {
    d3.select(
      '#timeline-footer svg g.plot rect[data-layer="' + layerId + '"]'
    ).classed('data-bar-hovered', false);
  }
}
