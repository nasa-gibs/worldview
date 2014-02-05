
var wv = wv || {};

wv.date = (function(self) {

    self.parse = function(state, errors) {
        if ( state.time ) {
            try {
                state.time = wv.util.parseDateUTC(state.time);
            } catch ( error ) {
                delete state.time;
                errors.push({
                    message: "Invalid date: " + state.time,
                    cause: error
                });
            }
        }

        if ( state.now ) {
            try {
                state.now = wv.util.parseDateUTC(state.now);
            } catch ( error ) {
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
