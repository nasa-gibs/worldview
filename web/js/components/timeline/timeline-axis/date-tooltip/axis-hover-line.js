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
      draggerSelected,
      draggerPosition,
      draggerPositionB,
      isDataCoveragePanelOpen,
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
    const panelDraggerHoverLine = isDataCoveragePanelOpen && isNoBlockingDragging && isDraggerDragging;
    const shouldDisplayHoverLine = showHover || panelDraggerHoverLine;

    // init normal (no data coverage panel) line heights (svg container, inner line)
    let lineHeight = 63;
    let lineHeightInner = 63;
    let linePosition = hoverLinePosition;

    const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
      ? layer.startDate
      : layer.startDate && layer.visible));

    // handle active layer count dependent tooltip height
    if (isDataCoveragePanelOpen) {
      lineHeight = 111;
      const addHeight = Math.min(layers.length, 5) * 40;
      lineHeight += addHeight;
      lineHeightInner = lineHeight;
    }

    // hoverline positioning based on dragger position
    if (panelDraggerHoverLine) {
      const selectedDraggerPosition = draggerSelected === 'selected'
        ? draggerPosition
        : draggerPositionB;
      linePosition = selectedDraggerPosition + 47;
      // lineheight for dragger
      const minusY1Height = Math.min(layers.length, 5) * 40.5;
      lineHeightInner = 40.5 + minusY1Height;
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
            transform={`translate(${linePosition + 1}, 0)`}
          />
        </svg>
      )
    );
  }
}

AxisHoverLine.propTypes = {
  activeLayers: PropTypes.array,
  axisWidth: PropTypes.number,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  hoverLinePosition: PropTypes.number,
  isAnimationDraggerDragging: PropTypes.bool,
  isDataCoveragePanelOpen: PropTypes.bool,
  isDraggerDragging: PropTypes.bool,
  isTimelineDragging: PropTypes.bool,
  shouldIncludeHiddenLayers: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default AxisHoverLine;
