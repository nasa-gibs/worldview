import lodashEach from 'lodash/each';

export function parse(state, errors) {
  if (state.a) {
    var str = state.a;
    var astate = {
      attributes: []
    };

    // Get text before (
    var on = str.match(/[^(,]+/)[0];
    if (on !== 'on') {
      // don't do anything if wrong format
      state.ab = undefined;
      return;
    }

    // remove (, get key value pairs
    str = str.match(/\(.*\)/)[0].replace(/[()]/g, '');
    var kvps = str.split(',');
    lodashEach(kvps, function(kvp) {
      var parts = kvp.split('=');
      astate.attributes.push({
        id: parts[0],
        value: parts[1]
      });
    });
    state.a = astate;
  }
}
