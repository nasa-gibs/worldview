import { defaultState, animationReducer } from './reducers';
import * as CONSTANTS from './constants';
import util from '../../util/util';
const now = new Date();
const then = util.dateAdd(now, 'day', -7);

test('OPEN_ANIMATION action updates start and end s', () => {
  const response = animationReducer(defaultState, {
    type: CONSTANTS.OPEN_ANIMATION,
    date: now
  });
  expect(response.startDate).toEqual(then);
  expect(response.endDate).toEqual(now);
  expect(response.isActive).toEqual(true);
});
