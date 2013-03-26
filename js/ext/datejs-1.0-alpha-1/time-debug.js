/**
 * Version: 1.0 Alpha-1 
 * Build Date: 12-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
 
/* 
 * TimeSpan(days, hours, minutes, seconds, milliseconds);
 * TimeSpan(milliseconds);
 */
TimeSpan = function (days, hours, minutes, seconds, milliseconds) {
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    
    if (arguments.length == 5) { 
        this.days = days; 
        this.hours = hours; 
        this.minutes = minutes; 
        this.seconds = seconds; 
        this.milliseconds = milliseconds; 
    } 
    else if (arguments.length == 1 && typeof days == "number") {
        var orient = (days < 0) ? -1 : +1;
        this.milliseconds = Math.abs(days);
        
        this.days = Math.floor(this.milliseconds / (24 * 60 * 60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (24 * 60 * 60 * 1000);

        this.hours = Math.floor(this.milliseconds / (60 * 60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (60 * 60 * 1000);

        this.minutes = Math.floor(this.milliseconds / (60 * 1000)) * orient;
        this.milliseconds = this.milliseconds % (60 * 1000);

        this.seconds = Math.floor(this.milliseconds / 1000) * orient;
        this.milliseconds = this.milliseconds % 1000;

        this.milliseconds = this.milliseconds * orient;
        return this;
    } 
    else {
        return null;
    }
};

TimeSpan.prototype.compare = function (timeSpan) {
    var t1 = new Date(1970, 1, 1, this.hours(), this.minutes(), this.seconds()), t2;
    if (timeSpan === null) { 
        t2 = new Date(1970, 1, 1, 0, 0, 0); 
    }
    else { 
        t2 = new Date(1970, 1, 1, timeSpan.hours(), timeSpan.minutes(), timeSpan.seconds()); /* t2 = t2.addDays(timeSpan.days()); */ 
    }
    return (t1 > t2) ? 1 : (t1 < t2) ? -1 : 0;
};

TimeSpan.prototype.add = function (timeSpan) { 
    return (timeSpan === null) ? this : this.addSeconds(timeSpan.getTotalMilliseconds() / 1000); 
};

TimeSpan.prototype.subtract = function (timeSpan) { 
    return (timeSpan === null) ? this : this.addSeconds(-timeSpan.getTotalMilliseconds() / 1000); 
};

TimeSpan.prototype.addDays = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 24 * 60 * 60 * 1000)); 
};

TimeSpan.prototype.addHours = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 60 * 60 * 1000)); 
};

TimeSpan.prototype.addMinutes = function (n) { 
    return new TimeSpan(this.getTotalMilliseconds() + (n * 60 * 1000)); 
};

TimeSpan.prototype.addSeconds = function (n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 1000)); 
};

TimeSpan.prototype.addMilliseconds = function (n) {
    return new TimeSpan(this.getTotalMilliseconds() + n); 
};

TimeSpan.prototype.getTotalMilliseconds = function () {
    return (this.days() * (24 * 60 * 60 * 1000)) + (this.hours() * (60 * 60 * 1000)) + (this.minutes() * (60 * 1000)) + (this.seconds() * (1000)); 
};

TimeSpan.prototype.get12HourHour = function () {
    return ((h = this.hours() % 12) ? h : 12); 
};

TimeSpan.prototype.getDesignator = function () { 
    return (this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
};

TimeSpan.prototype.toString = function (format) {
    function _toString() {
        if (this.days() !== null && this.days() > 0) {
            return this.days() + "." + this.hours() + ":" + p(this.minutes()) + ":" + p(this.seconds());
        }
        else { 
            return this.hours() + ":" + p(this.minutes()) + ":" + p(this.seconds());
        }
    }
    function p(s) {
        return (s.toString().length < 2) ? "0" + s : s;
    } 
    var self = this;
    return format ? format.replace(/d|dd|HH|H|hh|h|mm|m|ss|s|tt|t/g, 
    function (format) {
        switch (format) {
        case "d":	
            return self.days();
        case "dd":	
            return p(self.days());
        case "H":	
            return self.hours();
        case "HH":	
            return p(self.hours());
        case "h":	
            return self.get12HourHour();
        case "hh":	
            return p(self.get12HourHour());
        case "m":	
            return self.minutes();
        case "mm":	
            return p(self.minutes());
        case "s":	
            return self.seconds();
        case "ss":	
            return p(self.seconds());
        case "t":	
            return ((this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator).substring(0, 1);
        case "tt":	
            return (this.hours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        }
    }
    ) : this._toString();
};

/* 
 * TimePeriod(startDate, endDate);
 */
var TimePeriod = function (years, months, days, hours, minutes, seconds, milliseconds) {
    this.years = 0;
    this.months = 0;
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
    
    // startDate and endDate as arguments
    if (arguments.length == 2 && arguments[0] instanceof Date && arguments[1] instanceof Date) {
    
        var date1 = years.clone();
        var date2 = months.clone();
    
        var temp = date1.clone();
        var orient = (date1 > date2) ? -1 : +1;
        
        this.years = date2.getFullYear() - date1.getFullYear();
        temp.addYears(this.years);
        
        if (orient == +1) {
            if (temp > date2) {
                if (this.years !== 0) {
                    this.years--;
                }
            }
        } else {
            if (temp < date2) {
                if (this.years !== 0) {
                    this.years++;
                }
            }
        }
        
        date1.addYears(this.years);

        if (orient == +1) {
            while (date1 < date2 && date1.clone().addDays(date1.getDaysInMonth()) < date2) {
                date1.addMonths(1);
                this.months++;
            }
        }
        else {
            while (date1 > date2 && date1.clone().addDays(-date1.getDaysInMonth()) > date2) {
                date1.addMonths(-1);
                this.months--;
            }
        }
        
        var diff = date2 - date1;

        if (diff !== 0) {
            var ts = new TimeSpan(diff);
            
            this.days = ts.days;
            this.hours = ts.hours;
            this.minutes = ts.minutes;
            this.seconds = ts.seconds;
            this.milliseconds = ts.milliseconds;
        }

        // UTC Hacks required...
        return this;
    }
 
};