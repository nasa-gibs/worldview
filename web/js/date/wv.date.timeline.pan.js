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
        if(event) {
            var evt = event.sourceEvent || event;
            var delX = evt.deltaX;
            if((evt.type === "wheel") && ((evt.deltaX < 0) || (evt.deltaX > 0))){
                update(self.xPosition-delX,0);
            }
        } else
            self.xPosition = tl.axisZoom.translate()[0];

        tl.axis.call(tl.xAxis);

        tl.ticks.check();

        tl.ticks.boundary.update();
        tl.ticks.normal.update();

        tl.pick.update();
        tl.pick.checkLocation();
        tl.pick.checkAnimPickers();

        //Update date pickers when timeline zoom level changes.
        //We need to check tl.input because this executes when page is loaded
        if(tl.input !== undefined)
            if(tl.input.fromDate !== undefined && tl.input.toDate !== undefined) {
                d3.select("#fromPick").attr("transform", tl.pick.updateAnimPickers(tl.input.fromDate));
                d3.select("#toPick").attr("transform", tl.pick.updateAnimPickers(tl.input.toDate));
            }

        tl.data.set();
    };

    var update = function(x, y){
        tl.axisZoom.translate([x, y]);
        self.xPosition = tl.axisZoom.translate()[0];
    };

    self.toSelection = function(){
        var x = -tl.x(model.selected) +
            (tl.width - tl.margin.left -
             tl.margin.right) / 2;

        update(x, 0);

        tl.data.set();
    };
    self.toCursor = function(mousePos, mouseOffset) {
        var x = -tl.x(mousePos) +
            (tl.width - tl.margin.left -
             tl.margin.right) / 2 - mouseOffset;

        update(x, 0);

        tl.data.set();
    };

    var init = function(){
        
    };

    init();
    return self;
};
