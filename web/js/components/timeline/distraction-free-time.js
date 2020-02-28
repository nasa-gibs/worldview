import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';

class DistractionFreeTimeUI extends PureComponent {
  handleMouseOver = () => {
    this.props.hoverOverDistractionFreeTimeUI(true);
  }

  render() {
    const { date, hasSubdailyLayers, isHoverOverDistractionFreeTimeUI } = this.props;

    // get month as string (e.g., 2 -> 'FEB')
    const monthNumber = new Date(date).getUTCMonth();
    const monthString = util.monthStringArray[monthNumber];

    // split date first YMD and second HR (subdaily)
    const dateSplit = date.split('T');
    const dateFirstHalfYMD = dateSplit[0].split('-');
    const dateSecondHalfHM = dateSplit[1].split(':', 2).join(':');

    // update month to use string
    dateFirstHalfYMD[1] = monthString;

    // display date as '2000-10-28' for default or '2000-10-28 20:28Z' for subdaily
    let displayDate;
    if (hasSubdailyLayers) {
      displayDate = dateFirstHalfYMD.join(' ') + ' ' + dateSecondHalfHM;
    } else {
      displayDate = dateFirstHalfYMD.join(' ');
    }

    return (
      <div
        className="distraction-free-date"
        style={{
          opacity: isHoverOverDistractionFreeTimeUI ? '0' : '1'
        }}
        onMouseOver={this.handleMouseOver}
      >
        {displayDate}
      </div>
    );
  }
}

DistractionFreeTimeUI.propTypes = {
  date: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  hoverOverDistractionFreeTimeUI: PropTypes.func,
  isHoverOverDistractionFreeTimeUI: PropTypes.bool
};

export default DistractionFreeTimeUI;
