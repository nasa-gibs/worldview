
import moment from 'moment';

// const pastDateLimit = '1940-01-01T00:00:00.000';
// const futureDateLimit = '2020-01-01T00:00:00.000';
const pastDateLimit = moment.utc('1940-01-01T00:00:00.000');
const futureDateLimit = moment.utc('2020-01-01T00:00:00.000');

const timeScaleOptions = {
  'minute': {
    timeAxis: {
      scale: 'minute',
      format: 'HH:mm'
    }
  },
  'hour': {
    timeAxis: {
      scale: 'hour',
      // format: 'DD-HH-mm:ss',
      format: 'MMM D'
    }
  },
  'day': {
    timeAxis: {
      scale: 'day',
      // format: 'MM-DD-HH-mm:ss-YYYY',
      format: 'MMM YYYY'
    }
  },
  'month': {
    timeAxis: {
      scale: 'month',
      format: 'YYYY'
    }
  },
  'year': {
    timeAxis: {
      scale: 'year',
      format: 'YYYY'
    }
  }
};

export default (function (self) {
  self.getTimeRange = (startDate, endDate, timeScale) => {
    // const startTime = performance.now();
    let dates = [];
    let { format } = timeScaleOptions[timeScale].timeAxis;
    let currentDate = moment.utc(new Date()).add(1, timeScale);

// endDate = endDate.isAfter(currentDate) ? currentDate : endDate;
// console.log(endDate.format(), currentDate.format)
    while (startDate <= endDate) {
      let date = startDate.format(format);
      let rawDate = startDate.format();
      let nextDate = startDate.clone().add(1, timeScale);
      let rawNextDate = nextDate.format();

      // # EXPENSIVE IN BETWEEN FOR LARGE NUMBERS - removing cuts function time down some, but may be neglible - main focus is smaller total request size
      let withinRange = startDate.isBetween(pastDateLimit, currentDate.format(), null, '[]');

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
    // const duration = performance.now() - startTime;
    // console.log(`87 someMethodIThinkMightBeSlow took ${duration}ms`);

    return timeRange;
  };

  return self;
})({});
