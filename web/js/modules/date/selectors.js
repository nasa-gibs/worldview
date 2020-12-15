// eslint-disable-next-line import/prefer-default-export
export function getSelectedDate ({ date, compare }) {
  return date[
    compare.isCompareA ? 'selected' : 'selectedB'
  ];
}
