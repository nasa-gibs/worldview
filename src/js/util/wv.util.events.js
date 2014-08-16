/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.util = wv.util || {};

wv.util.events = wv.util.events || function() {

    var self = {};

    // Object of event types. Each event type is an array of listeners.
    var events = {};
    var allListeners = [];

    self.on = function(event, callback) {
        if ( !callback ) {
            throw new Error("No listener specified");
        }
        var listeners = events[event];
        if ( !listeners ) {
            listeners = [];
            events[event] = listeners;
        }
        listeners.push(callback);
        return self;
    };

    self.off = function(event, callback) {
        var listeners = events[event];
        if ( listeners ) {
            _.pull(listeners, callback);
        }
        return self;
    };

    self.any = function(callback) {
        if ( !callback ) {
            throw new Error("No listener specified");
        }
        allListeners.push(callback);
    };

    self.trigger = function(event) {
        var listeners = events[event];
        if ( !listeners && !allListeners ) {
            return;
        }
        var eventArguments = Array.prototype.slice.call(arguments, 1);
        _.each(events[event], function(listener) {
            listener.apply(self, eventArguments);
        });
        _.each(allListeners, function(listener) {
            listener.apply(self, eventArguments);
        });
        return self;
    };

    return self;
};
