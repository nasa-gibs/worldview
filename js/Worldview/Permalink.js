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
 * Namespace: Worldview.Permalink
 * Handles permalinks
 */
Worldview.namespace("Permalink");

$(function() {
    
    // This namespace
    var ns = Worldview.Permalink;
    
    var permOverlay = null;
    
    /**
     * Function: fromObject
     * Returns a query string using the properties and values of an object.
     * 
     * Parameters:
     * values - The object to convert to a query string
     * 
     * Returns:
     * The query string with special characters escaped.
     * 
     * Example:
     * (begin code)
     * > Worldview.Permalink.fromObject({
     *     alpha: "one",
     *     bravo: "two two"
     * });
     * "?alpha=one&bravo=two%20two"
     * (end code)
     */
    ns.fromObject = function(values) {
        var qs = "";
        for ( var key in values ) {
            if ( qs.length > 0 ) {
                qs += "&";
            }
            qs += encodeURIComponent(key) + "=" + 
                encodeURIComponent(values[key]);
        }
        return "?" + qs;           
    };
    
    /**
     * Function: fromRegistry
     * Returns a query string that is the concatenated value of all components.
     * 
     * Returns:
     * The query string to use as a permalink with special characters escaped.
     */
    ns.fromRegistry = function() {
        var comps = REGISTRY.getComponents();
        var parameters = {};
        for ( var i = 0; i < comps.length; i++ ) {
            if ( typeof comps[i].obj.getValue === 'function' ) {
                var qs = comps[i].obj.getValue();
                if ( qs !== undefined ) {
                    var fields = comps[i].obj.getValue().split("=");
                    var key = fields[0];
                    var value = fields[1];
                    parameters[key] = value;
                }
            }
        }   
        return ns.fromObject(parameters);
    };
     
    /**
     * Function: decode
     * Converts all escaped characters in the query string to actual 
     * characters.
     * 
     * Parameters:
     * queryString - The query string to decode
     * 
     * Returns:
     * The query string with all escaped characters converted to the actual
     * characters.
     * 
     * Example:
     * (begin code)
     * > Worldview.Permalink.decode("?foo=%20bar")
     * "?foo= bar"
     * (end code)
     */
    ns.decode = function(queryString) { 
        if ( queryString.length === 0 ) {
            return "";
        }
        // Remove the question mark from the query string if it exists, 
        // add it back later if needed
        var questionMark = "";
        if ( queryString.substring(0, 1) === "?" ) {
            queryString = queryString.substring(1);  
            questionMark = "?"; 
        }
        var parts = queryString.split("&");
        var decoded = [];
        $.each(parts, function(index, part) { 
            decoded.push(decodeURIComponent(part));
        });
        return questionMark + decoded.join("&");
    };
    
    /**
     * Function: show
     * Display a dialog box to the user showing the current permalink.
     */
    ns.show = function() {
        if ( permOverlay === null ) {
            permOverlay = new YAHOO.widget.Panel("panel_perm", {
                width: "300px", 
                zIndex: 1020, 
                visible: false 
            });
            var item =  "<div id='permpanel' >" + 
                "<!-- <h3>Permalink:</h3> -->"+
                "<span style='font-weight:400; font-size:12px; line-spacing:24px;'>Copy and paste the following link to share this view:</span>" + 
                "<input type='text' value='' name='permalink_content' id='permalink_content' />" +
            "</div>";
            permOverlay.setHeader('&nbsp;&nbsp;&nbsp;&nbsp;Permalink');
            permOverlay.setBody(item);
            permOverlay.render(document.body);
        }
        
        var qs = ns.fromRegistry();

        // FIXME: Some components currently have values that are not supposed
        // to be in the query string or return undefined values. For now,
        // pick out the actual values that are really needed
        var map = Worldview.extractFromQuery("map", qs);
        var products = Worldview.extractFromQuery("products", qs);
        var time = Worldview.extractFromQuery("time", qs);
        var s = Worldview.extractFromQuery("switch", qs);

        qs = "?map="+map+"&products="+products+"&time="+time+"&switch="+s;
            
        var url = window.location.href;
        var prefix = url.split("?")[0];
        prefix = (prefix !== null && prefix !== undefined) ? prefix: url;
        
        $('#permalink_content').val(prefix + qs);
    
        permOverlay.show();
        permOverlay.center();
        
        document.getElementById('permalink_content').focus();
        document.getElementById('permalink_content').select();                
    };
        
});
