import util from '../util/util';

export function parse(state, errors) {
  if (state.time) {
    state.t = state.time;
    delete state.time;
  }
  if (state.t) {
    try {
      state.t = util.parseDateUTC(state.t);
    } catch (error) {
      delete state.t;
      errors.push({
        message: 'Invalid date: ' + state.t,
        cause: error
      });
    }
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
