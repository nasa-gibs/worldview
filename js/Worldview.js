/**
 * Namespace: Worldview
 */
(function(ns) { 
     
    /**
     * Constant: NAME
     * Official name of this application.
     */
    ns.NAME = "EOSDIS Worldview";
    
    /**
     * Constant: VERSION
     * Release version string.
     */   
    ns.VERSION = "0.5.0";
    
    /**
     * Constant: BUILD_TIMESTAMP
     * Date and time Worldview was built. This value is changed during the
     * build process.
     */
    ns.BUILD_TIMESTAMP = "@BUILD_TIMESTAMP@";
    
    ns.GIBS_HOUR_DELAY = 3;
    
    ns.isDevelopment = function() {
        return ns.BUILD_TIMESTAMP.indexOf("BUILD_TIMESTAMP") >= 0;
    };
    
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
    
    ns.now = function() {
        return new Date();    
    }
    
    ns.today = function() {
        return new Date().clearUTCTime();
    }
        
    ns.overrideNow = function(date) {
        var overrideToday = date.clone().clearUTCTime();
        ns.now = function() {
            return new Date(date.getTime());
        }
        ns.today = function() {
            return new Date(overrideToday.getTime());
        }
    };
    
    /**
     * Function: error
     * Worldview general error handler. The error is reported to the browser
     * console and, if the JavaScript library with YAHOO.widget.Panel is
     * found, opens a notification panel for the end user.
     * 
     * Parameters:
     * message - Error message to display to the user.
     * cause   - Description of the error that does not need to be shown to
     *           the user, usually the message of the exception that was 
     *           caught.
     */
    ns.error = function(message, cause) {
        var log = Logging.getLogger();
        if ( cause ) {
            log.error(cause);
        } else {
            log.error(message);
        }       
        
        if ( window.YAHOO && window.YAHOO.widget && 
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px", 
                zIndex: 1020, 
                visible: false 
            });
            o.setHeader('Warning');
            o.setBody("An unexpected error has occurred.<br/><br/>" + message);
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }
    };
    
    /**
     * Function: notify
     * Displays a message to the end user in a dialog box.
     * 
     * Parameters:
     * message - The message to display to the user.
     * title   - Title for the dialog box (optional). If not specified, the
     * title will be "Notice".
     */    
    ns.notify = function(message, title) {
        Logging.getLogger().info(message);
        
        if ( window.YAHOO && window.YAHOO.widget && 
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px", 
                zIndex: 1020, 
                visible: false 
            });
            title = title || "Notice";
            o.setHeader(title);
            o.setBody(message);
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }    
    };
    
    /**
     * Function: ask
     * Asks the end user a yes or no question in a dialog box.
     * 
     * Parameters:
     * spec.header       - Header text to be displayed in the dialog box. If not
     *                     specified, "Notice" will be used.
     * spec.message      - Message text to be displayed in the dialog box. If 
     *                     not specified, "Are you sure?" will be used.
     * spec.okButton     - Text to be used in the no button. If not specified, 
     *                     "OK" will be used.
     * spec.cancelButton - Text to be used in the yes button. If not specified,
     *                     "Cancel" will be used.
     * spec.onOk         - Function to execute when the OK button is pressed. 
     *                     If not specified, the dialog box simply closes.
     * spec.onCancel     - Function to execute when the Cancel button is 
     *                     pressed. If not specified, the dialog box simply 
     *                     closes. 
     */
    ns.ask = function(spec) {
        var dialog = new YAHOO.widget.SimpleDialog("dialog", {
            width: "20em",
            effect: {
                effect: YAHOO.widget.ContainerEffect.FADE,
                duration: 0.25
            },
            fixedcenter: true,
            modal: true,
            visible: false,
            draggable: false
        });
        
        var header = spec.header || "Notice";
        dialog.setHeader(header);
        dialog.setBody(spec.message || "Are you sure?");
        
        var handleOk = function() {
            try {
                this.hide();
                if ( spec.onOk) {
                    spec.onOk();
                }
            } catch ( error ) {
                Worldview.error("Internal error", error);
            }
        };
        var handleCancel = function() {
            try {
                this.hide();
                if ( spec.onCancel ) {
                    spec.onCancel();
                }
            } catch ( error ) {
                Worldview.error("Internal error", error);
            }
        };
        
        var buttons = [
            { text: spec.cancelButton || "Cancel", handler: handleCancel },
            { text: spec.okButton || "OK", handler: handleOk }
        ];
        dialog.cfg.queueProperty("buttons", buttons); 
        dialog.render(document.body);    
        dialog.show();          
    }
    
    /**
     * Function: size
     * Gets the number of properties in an object. This only includes 
     * properties where hasOwnProperty returns true.
     * 
     * Parameters:
     * size - Object to count the number of properties
     * 
     * Returns:
     * Number of properties
     */
    ns.size = function(object) {
        var size = 0;
        for ( key in object ) {
            if ( object.hasOwnProperty(key) ) {
                size++;
            }
        }
        return size;
    };
    
    /**
     * Function: getObjectByPath
     * Returns the object specified by a string path.
     * 
     * Parameters:
     * path - The path to the object as a string, delimited by periods.
     * 
     * Returns:
     * The object
     * 
     * Throws:
     * An exception if any object leading up to the leaf object is undefined.
     * 
     * Example:
     * (begin code)
     * > Foo.Bar.baz = "hello";
     * > Worldview.getObjectByPath("Foo.Bar.baz");
     * "hello"
     * (end code)
     */
    ns.getObjectByPath = function(path) {
        var nodes = path.split(".");
        var parent = window;
        $.each(nodes, function(index, node) {
            if ( parent[node] === undefined ) {
                throw new Error("In " + path + ", " + node + " is undefined");
            }
            parent = parent[node];
        });
        return parent;
    };    
    
    /**
     * Function: queryStringToObject
     * Converts a query string into an object.
     * 
     * Parameters:
     * queryString - The query string to convert
     * 
     * Return:
     * An object where each property is one of the parameters found in the
     * query string.
     */
    ns.queryStringToObject = function(queryString) {
        if ( !queryString ) {
            return "";
        }
        if ( queryString[0] === "?" ) {
            queryString = queryString.substring(1);
        }
        var parameters = queryString.split("&");
        result = {};
        for ( var i = 0; i < parameters.length; i++ ) {    
            var fields = parameters[i].split("=");
            result[fields[0]] = fields[1];
        }
        return result;
    };
    
    /**
     * Function: extractFromQuery
     * Extracts the value of the given key from the querystring.
     * 
     * Parameters:
     * key - Item to be extracted
     * qa  - Query string to extract from
     * 
     * Returns:
     * The value associated with the given key in the querystring
     */
    ns.extractFromQuery = function(key, qs) {
        var regex = new RegExp("[\\?&#]*"+key+"=([^&#]*)");
        var val = regex.exec(qs);
        if(val == null)
            return "";
        else
            return val[1];
    };
    
    /**
     * Function: ajaxError
     * Wrapper for handling AJAX errors when the XHR and status code is not
     * necessary.
     * 
     * Parameters:
     * handler - Callback to be invoked on error that accepts one argument, 
     * the error that was thrown.
     * 
     * Returns:
     * The function wrapper.
     */    
    ns.ajaxError = function(handler) {
        return function(jqXHR, textStatus, errorThrown) {
            handler(errorThrown);
        };
    };
        
    /**
     * Function: clamp
     * 
     * Ensures a value is between an minimum and a maximum.
     * 
     * Parameters:
     * min - Lower bound of the clamp range
     * max - Upper bound of the clamp range
     * 
     * Returns:
     * min if the value is below min, max if the value is above max,             
     * othewise returns value
     * 
     * Throws:      
     * If min is greater than max
     */
     ns.clamp = function(min, max, value) {
        if ( min > max ) {
            throw new Error("Invalid clamp range (" + min + " - " + max + ")");
        }
        if ( value < min ) { return min; }
        if ( value > max ) { return max; }
        return value;
    }
    
    /**
     * Function: clampIndex
     * 
     * Clamps a value to a valid array index.
     * 
     * Parameters:
     * array - Clamp the index to this array
     * index - Index value
     * 
     * Returns:
     * Zero if the index is below zero, array.length - 1 if the index is greater 
     * than the maximum array index, otherwise returns index.
     */
    ns.clampIndex = function(array, index) {
        return ns.clamp(0, array.length - 1, index);
    }
            
})(window.Worldview = window.Worldview || {});


