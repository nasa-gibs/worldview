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
 * Namespace: Date
 * Date handling utilities.
 */
(function() {
    
    var zeroPad = function(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    };
    
    /**
     * Function: parseISOString
     * Parses a UTC ISO 8601 date. 
     * 
     * Parameters:
     * dateAsString - The string must be in the form of yyyy-MM-ddThh:mm:ssZ. 
     * Only the year, month, and day are required and the remaining string can 
     * be shortened. The Z to denote UTC is optional.
     *
     * Returns:
     * A Date object.
     * 
     * Throws:
     * An exception if the string is invalid.
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
     * Class: Date
     */
    
    /**
     * Function: compareTo
     * Compares this instance to a Date object and return an number indication 
     * of their relative values.
     * 
     * This method copied from datejs:
     * http://code.google.com/p/datejs/
     *   
     * Parameters:
     * date - Date object to compare [Required]
     * 
     * Returns:
     * 1 = this is greaterthan date. -1 = this is lessthan date. 
     * 0 = values are equal
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
     * Function: clearUTCTime
     * Sets UTC hours, minutes, seconds, and milliseconds to zero.
     * 
     * Returns:
     * The date object.
     */
    Date.prototype.clearUTCTime = function() {
        this.setUTCHours(0);
        this.setUTCMinutes(0);
        this.setUTCSeconds(0);
        this.setUTCMilliseconds(0);
        return this;
    };
    
    /**
     * Function: clone
     * Creates a copy of this date object.
     * 
     * Returns:
     * New instance of the object.
     */
    Date.prototype.clone = function() {
        return new Date(this.getTime());
    };
    
    /**
     * Function: toISOString
     * Converts to an ISO 8601 formatted string in UTC. 
     * 
     * This function provided by OpenLayers.
     * 
     * Example;
     * (begin code)
     * > new Date().toISOString()
     * "2013-03-29T14:33:38.692Z"
     * (end code)
     * 
     * Returns:
     * String in the form of yyyy-MM-ddThh:mm:ss.sssZ.
     */
    
    /**
     * Function: toISOStringDate
     * Converts to an ISO 8601 formatted string in UTC without the time values.
     * 
     * Example:
     * (begin code)
     * > new Date().toISOStringDate()
     * "2013-03-29"
     * (end code)
     * 
     * Returns:
     * String in the form of yyyy-MM-dd.
     */
    Date.prototype.toISOStringDate = function() {
        return this.toISOString().split("T")[0];
    };
    
})();

