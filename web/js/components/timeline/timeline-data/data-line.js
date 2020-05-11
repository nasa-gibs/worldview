import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

/*
 * Data Line for DOM Element layer data coverage.
 *
 * @class DataLine
 */

class DataLine extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  /**
  * @desc get formatted display dates for line tooltips and selectors
  * @param {String} lineType
  * @param {Object} startDate date
  * @param {Object} endDate date
  * @param {String} layerPeriod
  * @returns {Object}
  *   @param {String} dateRangeStart
  *   @param {String} dateRangeEnd
  *   @param {String} toolTipText
  */
  getFormattedDisplayDates = (lineType, startDate, endDate, layerPeriod) => {
    let dateRangeStart;
    let dateRangeEnd;
    let toolTipText;

    // eslint-disable-next-line default-case
    switch (lineType) {
      case 'CONTAINER':
        dateRangeStart = (startDate && startDate.toISOString().split('T')[0]) || 'start';
        dateRangeEnd = (endDate && endDate.toISOString().split('T')[0]) || 'present';
        toolTipText = `${dateRangeStart} to ${dateRangeEnd}`;
        break;
      case 'MULTI':
        // handle minutes range display text (ex: '14:50 to 15:00')
        if (layerPeriod === 'minutes') {
          // eslint-disable-next-line prefer-destructuring
          dateRangeStart = startDate.toISOString().split('T')[1];
          // eslint-disable-next-line prefer-destructuring
          dateRangeEnd = endDate.toISOString().split('T')[1];
          toolTipText = `${dateRangeStart.split(':', 2).join(':')} to ${dateRangeEnd.split(':', 2).join(':')}`;
          dateRangeStart = dateRangeStart.replace(/[.:]/g, '_');
          dateRangeEnd = dateRangeEnd.replace(/[.:]/g, '_');
        } else {
          dateRangeStart = startDate.toISOString().replace(/[.:]/g, '_');
          dateRangeEnd = endDate.toISOString().replace(/[.:]/g, '_');
          toolTipText = `${dateRangeStart.split('T')[0]} to ${dateRangeEnd.split('T')[0]}`;
        }
        break;
    }

    return {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    };
  }

  /**
  * @desc get line DOM element from full/partial (interval) date range with tooltip
  * @param {String} id
  * @param {Object} options
  * @param {String} lineType
  * @param {String} dateRangeStart
  * @param {String} dateRangeEnd
  * @param {String} color
  * @param {String} layerPeriod
  * @param {Number/String} index
  * @returns {DOM Element} line
  */
  createMatchingCoverageLineDOMEl = (id, options, lineType, startDate, endDate, color, layerPeriod, index) => {
    const {
      position,
      transformX,
      hoverOnToolTip,
      hoverOffToolTip,
      hoveredTooltip,
    } = this.props;
    const {
      leftOffset,
      isWidthGreaterThanRendered,
      width,
      layerStartBeforeAxisFront,
      layerEndBeforeAxisBack,
    } = options;
    let lineWidth = Math.max(width, 0);

    // get formatted dates based on line type
    const {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    } = this.getFormattedDisplayDates(lineType, startDate, endDate, layerPeriod);
    const dateRangeStartEnd = `${id}-${dateRangeStart}-${dateRangeEnd}`;

    // candy stripe color
    const patternType = color === 'rgb(0, 69, 123)'
      ? 'url(#pattern)'
      : 'url(#pattern2)';

    // allow moving striped background for large width lines
    let rectTransform = leftOffset === 0 && isWidthGreaterThanRendered && !layerEndBeforeAxisBack
      ? position + transformX
      : leftOffset;

    // determine line radius for line start/end vs. partial large width lines
    let lineRadius = !isWidthGreaterThanRendered
      || (leftOffset !== 0 && isWidthGreaterThanRendered)
      ? '6'
      : '0';

    // handle "false transform" line edge to simulate line movement for striped background
    if (leftOffset === 0 && isWidthGreaterThanRendered && layerEndBeforeAxisBack) {
      lineWidth -= position + transformX;
      rectTransform += position + transformX;
      lineRadius = '6';
    }

    return (
      <g
        key={index}
        className="data-panel-coverage-line-container"
      >
        <rect
          id={`data-coverage-line-${dateRangeStartEnd}`}
          className="data-panel-coverage-line"
          onMouseEnter={() => hoverOnToolTip(`${dateRangeStartEnd}`)}
          onMouseLeave={() => hoverOffToolTip()}
          width={`${lineWidth}px`}
          fill={patternType}
          rx={lineRadius}
          style={{
            transform: `translate(${rectTransform}px, 0)`,
          }}
        >
          <Tooltip
            isOpen={hoveredTooltip[`${dateRangeStartEnd}`]}
            target={`data-coverage-line-${dateRangeStartEnd}`}
          >
            {toolTipText}
          </Tooltip>
        </rect>
      </g>
    );
  }

  render() {
    const {
      id,
      options,
      lineType,
      startDate,
      endDate,
      color,
      layerPeriod,
      index,
    } = this.props;
    return (
      <g clipPath="url(#dataLineBoundary)">
        {this.createMatchingCoverageLineDOMEl(
          id,
          options,
          lineType,
          startDate,
          endDate,
          color,
          layerPeriod,
          index,
        )}
      </g>
    );
  }
}

DataLine.propTypes = {
  hoverOnToolTip: PropTypes.func,
  hoverOffToolTip: PropTypes.func,
  hoveredTooltip: PropTypes.object,
  axisWidth: PropTypes.number,
  position: PropTypes.number,
  transformX: PropTypes.number,
  id: PropTypes.string,
  options: PropTypes.object,
  lineType: PropTypes.string,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  color: PropTypes.string,
  layerPeriod: PropTypes.string,
  index: PropTypes.string,
};

export default DataLine;
