/* eslint-disable import/prefer-default-export */
// formats date for kiosk mode and updates to EST
export function formatKioskDate(date, subdaily) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const dateParts = formatter.formatToParts(date);

  const year = dateParts.find((part) => part.type === 'year').value;
  const month = dateParts.find((part) => part.type === 'month').value.slice(0, 3);
  const day = dateParts.find((part) => part.type === 'day').value;
  const hours = dateParts.find((part) => part.type === 'hour').value;
  const minutes = dateParts.find((part) => part.type === 'minute').value;

  const formattedDate = subdaily ? `${day} ${month} ${year} ${hours}:${minutes}:00 EDT` : `${day} ${month} ${year}`;

  return formattedDate;
}
