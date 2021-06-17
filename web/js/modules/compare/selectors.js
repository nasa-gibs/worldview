import {
  memoize as lodashMemoize,
} from 'lodash';
import { createSelector } from 'reselect';
import { getDates } from '../date/selectors';
import { getFormattedMonthAbbrevDates } from './util';

// eslint-disable-next-line import/prefer-default-export
export const memoizedDateMonthAbbrev = createSelector(
  [getDates],
  ({ selected, selectedB }) => lodashMemoize(() => getFormattedMonthAbbrevDates(selected, selectedB)),
);
