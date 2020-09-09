export default function getSelectedDate ({ date, compare }) {
  return date[
    compare.isCompareA ? 'selected' : 'selectedB'
  ];
}
