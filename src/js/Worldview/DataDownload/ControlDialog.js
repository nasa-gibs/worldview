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

Worldview.DataDownload.ControlDialog = function(model) {
    
    var WIDTH = 345;
    var HEIGHT = 265;
    var X_OFFSET = 50;
    var Y_OFFSET = 75;
    var dialog;
    
    var self = {};
    self.events = Worldview.Events();
    
    var init = function() {
        var properties = {
            width: "" + WIDTH + "px",
            height: "" + HEIGHT + "px",
            visible: false,
            autofillheight: "body",
            contraintoviewport: true,
            x: Math.ceil($(window).width() - WIDTH - X_OFFSET),
            y: Y_OFFSET
        };
        dialog = new YAHOO.widget.Panel("dataDownload_controlDialog", 
                properties);
        dialog.setHeader("Select Download Products");
        dialog.setBody([
            "<form>",
                "<div class='productSelector'></div>",
            "</form>"
        ].join("\n"));
        
        dialog.hideEvent.subscribe(function() {
            self.events.trigger("hide");
        });
        
        dialog.render(document.body);
        
        Worldview.DataDownload.ProductSelector(model,
                "#dataDownload_controlDialog .productSelector");
                
    };

    self.show = function() {
        dialog.show();
    };
    
    self.hide = function() {
        dialog.hide();
    };
    
    init();
    
    return self;
}
