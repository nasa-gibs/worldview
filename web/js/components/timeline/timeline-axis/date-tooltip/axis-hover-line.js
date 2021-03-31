import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * AxisHoverLine for axis hover
 *
 * @class AxisHoverLine
 * @extends PureComponent
 */
class AxisHoverLine extends PureComponent {
  render() {
    const {
      activeLayers,
      axisWidth,
      selectedDraggerPosition,
      isTimelineLayerCoveragePanelOpen,
      isDraggerDragging,
      isTimelineDragging,
      isAnimationDraggerDragging,
      showHoverLine,
      shouldIncludeHiddenLayers,
      hoverLinePosition,
    } = this.props;
    // check for timeline/animation dragging and showhover handled by parent
    const isNoBlockingDragging = !isTimelineDragging && !isAnimationDraggerDragging;
    const showHover = isNoBlockingDragging && showHoverLine;
    const panelDraggerHoverLine = isTimelineLayerCoveragePanelOpen && isNoBlockingDragging && isDraggerDragging;
    const shouldDisplayHoverLine = showHover || panelDraggerHoverLine;

    // init normal (no data coverage panel) line heights (svg container, inner line)
    let lineHeight = 63;
    let lineHeightInner = 63;
    let linePosition = hoverLinePosition;

    const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
      ? layer.startDate
      : layer.startDate && layer.visible));

    const layerLengthCoef = Math.max(layers.length, 1);
    // handle active layer count dependent tooltip height
    if (isTimelineLayerCoveragePanelOpen) {
      lineHeight = 112;
      const addHeight = Math.min(layerLengthCoef, 5) * 40;
      lineHeight += addHeight;
      lineHeightInner = lineHeight;
    }

    // hoverline positioning based on dragger position
    if (panelDraggerHoverLine) {
      linePosition = selectedDraggerPosition + 47;
      // lineHeight for dragger
      const minusY1Height = Math.min(layerLengthCoef, 5) * 40.5;
      lineHeightInner = 47 + minusY1Height;
    }

    return (
      shouldDisplayHoverLine && (
        <svg
          className="axis-hover-line-container"
          width={axisWidth}
          height={lineHeight}
          style={{ zIndex: 6 }}
        >
          <line
            className="axis-hover-line"
            stroke="#0f51c0"
            strokeWidth="2"
            x1="0"
            x2="0"
            y1="0"
            y2={lineHeightInner}
            transform={`translate(${linePosition + 1})`}
          />
        </svg>
      )
    );
  }
}

AxisHoverLine.propTypes = {
  activeLayers: PropTypes.array,
  axisWidth: PropTypes.number,
  hoverLinePosition: PropTypes.number,
  isAnimationDraggerDragging: PropTypes.bool,
  isTimelineLayerCoveragePanelOpen: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  selectedDraggerPosition: PropTypes.number,
  shouldIncludeHiddenLayers: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default AxisHoverLine;
