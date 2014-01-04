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

/**
 * @module wv.util
 */
var wv = wv || {};
wv.util = wv.util || {};

/**
 * General event pump.
 *
 * * Register listeners with on
 * * Unregister listeners with off
 * * Fire events with trigger
 *
 * Example:
 *
 *      var events = wv.util.events();
 *      events.on("answerReceived", function(answer) {
 *          console.log("The answer is", answer);
 *      });
 *
 *      events.trigger("answerReceived", 42);
 *
 * @class wv.util.events
 */
wv.util.events = wv.util.events || function() {

    var self = {};

    // Object of event types. Each event type is an array of listeners.
    var events = {};

    /**
     * Registers a listener for an event.
     *
     * @method on
     *
     * @param {string} event Type of event to register for.
     *
     * @param {function} callback Function called when the event of the given
     * type is fired. Arguments to the fire method are passed to the callback
     * function.
     *
     * @return {wv.util.events} this object useful for chaining.
     */
    self.on = function(event, callback) {
        var listeners = events[event];
        if ( !listeners ) {
            listeners = [];
            events[event] = listeners;
        }
        listeners.push(callback);
        return self;
    };

    /**
     * Unregisters a listener for an event.
     *
     * @method off
     *
     * @param {string} event Type of event to unregister for.
     *
     * @param {function} callback Function that was previously registered for
     * this type of event. If this function has not been registered, this
     * method does nothing.
     *
     * @return {wv.util.events} this object useful for chaining.
     */
    self.off = function(event, callback) {
        var listeners = events[event];
        if ( listeners ) {
            _.pull(listeners, callback);
        }
        return self;
    };

    /**
     * Notifies all listeners of an event.
     *
     * @method trigger
     *
     * @param {string} event Type of event to fire. If no listeners are
     * registered for this event, this method does nothing.
     *
     * @param {any} [arguments]* Additional arguments to pass back to the
     * function of each listener.
     *
     * @return {wv.util.events} this object useful for chaining.
     */
    self.trigger = function(event) {
        var listeners = events[event];
        if ( !listeners ) {
            return;
        }
        var eventArguments = Array.prototype.slice.call(arguments, 1);
        _.each(events[event], function(listener) {
            listener.apply(self, eventArguments);
        });
        return self;
    };

    return self;
};