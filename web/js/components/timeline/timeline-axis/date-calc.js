
import moment from 'moment';
import { timeScaleOptions } from '../../../modules/date/constants';

// get range of times based on start/end dates and timescale
export function getTimeRange(startDate, endDate, timeScale, timelineStartDateLimit, timelineEndDateLimit) {
  let dates = [];
  let { format } = timeScaleOptions[timeScale].timeAxis;
  let startDateLimit = moment.utc(timelineStartDateLimit);
  let endDateLimit = moment.utc(timelineEndDateLimit);

  while (startDate <= endDate) {
    let date = startDate.format(format);
    let rawDate = startDate.format();
    let nextDate = startDate.clone().add(1, timeScale);
    let rawNextDate = nextDate.format();

    let withinRange = startDate.isBetween(startDateLimit, endDateLimit, null, '[]');

    let timeObject = {
      dateObject: startDate.toObject(),
      date: date.toUpperCase(),
      dayOfWeek: startDate.day(),
      rawDate: rawDate,
      rawNextDate: rawNextDate,
      timeScale: timeScale,
      withinRange: withinRange
    };
    dates.push(timeObject);
    startDate = nextDate;
  }
  let timeRange = {
    dates: dates
  };

  return timeRange;
};
