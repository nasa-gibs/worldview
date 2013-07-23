/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * General event pump.
 * 
 * * Register listeners with on
 * * Unregister listeners with off
 * * Fire events with fire
 * 
 * Example:
 * 
 *      var events = Worldview.Events();
 *      events.on("answerReceived", function(answer) {
 *          console.log("The answer is", answer);
 *      });
 *      
 *      events.fire("answerReceived", 42);
 * 
 * @module Worldview
 * @class Events
 */
Worldview.Events = function() {
    
    var self = {};
    
    // Object of event types. Each event type is an array of listeners.
    var types = {};
    
    /**
     * Registers a listener for an event.
     *
     * @method on
     * @param {string} event Type of event to register for.
     * @param {function} callback Function called when the event of the given
     * type is fired. Arguments to the fire method are passed to the callback
     * function.
     */
    self.on = function(event, callback) {
        if ( !event ) {
            throw new Error("No event type specified");
        }
        var listeners = types[event];
        if ( !listeners ) {
            listeners = [];
            types[event] = listeners;
        }
        listeners.push(callback);        
    };
    
    /**
     * Unregisteres a listenet for an evcent.
     * 
     * @method off
     * @param {string} event Type of event to unregister for.
     * @param {Object} callback Function that was previously registered for 
     * this type of event. If this function has not been registered, this
     * method does nothing.
     */    
    self.off = function(event, callback) {
        var listeners = types[event];
        if ( listeners ) {
            var index = $.inArray(callback, listeners);
            if ( index >= 0 ) {
                listeners.splice(index, 1);
            }
        }    
    };
    
    /**
     * Notifies all listeners of an event. 
     * 
     * @method fire
     * @param {string} event Type of event to fire. If no listeners are 
     * registered for this event, this method does nothing.
     * @param {Object} [arguments]* Additional arguments to pass back to the
     * function of each listener.
     */
    self.fire = function(event) {
        var listeners = types[event];
        if ( !listeners ) {
            return;
        }
        var eventArguments = Array.prototype.slice.call(arguments, 1);
        $.each(types[event], function(index, listener) {
            listener.apply(self, eventArguments);    
        });    
    };
    
    return self;
}
