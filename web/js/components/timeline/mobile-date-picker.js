import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-mobile-datepicker';
import { getDisplayDate, getISODateFormatted } from './date-util';
import { MONTH_STRING_ARRAY } from '../../modules/date/constants';

// https://www.npmjs.com/package/react-mobile-datepicker
// configs for date order, caption, and date step
const defaultDateConfig = {
  year: {
    format: 'YYYY',
    caption: 'Year',
    step: 1,
  },
  month: {
    format: (value) => MONTH_STRING_ARRAY[value.getMonth()],
    caption: 'Mon',
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
    format: (value) => MONTH_STRING_ARRAY[value.getMonth()],
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

  handleClickDateButton = () => {
    this.setState({
      isOpen: true,
    });
  };

  handleCancel = () => {
    const {
      date,
    } = this.props;
    this.setState({
      isOpen: false,
      time: this.convertToUTCDateObject(date),
    });
  };

  handleChange = (date) => {
    this.setState({
      time: date,
    });
  };

  handleSelect = (time) => {
    const { onDateChange } = this.props;
    this.setState({
      isOpen: false,
      time,
    });
    // convert date back to local time
    const date = this.convertToLocalDateObject(time);
    onDateChange(getISODateFormatted(date));
  };

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
  };

  // change to UTC offset time for date picker controls
  convertToUTCDateObject = (dateString) => {
    const date = new Date(dateString);
    const dateUTC = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return dateUTC;
  };

  // change to offset time used in parent component date setting functions
  convertToLocalDateObject = (date) => {
    const dateLocal = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return dateLocal;
  };

  getHeaderTime = (time, isSubdaily) => (
    <div className="datepicker-header">
      {getDisplayDate(new Date(this.convertToLocalDateObject(time)), isSubdaily)}
    </div>
  );

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
    const displayDate = getDisplayDate(date, hasSubdailyLayers);

    return (
      time && (
        <>
          <div
            className="mobile-date-picker-select-btn"
            onClick={this.handleClickDateButton}
          >
            <div className="mobile-date-picker-select-btn-text">
              <span>{displayDate}</span>
            </div>
          </div>
          <DatePicker
            dateConfig={hasSubdailyLayers ? subDailyDateConfig : defaultDateConfig}
            showCaption
            theme="android-dark"
            customHeader={this.getHeaderTime(time, hasSubdailyLayers)}
            confirmText="OK"
            cancelText="CANCEL"
            min={minDate}
            max={maxDate}
            value={time}
            isOpen={isOpen}
            onCancel={this.handleCancel}
            onChange={this.handleChange}
            onSelect={this.handleSelect}
          />
        </>
      )
    );
  }
}

MobileDatePicker.propTypes = {
  date: PropTypes.object,
  endDateLimit: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  onDateChange: PropTypes.func,
  startDateLimit: PropTypes.string,
};

export default MobileDatePicker;
