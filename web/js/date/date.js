import util from '../util/util';

export function parse(state, errors) {
  if (state.time) {
    state.t = state.time;
    delete state.time;
  }
  var tryCatchDate = function(str) {
    try {
      return util.parseDateUTC(state[str]);
    } catch (error) {
      errors.push({
        message: 'Invalid date: ' + state[str],
        cause: error
      });
    }
  };
  if (state.t) {
    state.t = tryCatchDate('t');
  }
  if (state.t1) {
    state.t1 = tryCatchDate('t1');
  }

  if (state.now) {
    try {
      state.now = util.parseDateUTC(state.now);
      util.now = function() {
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
}
