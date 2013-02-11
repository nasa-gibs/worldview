/**
 * Namespace: Worldview
 */
(function(ns) { 
 
    /**
     * Constant: VERSION
     * Release version string.
     */   
    ns.VERSION = "0.4.0";
    
    /**
     * Function: namespace
     * Defines a namespace under Worldview. Each argument is an object path
     * delimited by periods. For each path item, an empty object is created if 
     * one does not yet exist. For example:
     * 
     * (begin code)
     * Worldview.namespace("foo.bar");
     * (end code)
     * 
     * If Worldview.foo does not exist, it wil be created with an empty object. 
     * If Worldview.foo.bar does not exist, it will be created with an empty
     * object.
     * 
     * Parameters:
     * (varargs) - Object path as a string, delimited by periods
     * 
     * Returns:
     * The newly created namespace object.
     */
    ns.namespace = function() {
        var obj;
        for ( var i = 0; i < arguments.length; i++ ) {
            var list=(""+arguments[i]).split(".");
            obj = Worldview;
            for ( var j = 0; j < list.length; j++ ) {
                obj[list[j]] = obj[list[j]] || {};
                obj = obj[list[j]];
            }
        } 
        return obj;
    };
    
    /**
     * Function: log
     * Logs a message to the browser console.
     * 
     * Parameters:
     * message - The message to log to the console.
     */
    ns.log = function(message) {
        console.log(message);
    };
    
    /**
     * Function: error
     * Worldview general error handler. The error is reported to the browser
     * console and, if the JavaScript library with YAHOO.widget.Panel is
     * found, opens a notification panel for the end user.
     * 
     * Parameters:
     * message - Error message to display to the user
     * cause   - Description of the error that does not need to be shown to
     *           the user, usually the message of the exception that was 
     *           caught.
     */
    ns.error = function(message, cause) {
        ns.log("ERROR: " + message);
        if ( cause !== undefined ) { 
            ns.log("Cause: " + cause);
        }
        
        if ( window.YAHOO && window.YAHOO.widget && 
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px", 
                zIndex: 1020, 
                visible: false 
            });
            o.setHeader('&nbsp;&nbsp;&nbsp;&nbsp;Warning');
            o.setBody(message);
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }
    };
    
})(window.Worldview = window.Worldview || {});

