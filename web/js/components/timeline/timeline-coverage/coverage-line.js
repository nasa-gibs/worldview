import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { formatDisplayDate } from '../../../modules/date/util';

/*
 * Coverage Line for DOM Element layer coverage.
 *
 * @class CoverageLine PureComponent
 */

class CoverageLine extends PureComponent {
  /**
  * @desc get formatted display dates for line tooltips and selectors
  * @param {String} lineType
  * @param {String} startDate date ISO string
  * @param {String} endDate date ISO string
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
      case 'SINGLE':
        dateRangeStart = (startDate && formatDisplayDate(new Date(startDate))) || 'Start';
        dateRangeEnd = (endDate && formatDisplayDate(new Date(endDate))) || 'Present';
        toolTipText = `${dateRangeStart} to ${dateRangeEnd}`;
        break;
      case 'MULTI':
        // handle minutes range display text (ex: '14:50 to 15:00')
        if (layerPeriod === 'minutes') {
          // eslint-disable-next-line prefer-destructuring
          dateRangeStart = startDate.split('T')[1];
          // eslint-disable-next-line prefer-destructuring
          dateRangeEnd = endDate.split('T')[1];
          toolTipText = `${dateRangeStart.split(':', 2).join(':')} to ${dateRangeEnd.split(':', 2).join(':')}`;
          dateRangeStart = dateRangeStart.replace(/[.:]/g, '_');
          dateRangeEnd = dateRangeEnd.replace(/[.:]/g, '_');
        } else {
          dateRangeStart = formatDisplayDate(new Date(startDate));
          dateRangeEnd = formatDisplayDate(new Date(endDate));
          toolTipText = `${dateRangeStart} to ${dateRangeEnd}`;
        }
        break;
    }

    return {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    };
  };

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
      positionTransformX,
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
      ? 'url(#coverage-line-pattern)'
      : 'url(#coverage-line-pattern-hidden)';

    // allow moving striped background for large width lines
    let rectTransform = leftOffset === 0 && isWidthGreaterThanRendered && !layerEndBeforeAxisBack
      ? positionTransformX
      : leftOffset;

    // determine line radius for line start/end vs. partial large width lines
    let lineRadius = !isWidthGreaterThanRendered
      || (leftOffset !== 0 && isWidthGreaterThanRendered)
      ? '6'
      : '0';

    // handle "false transform" line edge to simulate line movement for striped background
    if (leftOffset === 0
      && ((isWidthGreaterThanRendered && layerEndBeforeAxisBack)
      || (!isWidthGreaterThanRendered && layerStartBeforeAxisFront))) {
      lineWidth -= positionTransformX;
      rectTransform += positionTransformX;
      lineRadius = '6';
    }

    return (
      <g
        key={index}
        className="layer-coverage-line-group"
      >
        <rect
          id={`layer-coverage-line-${dateRangeStartEnd}`}
          className="layer-coverage-line"
          width={`${lineWidth}px`}
          height="12px"
          x="0"
          y="0"
          fill={patternType}
          rx={lineRadius}
          transform={`translate(${rectTransform})`}
        >
          <title>{toolTipText}</title>
        </rect>
      </g>
    );
  };

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
      <g clipPath="url(#coverageLineBoundary)">
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

CoverageLine.propTypes = {
  color: PropTypes.string,
  endDate: PropTypes.string,
  id: PropTypes.string,
  index: PropTypes.string,
  layerPeriod: PropTypes.string,
  lineType: PropTypes.string,
  options: PropTypes.object,
  positionTransformX: PropTypes.number,
  startDate: PropTypes.string,
};

export default CoverageLine;
