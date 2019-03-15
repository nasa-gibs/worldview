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

  // shouldComponentUpdate(nextProps, nextState) {
  //   // console.log(nextProps.timeScale, nextState.timeScale, this.state.timeScale)
  //   // if (this.state.timeScale !== nextState.timeScale) {
  //   //   console.log('update')
  //   //   return true;
  //   // }
  //   // return false;
  //   return true;
  // }

  componentDidUpdate() {
    // console.log('update')
  }

  render() {
    // ZOOM LEVELS:
    // 1-YEAR,  2-MONTH,  3-DAY,  4-MINUTE,  5-DAY??
    // console.log(this.props, new Date())
    // let selectedDate = this.props.selectedDate;
    let mockDateSelectorProps = {
      date: new Date(this.props.selectedDate),
      fontSize: null,
      height: '30',
      id: 'main-TEST',
      idSuffix: 'animation-widget-main',
      maxDate: new Date('2020-01-01T00:00:00.000'),
      maxZoom: 5, // 3 === DAY, 5 TRIGGERS CONDITIONAL TO SHOW SUBDAILY
      minDate: new Date('1940-01-01T00:00:00.000'),
      onDateChange: this.props.dateChange,
      width: '120'
    }


// const pastDateLimit = moment.utc('1940-01-01T00:00:00.000');
// const futureDateLimit = moment.utc('2020-01-01T00:00:00.000');

    // console.log(this.props.selectedDate)
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
