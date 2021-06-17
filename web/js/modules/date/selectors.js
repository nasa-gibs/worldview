export function getDates (state) {
  const { date } = state;
  const { selected, selectedB } = date;
  return { selected, selectedB };
}

export function getSelectedDate (state, compareDateString) {
  const { date, compare } = state;
  if (compareDateString) {
    return date[compareDateString];
  }
  return date[compare.isCompareA ? 'selected' : 'selectedB'];
}
