/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.date.timeline
 */
var wv = wv || {};
wv.date = wv.date || {};
wv.date.timeline = wv.date.timeline || {};

/**
 * Perform timeline panning functions
 *
 * @class wv.date.timeline.pan
 */
wv.date.timeline.pan = wv.date.timeline.pan || function(models, config, ui) {

    var tl = ui.timeline;
    var model = models.date;
    
    var self = {};

    self.xPosition = tl.axisZoom.translate()[0];

    self.axis = function(event){

        if(event){
            var evt = event.sourceEvent || event;
            var delX = evt.deltaX;
            if((evt.type === "wheel") && ((evt.deltaX < 0) || (evt.deltaX > 0))){
                tl.axisZoom.translate([self.xPosition-delX,0]);
                self.xPosition = tl.axisZoom.translate()[0];
            }
        }
        else{
            self.xPosition = tl.axisZoom.translate()[0];
        }
        tl.axis.call(tl.xAxis);

        tl.zoom.lvl.configure();

        tl.ticks.boundary.update();
        tl.ticks.normal.update();

        tl.pick.update();
        tl.pick.checkLocation();
    };

    self.toSelection = function(){

        tl.axisZoom.translate([-tl.x(model.selected) +
                               (tl.width -
                                tl.margin.left -
                                tl.margin.right) /
                               2,0]);

        self.xPosition = tl.axisZoom.translate()[0];

    };

    var init = function(){
        
    };

    init();
    return self;
};
