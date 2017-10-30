var wv = wv || {};

wv.date = (function(self) {

  self.parse = function(state, errors) {
    if (state.time) {
      state.t = state.time;
      delete state.time;
    }
    if (state.t) {
      try {
        state.t = wv.util.parseDateUTC(state.t);
      } catch (error) {
        delete state.t;
        errors.push({
          message: "Invalid date: " + state.t,
          cause: error
        });
      }
    }

    if (state.now) {
      try {
        state.now = wv.util.parseDateUTC(state.now);
        wv.util.now = function() {
          return new Date(state.now.getTime());
        };
        wv.util.warn("Overriding now: " + state.now.toISOString());
      } catch (error) {
        delete state.now;
        errors.push({
          message: "Invalid now: " + state.now,
          cause: error
        });
      }
    }
  };

  return self;

})(wv.date || {});
