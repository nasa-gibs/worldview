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
 * @module Date
 */

/**
 * Date handling utilities.
 *
 * @class Date
 */
(function() {
    
    var zeroPad = function(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    };
    
    /**
     * Parses a UTC ISO 8601 date.
     * 
     * @method parseISOString
     * @static
     * 
     * @param dateAsString {string} The string must be in the form of 
     * yyyy-MM-ddThh:mm:ssZ. Only the year, month, and day are required and the 
     * remaining string can be shortened. The Z to denote UTC is optional.
     *
     * @return {Date} converted string as a date object, throws an exception if 
     * the string is invalid
     */
    Date.parseISOString = function(dateAsString) {
        var dateTimeArr = dateAsString.split(/T/);
    
        var yyyymmdd = dateTimeArr[0].split("-");
        
        // Parse elements of date and time
        var year = yyyymmdd[0];
        var month = yyyymmdd[1] - 1;
        var day = yyyymmdd[2];
        
        var hour = 0;
        var minute = 0;
        var second = 0;
        
        // Use default of midnight if time is not specified 
        if ( dateTimeArr.length > 1 ) {
            var hhmmss = dateTimeArr[1].split(/[:Z]/);
            var hour = hhmmss[0] || 0;
            var minute = hhmmss[1] || 0;
            var second = hhmmss[2] || 0;
        }
        var date = new Date(Date.UTC(year, month, day, hour, minute, second));
        if ( isNaN(date.getTime()) ) {
            throw new Error("Invalid date: " + dateAsString);
        }
        return date;
    };
        
    /**
     * Compares this instance to a Date object and return an number indication 
     * of their relative values.
     * 
     * This method copied from datejs:
     * http://code.google.com/p/datejs/
     *   
     * @method compareTo
     * 
     * @param date {Date} Date object to compare.
     * 
     * @returns {integer}
     * * 1 = this is greaterthan date. 
     * * -1 = this is lessthan date. 
     * * 0 = values are equal
     */
    Date.prototype.compareTo = function(date) {
        if (isNaN(this)) { 
            throw new Error(this); 
        }
        if (date instanceof Date && !isNaN(date)) {
            return (this > date) ? 1 : (this < date) ? -1 : 0;
        } else { 
            throw new TypeError(date); 
        }
    };
    
    /**
     * Sets UTC hours, minutes, seconds, and milliseconds to zero.
     * 
     * @method clearUTCTime
     * @return {Date} same instance of this object.
     */
    Date.prototype.clearUTCTime = function() {
        this.setUTCHours(0);
        this.setUTCMinutes(0);
        this.setUTCSeconds(0);
        this.setUTCMilliseconds(0);
        return this;
    };
    
    /**
     * Creates a copy of this date object.
     * 
     * @metohd clone
     * @return {Date} new instance of this object.
     */
    Date.prototype.clone = function() {
        return new Date(this.getTime());
    };
    
    /**
     * Converts to an ISO 8601 formatted string in UTC. 
     * 
     * This function provided by OpenLayers.
     * 
     * @method toISOString
     * @return {String} In the form of yyyy-MM-ddThh:mm:ss.sssZ.
     */
    
    /**
     * Converts to an ISO 8601 formatted string in UTC without the time values.
     * 
     * @method toISOStringDate
     * @return {String} In the form of yyyy-MM-dd.
     */
    Date.prototype.toISOStringDate = function() {
        return this.toISOString().split("T")[0];
    };
    
})();

