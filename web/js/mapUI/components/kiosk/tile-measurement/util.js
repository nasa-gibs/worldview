// Return an array of dates based on the period (daily or subdaily)
// Accepts redux selectedDate value and period
export function getDates(selectedDate, period) {
  if (period === 'daily'){
    return getDailyDates(selectedDate);
  } else {
    return getSubdailyDates(selectedDate);
  }
}

// Return an array of daily dates for the past 7 days
// Accepts redux selectedDate value
function getDailyDates (selectedDate) {
  const currentDate = new Date(selectedDate);
  const prevDates = [formatDailyDate(currentDate)]

  for (let i = 1; i < 7; i++) {
    const previousDate = new Date(currentDate)
    previousDate.setDate(previousDate.getDate() -i);
    prevDates.push(formatDailyDate(previousDate))
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
// Accepts redux selectedDate value
function getSubdailyDates (selectedDate) {
  const currentDate = new Date(selectedDate);
    // Round minutes down to nearest ten and seconds and milliseconds to zero
    currentDate.setMinutes(Math.floor(currentDate.getMinutes() / 10) * 10, 0, 0);
    const prevDates = [formatSubdailyDate(currentDate)];

    // Add 12 more dates in ten-minute intervals (for the past two hours)
    for (let i = 1; i <= 12; i++) {
      const previousDate = new Date(currentDate.getTime() - i * 10 * 60 * 1000); // subtracts i*10 minutes
      prevDates.push(formatSubdailyDate(previousDate));
    }
    return prevDates;
}

// format a single subdaily date
// accepts a date object
const formatSubdailyDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
}