import lodashEach from 'lodash/each';
import lodashPull from 'lodash/pull';

export function events () {
  var self = {};

  // Object of event types. Each event type is an array of listeners.
  var events = {};
  var allListeners = [];

  self.on = function (event, callback) {
    if (!callback) {
      throw new Error('No listener specified');
    }
    var listeners = events[event];
    if (!listeners) {
      listeners = [];
      events[event] = listeners;
    }
    listeners.push(callback);
    return self;
  };

  self.off = function (event, callback) {
    var listeners = events[event];
    if (listeners) {
      lodashPull(listeners, callback);
    }
    return self;
  };

  self.any = function (callback) {
    if (!callback) {
      throw new Error('No listener specified');
    }
    allListeners.push(callback);
  };

  self.trigger = function (event) {
    var listeners = events[event];
    if (!listeners && !allListeners) {
      return;
    }
    var eventArguments = Array.prototype.slice.call(arguments, 1);
    lodashEach(events[event], function (listener) {
      listener.apply(self, eventArguments);
    });
    lodashEach(allListeners, function (listener) {
      listener.apply(self, eventArguments);
    });
    return self;
  };

  return self;
};
