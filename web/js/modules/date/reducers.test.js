import {
  dateReducer,
  dateReducerState,
} from './reducers';
import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW,
} from './constants';
import util from '../../util/util';

// test variables
const mockDate = util.now();
const selectedZoom = 2;

describe('dateReducer', () => {
  test('should return the initial state [date-reducer-initial-state]', () => {
    expect(dateReducer(undefined, {})).toEqual(
      dateReducerState,
    );
  });
  test(
    `${CHANGE_TIME_SCALE
    }action type and ${selectedZoom} as selectedZoom `
      + 'should return new state [date-reducer-time-scale]',
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: CHANGE_TIME_SCALE,
          value: selectedZoom,
        }),
      ).toEqual({
        ...dateReducerState,
        selectedZoom,
      });
    },
  );
  test(
    `${CHANGE_CUSTOM_INTERVAL
    }action type and 4 as customInterval and 10 as customDelta `
      + 'should return new state [date-reducer-custom-interval]',
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: CHANGE_CUSTOM_INTERVAL,
          interval: 4,
          delta: 10,
        }),
      ).toEqual({
        ...dateReducerState,
        customInterval: 4,
        customDelta: 10,
        customSelected: true,
      });
    },
  );
  test(
    `${CHANGE_INTERVAL
    }action type and 1 as delta and 2 as interval `
      + 'should return new state [date-reducer-interval]',
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: CHANGE_INTERVAL,
          interval: 2,
          delta: 1,
          customSelected: false,
        }),
      ).toEqual({
        ...dateReducerState,
        interval: 2,
        delta: 1,
        customSelected: false,
      });
    },
  );
  test(
    `${SELECT_DATE} action type and ${mockDate} as value and selected `
      + 'as activeString should return new state [date-reducer-selected]',
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: SELECT_DATE,
          value: mockDate,
          activeString: 'selected',
        }),
      ).toEqual({
        ...dateReducerState,
        selected: mockDate,
      });
    },
  );
  test(
    `${SELECT_DATE
    }action type and ${mockDate} as value and selectedB `
      + 'as activeString should return new state [date-reducer-selectedB]',
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: SELECT_DATE,
          value: mockDate,
          activeString: 'selectedB',
        }),
      ).toEqual({
        ...dateReducerState,
        selectedB: mockDate,
      });
    },
  );
  test(
    `${UPDATE_APP_NOW
    }action type and ${mockDate} as value should return new state [date-reducer-update-app-now]`,
    () => {
      expect(
        dateReducer(dateReducerState, {
          type: UPDATE_APP_NOW,
          value: mockDate,
        }),
      ).toEqual({
        ...dateReducerState,
        appNow: mockDate,
      });
    },
  );
});
