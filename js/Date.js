
(function() {
    
    var zeroPad = function(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    };
    
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
    
    Date.prototype.clearUTCTime = function() {
        this.setUTCHours(0);
        this.setUTCMinutes(0);
        this.setUTCSeconds(0);
        this.setUTCMilliseconds(0);
        return this;
    };
    
    Date.prototype.clone = function() {
        return new Date(this.getTime());
    };
    
    Date.prototype.toISOStringDate = function() {
        return this.toISOString().split("T")[0];
    };
    
})();

