import lodashEach from 'lodash/each';
import lodashPull from 'lodash/pull';

export default (function events() {
  const self = {};

  // Object of event types. Each event type is an array of listeners.
  const eventTypes = {};
  const allListeners = [];

  self.on = function(event, callback) {
    if (!callback) {
      throw new Error('No listener specified');
    }
    let listeners = eventTypes[event];
    if (!listeners) {
      listeners = [];
      eventTypes[event] = listeners;
    }
    listeners.push(callback);
    return self;
  };

  self.off = function(event, callback) {
    const listeners = eventTypes[event];
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

  self.trigger = function(...args) {
    const [event] = args;
    const listeners = eventTypes[event];
    if (!listeners && !allListeners) {
      return undefined;
    }
    const eventArguments = args.slice(1);
    lodashEach(eventTypes[event], (listener) => {
      listener.apply(self, eventArguments);
    });
    lodashEach(allListeners, (listener) => {
      listener.apply(self, eventArguments);
    });
    return self;
  };

  return self;
}());
