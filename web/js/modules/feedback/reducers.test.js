import { assign as lodashAssign } from 'lodash';
import { INIT_FEEDBACK } from './constants';
import feedbackReducer from './reducers';

describe('feedbackReducer', () => {
  it('should return the initial state', () => {
    const expected = feedbackReducer(undefined, {});
    expect(expected).toEqual({
      isInitiated: false,
    });
  });

  it('should handle INIT_FEEDBACK', () => {
    const expected = feedbackReducer(undefined, {
      type: INIT_FEEDBACK,
    });
    expect(expected).toEqual(lodashAssign({}, {
      isInitiated: false,
    }, {
      isInitiated: true,
    }));
  });
});
