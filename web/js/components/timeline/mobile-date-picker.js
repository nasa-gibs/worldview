import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-mobile-datepicker';

import { getISODateFormatted } from './date-util';

// https://www.npmjs.com/package/react-mobile-datepicker
// configs for date order, caption, and date step
const defaultDateConfig = {
  year: {
    format: 'YYYY',
    caption: 'Year',
    step: 1,
  },
  month: {
    format: 'MM',
    caption: 'Month',
    step: 1,
  },
  date: {
    format: 'DD',
    caption: 'Day',
    step: 1,
  },
};

const subDailyDateConfig = {
  year: {
    format: 'YYYY',
    caption: 'Year',
    step: 1,
  },
  month: {
    format: 'MM',
    caption: 'Mon',
    step: 1,
  },
  date: {
    format: 'DD',
    caption: 'Day',
    step: 1,
  },
  hour: {
    format: 'hh',
    caption: 'Hour',
    step: 1,
  },
  minute: {
    format: 'mm',
    caption: 'Min',
    step: 1,
  },
};

class MobileDatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: '',
      minDate: '',
      maxDate: '',
      isOpen: false,
    };
  }

  handleClickDateButton = () => {
    this.setState({
      isOpen: true,
    });
  }

  handleCancel = () => {
    this.setState({
      isOpen: false,
    });
  }

  handleSelect = (time) => {
    this.setState({
      time,
      isOpen: false,
    });
    // convert date back to local time
    const date = this.convertToLocalDateObject(time);
    this.props.onDateChange(getISODateFormatted(date));
  }

  // used for init mount
  setInitDates = () => {
    const {
      date,
      startDateLimit,
      endDateLimit,
    } = this.props;
    this.setState({
      time: this.convertToUTCDateObject(date),
      minDate: this.convertToUTCDateObject(startDateLimit),
      maxDate: this.convertToUTCDateObject(endDateLimit),
    });
  }

  // change to UTC offset time for date picker controls
  convertToUTCDateObject = (dateString) => {
    const date = new Date(dateString);
    const dateUTC = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return dateUTC;
  }

  // change to offset time used in parent component date setting functions
  convertToLocalDateObject = (date) => {
    const dateLocal = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return dateLocal;
  }

  componentDidMount() {
    this.setInitDates();
  }

  componentDidUpdate(prevProps) {
    const { date, endDateLimit } = this.props;
    // update on new endDateLimit or changed date
    if (prevProps.endDateLimit !== endDateLimit || prevProps.date !== date) {
      this.setInitDates();
    }
  }

  render() {
    const {
      time,
      minDate,
      maxDate,
      isOpen,
    } = this.state;
    const {
      date,
      hasSubdailyLayers,
    } = this.props;
    // display date as '2000-10-28' for default or '2000-10-28 20:28Z' for subdaily
    const displayDate = hasSubdailyLayers ? `${date.split('T').join(' ').split(':', 2).join(':')}Z` : date.split('T')[0];
    return (
      time
        ? (
          <>
            <div
              className="mobile-date-picker-select-btn"
              onClick={this.handleClickDateButton}
            >
              {displayDate}
            </div>
            <DatePicker
              dateConfig={hasSubdailyLayers ? subDailyDateConfig : defaultDateConfig}
              showCaption
              theme="android-dark"
              headerFormat={hasSubdailyLayers ? 'YYYY-MM-DD hh:mmZ' : 'YYYY-MM-DD'}
              confirmText="OK"
              cancelText="CANCEL"
              min={minDate}
              max={maxDate}
              value={time}
              isOpen={isOpen}
              onSelect={this.handleSelect}
              onCancel={this.handleCancel}
            />
          </>
        )
        : null
    );
  }
}

MobileDatePicker.propTypes = {
  date: PropTypes.string,
  endDateLimit: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  onDateChange: PropTypes.func,
  startDateLimit: PropTypes.string,
};

export default MobileDatePicker;
