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

Worldview.namespace("DataDownload");

/**
 * Data download model.
 * 
 * @namespace DataDownload
 * @class Model
 * @constructor
 * @param config config
 */
Worldview.DataDownload.Model = function(config) {
    
    var self = {};
    
    /**
     * Fired when the data download mode is activated.
     * 
     * @event ACTIVATE
     * @final
     */
    self.ACTIVATE = "activate";
    
    /**
     * Fired when the data download mode is deactivated.
     * 
     * @event DEACTIVATE
     * @final
     */
    self.DEACTIVATE = "deactivate";
    
    /**
     * Indicates if data download mode is active.
     * 
     * @property active
     * @type boolean
     * @default false
     * @readOnly
     */
    self.active = false;
    
    /**
     * Handler for events fired by this class.
     * 
     * @property events
     * @type Events
     */
    self.events = Worldview.Events();
    
    /**
     * Activates data download mode. If the mode is already active, this method
     * does nothing.
     * 
     * @method activate
     */    
    self.activate = function() {
        if ( !self.active ) {
            self.active = true;
            self.events.fire(self.ACTIVATE);
        }
    };
    
    /**
     * Deactivates data download mode. If the mode is not already active, this 
     * method does nothing.
     * 
     * @method deactivate
     */
    self.deactivate = function() {
        if ( self.active ) {
            self.active = false;
            self.events.fire(self.DEACTIVATE);
        }
    };
    
    /**
     * Toggles the current mode of data download. Deactivates if already
     * active. Activates if already inactive.
     * 
     * @method toggleMode
     */
    self.toggleMode = function() {
        if ( self.active ) {
            self.deactivate();
        } else {
            self.activate();
        }
    };
    
    return self;   
}