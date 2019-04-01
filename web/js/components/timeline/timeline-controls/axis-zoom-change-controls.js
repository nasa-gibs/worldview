import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import util from '../../util/util';
import AxisZoomChangeTooltip from './axis-zoom-change-tooltip';

/*
 * A react component, is a draggable svg
 * group. It is a parent component that
 * rerenders when child elements are dragged
 *
 * @class TimelineRangeSelector
 */
class AxisZoomChangeControls extends PureComponent {
  onClickUp = () => {
    this.props.incrementZoomLevel();
  }

  onClickDown = () => {
    this.props.decrementZoomLevel();
  }
  render() {
    return (
      <div className="zoom-level-change-arrows">
        <div
          onClick={this.onClickUp}
          className="date-arrows date-arrow-up"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="uparrow" />
          </svg>
        </div>
        <AxisZoomChangeTooltip
          zoomLevel={this.props.zoomLevel}
          toolTipHovered={this.props.toolTipHovered}
          changeZoomLevel={this.props.changeZoomLevel}
          hasSubdailyLayers={this.props.hasSubdailyLayers}
        />
        <div
          onClick={this.onClickDown}
          className="date-arrows date-arrow-down"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="downarrow" />
          </svg>
        </div>
      </div>

    );
  }
}

// AxisZoomChangeControls.propTypes = {
//   value: PropTypes.node,
//   focused: PropTypes.bool,
//   tabIndex: PropTypes.number,
//   step: PropTypes.number,
//   type: PropTypes.string,
//   updateDate: PropTypes.func,
//   date: PropTypes.object,
//   minDate: PropTypes.object,
//   maxDate: PropTypes.object,
//   maxZoom: PropTypes.number,
//   blur: PropTypes.func,
//   setFocusedTab: PropTypes.func,
//   changeTab: PropTypes.func,
//   height: PropTypes.string,
//   inputId: PropTypes.string,
//   fontSize: PropTypes.number
// };

export default AxisZoomChangeControls;
