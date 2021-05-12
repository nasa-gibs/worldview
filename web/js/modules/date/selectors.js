export default function getSelectedDate (state, compareDateString) {
  const { date, compare } = state;
  if (compareDateString) {
    return date[compareDateString];
  }
  return date[compare.isCompareA ? 'selected' : 'selectedB'];
}
