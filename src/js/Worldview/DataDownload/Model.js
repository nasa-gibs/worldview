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
 * @module Worldview.DataDownload
 * @class Model
 */
Worldview.DataDownload.Model = function(config) {
    
    var self = {};
    
    /**
     * Indicates if data download mode is enabled.
     * 
     * @property active
     * @type boolean
     * @default false
     * @readOnly
     */
    self.active = false;
    

    /**
     * Enables data download mode. If the mode is already enabled, this method
     * does nothing.
     * 
     * @method enable
     */    
    self.enable = function() {
        if ( !active ) {
            console.log("Starting");
            active = true;
        }
    }
    
    /**
     * Disables data download mode. If the mode is not already enabled, this 
     * method does nothing.
     * 
     * @method disable
     */
    self.disable = function() {
        if ( active ) {
            console.log("Stopping");
            active = false;
        }
    }
    
    return self;   
}