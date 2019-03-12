import React from 'react';
import PropTypes from 'prop-types';

import DateSelector from '../../date-selector/date-selector';
import DateZoomChange from './date-zoom-change';
import DateChangeArrows from './date-change-arrows';

class DateChangeControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    // ZOOM LEVELS:
    // 1-YEAR,  2-MONTH,  3-DAY,  4-MINUTE,  5-DAY??
    let mockDateSelectorProps = {
      date: new Date(),
      fontSize: null,
      height: '30',
      id: 'main',
      idSuffix: 'animation-widget-main',
      maxDate: new Date('2019-04-01'),
      maxZoom: 5, // 3 === DAY, 5 TRIGGERS CONDITIONAL TO SHOW SUBDAILY
      minDate: new Date('1947-02-01'),
      onDateChange: (date) => console.log('mock', date),
      width: '120'
    }
    return (
      <div>
        <DateSelector
          {...mockDateSelectorProps}
        />
        <DateZoomChange />
        <DateChangeArrows />

        {/* animation button */}
        {/* <div
          className="button-action-group animate-button"
          id="animate-button"
          title="Set up animation"
        >
          <i id="wv-animate" className="fas fa-video wv-animate" />
        </div> */}
      </div>
    );
  }
}
// Timeline.defaultProps = {
// };
// Timeline.propTypes = {
//   width: PropTypes.number,
//   drawContainers: PropTypes.func,
//   changeDate: PropTypes.func,
//   selectedDate: PropTypes.instanceOf(Date)
// };

export default DateChangeControls;
