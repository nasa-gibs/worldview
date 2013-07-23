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

/**
 * Handles UI interactions with the Data Download model.
 * 
 * @module Worldview.Widget
 * @class DataDownload
 * @constructor
 * 
 * @param model {Worldview.DataDownload.Model} model for which this widget
 * will be a view for.
 * 
 * @param config Worldview config
 * 
 * @param spec.selector {string} jQuery selector for where the mode activation
 * button should be rendered.
 */
Worldview.Widget.DataDownload = function(model, config, spec) {

    var self = {};

    var HTML_WIDGET_INACTIVE = "<img src='images/camera.png'></img>";
    var HTML_WIDGET_ACTIVE = "<img src='images/cameraon.png'></img>";
    
    var preloader = Worldview.Preloader([
        "images/activity.gif"    
    ]);
    
    var init = function() {        
        model.events.on("activate", onActivate);
        model.events.on("deactivate", onDeactivate);
        
        $(spec.selector).on("click", function() {
            model.toggleMode();
        });
        
        onDeactivate();
    }    
    
    var onActivate = function() {
        $(spec.selector).html(HTML_WIDGET_ACTIVE);
        preloader.execute(function() {
            Worldview.Indicator.searching();
        });       
    };
    
    var onDeactivate = function() {
        $(spec.selector).html(HTML_WIDGET_INACTIVE);
        Worldview.Indicator.hide();
    };
    
    init();
    return self;
    
};

