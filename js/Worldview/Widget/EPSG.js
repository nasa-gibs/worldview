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

Worldview.namespace("Widget");

Worldview.Widget.EPSG = function(config) {
    
    var self = {};
    self.containerId = "epsg";

    var projection = "4326";
    var changeDate = null;

    var init = function() {
        var changeDateString = config.config.arcticProjectionChangeDate;
        if ( changeDateString ) {
            changeDate = Date.parseISOString(changeDateString).clearUTCTime();
        }
        REGISTRY.register(self.containerId, self);
        REGISTRY.markComponentReady(self.containerId);  
                  
    };
    
    self.getValue = function() {
        return "epsg=" + projection;    
    };
        
    self.setValue = function() {};
    
    self.updateComponent = function(queryString) {
        try {
            if ( !changeDate ) {
                return;
            }
            query = Worldview.queryStringToObject(queryString);
            var time;
            if ( query.time ) {
                time = Date.parseISOString(query.time).clearUTCTime();
            } else { 
                time = Worldview.today();
            }
            if ( query["switch"] === "geographic" ) {
                projection = "4326";
                REGISTRY.fire(self);
            } else if ( query["switch"] === "arctic" ) { 
                if ( time < changeDate ) {
                    projection = "3995";
                } else { 
                    projection = "3413";
                }
                REGISTRY.fire(self); 
            } else if ( query["switch"] === "antarctic" ) {
                projection = "3031";
                REGISTRY.fire(self);
            }
        } catch ( error ) {
            Worldview.error("Internal error", error);       
        }
    }
    
    self.loadFromQuery = self.updateComponent;
    
    init();
    return self;
}
