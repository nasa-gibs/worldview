import lodashEach from 'lodash/each';
import lodashPull from 'lodash/pull';

export function events() {
  const self = {};

  // Object of event types. Each event type is an array of listeners.
  const events = {};
  const allListeners = [];

  self.on = function(event, callback) {
    if (!callback) {
      throw new Error('No listener specified');
    }
    let listeners = events[event];
    if (!listeners) {
      listeners = [];
      events[event] = listeners;
    }
    listeners.push(callback);
    return self;
  };

  self.off = function(event, callback) {
    const listeners = events[event];
    if (listeners) {
      lodashPull(listeners, callback);
    }
    return self;
  };

  self.any = function(callback) {
    if (!callback) {
      throw new Error('No listener specified');
    }
    allListeners.push(callback);
  };

  self.trigger = function(event) {
    const listeners = events[event];
    if (!listeners && !allListeners) {
      return;
    }
    const eventArguments = Array.prototype.slice.call(arguments, 1);
    lodashEach(events[event], (listener) => {
      listener.apply(self, eventArguments);
    });
    lodashEach(allListeners, (listener) => {
      listener.apply(self, eventArguments);
    });
    return self;
  };

  return self;
}
