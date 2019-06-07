// return boolean based on is dateChecking is between front and back dates
export const getIsBetween = (date, frontDate, backDate) => {
  let dateValue = new Date(date).getTime();
  let frontDateValue = new Date(frontDate).getTime();
  let backDateValue = new Date(backDate).getTime();

  return dateValue >= frontDateValue && dateValue <= backDateValue;
};

// return day number of given UTC string date
export const getDaysInYear = (date) => {
  var dateObj = new Date(date);
  var start = new Date(dateObj.getUTCFullYear(), 0, 0);
  var diff = (dateObj - start) + ((start.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(diff / 86400000);
};

// return string in ISO format "2018-03-16T06:17:30Z"
export const getISODateFormatted = (date) => {
  return new Date(date).toISOString().split('.')[0] + 'Z';
};
