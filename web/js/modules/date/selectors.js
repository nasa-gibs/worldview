import util from '../../util/util';

export function addDate(interval, amount, activeDate) {
  return util.dateAdd(activeDate, interval, amount);
}
