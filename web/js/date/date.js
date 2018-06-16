import util from '../util/util';

export function parse(state, errors) {
  if (state.time) {
    state.t = state.time;
    delete state.time;
  }
  var tryCatchDate = function(stateDate) {
    try {
      state.t = util.parseDateUTC(stateDate);
    } catch (error) {
      errors.push({
        message: 'Invalid date: ' + stateDate,
        cause: error
      });
    }
  };
  if (state.t) {
    state.t = tryCatchDate(state.t);
  }
  if (state.t1) {
    state.t1 = tryCatchDate(state.t1);
  }
  if (state.t2) {
    state.t2 = tryCatchDate(state.t2);
  }

  if (state.now) {
    try {
      state.now = util.parseDateUTC(state.now);
      util.now = function () {
        return new Date(state.now.getTime());
      };
      util.warn('Overriding now: ' + state.now.toISOString());
    } catch (error) {
      delete state.now;
      errors.push({
        message: 'Invalid now: ' + state.now,
        cause: error
      });
    }
  }
};
