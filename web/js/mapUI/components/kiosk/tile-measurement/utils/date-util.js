// Return an array of dates based on the period (daily or subdaily)
// Accepts redux selectedDate value and period
export function getDates(selectedDate, period) {
  if (period === 'daily') {
    return getDailyDates(selectedDate);
  }
  return getSubdailyDates(selectedDate);
}

// Return an array of daily dates for the past 7 days
// Accepts redux selectedDate value
function getDailyDates (selectedDate) {
  // Get the date as a string in UTC
  const utcDateString = selectedDate.toLocaleString('en-US', { timeZone: 'UTC' });
  // Convert the UTC string back to a Date object
  const currentDate = new Date(utcDateString);

  const prevDates = [formatDailyDate(currentDate)];

  for (let i = 1; i < 7; i += 1) {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - i);
    prevDates.push(formatDailyDate(previousDate));
  }
  return prevDates;
}

// format a single daily date
// Accepts a date object
function formatDailyDate (date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Return an array of subdaily dates for the past 2 hours in ten minute intervals
// The current date is rounded down to the nearest ten minutes
// Accepts redux selectedDate value
function getSubdailyDates (selectedDate) {
  // Get the date as a string in UTC
  const utcDateString = selectedDate.toLocaleString('en-US', { timeZone: 'UTC' });
  // Convert the UTC string back to a Date object
  let currentDate = new Date(utcDateString);

  // Subtract 30 minutes to start half an hour before the selectedDate
  // This is a performance improvement for EIC mode since most of the time, no full imagery is found in the first 30 minutes
  currentDate = new Date(currentDate.getTime() - 30 * 60 * 1000);

  // Round minutes down to nearest ten and seconds and milliseconds to zero
  currentDate.setMinutes(Math.floor(currentDate.getMinutes() / 10) * 10, 0, 0);
  const prevDates = [formatSubdailyDate(currentDate)];

  // Add 12 more dates in ten-minute intervals (for the past two hours)
  for (let i = 1; i <= 12; i += 1) {
    const previousDate = new Date(currentDate.getTime() - i * 10 * 60 * 1000); // subtracts i*10 minutes
    prevDates.push(formatSubdailyDate(previousDate));
  }
  return prevDates;
}

// format a single subdaily date
// accepts a date object
function formatSubdailyDate (date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
}

// Format a daily redux date to be used in the WMS request
export function formatReduxDailyDate(selectedDate) {
  const utcDateString = selectedDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Format a subdaily redux date rounded down to ten minute interval to be used in the WMS request
export function formatReduxSubdailyDate(selectedDate) {
  const utcDateString = selectedDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
}

export function arrayOfDateObjectsToDateStrings(dates, period) {
  if (period === 'daily') {
    return dates.map((date) => formatDailyDate(date));
  }
  return dates.map((date) => formatSubdailyDate(date));
}
