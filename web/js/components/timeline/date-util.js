// return boolean based on is dateChecking is between front and back dates
export const getIsBetween = (date, frontDate, backDate) => {
  const dateValue = new Date(date).getTime();
  const frontDateValue = new Date(frontDate).getTime();
  const backDateValue = new Date(backDate).getTime();
  return dateValue >= frontDateValue && dateValue <= backDateValue;
};

// return day number of given UTC string date
export const getDaysInYear = (date) => {
  const dateObj = new Date(date);
  const start = new Date(dateObj.getUTCFullYear(), 0, 0);
  const diff = (dateObj - start) + (start.getTimezoneOffset() * 60 * 1000);
  return Math.floor(diff / 86400000);
};

// return string in ISO format "2018-03-16T06:17:30Z"
export const getISODateFormatted = (date) => `${new Date(date).toISOString().split('.')[0]}Z`;

// timeRange extension to pop NUM times
export const removeBackMultipleInPlace = (timeRange, num) => {
  for (let i = 0; i < num; i++) {
    timeRange.pop();
  }
};

// timeRange extension to shift NUM times
export const removeFrontMultipleInPlace = (timeRange, num) => {
  for (let i = 0; i < num; i++) {
    timeRange.shift();
  }
};
