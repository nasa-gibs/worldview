import { createSelector } from '@reduxjs/toolkit';
import { getDates } from '../date/selectors';
import { getFormattedMonthAbbrevDates } from './util';

export const getCompareDates = createSelector(
  [getDates],
  ({ selected, selectedB }) => getFormattedMonthAbbrevDates(selected, selectedB)
);
