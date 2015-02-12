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
 * Perform timeline zooming functions
 *
 * @class wv.date.timeline.zoom
 */
wv.date.timeline.zoom = wv.date.timeline.zoom || function(models, config, ui) {

    var tl = ui.timeline;
    var model = models.date;

    var self = {};

    self.current = {
        ticks: {
            //Placeholders
            boundary: {
                
            },
            normal: {
                
            },
        },
        pick: {
            //Placeholder
        }
    };

    self.change = function(amount, event) {
        //console.log('changing zoom!');
        //TODO: Below
        /*
        zoomLvl += -amount;
        if ( zoomLvl < 0 ) {
            zoomLvl = 0;
        }
        if ( zoomLvl > 2 ) {
            zoomLvl = 2;
        }

        setZoom.call(this, zoomLvl, event);
        */
    };

    self.drawTicks = function(count, max, aEnd, w, i, s, f){
        var d1 = tl.data.start(),
            d2,
            r1 = (tl.width/2)-((count*w)/2),
            r2 = (tl.width/2)+((count*w)/2);

        if (max > count){
            tl.isCropped = false;
            d2 = tl.data.end();
            r1 = (tl.width/2)-((count*w)/2);
            r2 = (tl.width/2)+((count*w)/2);
        }
        else{
            tl.isCropped = true;
            d2 = aEnd;
            r1 = 0;
            r2 = tl.width;
        }

        update(d1, d2, r1, r2, i, s, f);
    };

    var update = function(d1, d2, r1, r2, i, s, f){

        tl.x.domain([d1,d2])
            .range([r1,r2]);

        tl.xAxis.scale(tl.x)
            .ticks(i, s)
            .tickFormat(f);

        tl.axisZoom
            .x(tl.x);

        wv.ui.mouse.wheel(tl.axisZoom, ui).change(self.change);

        tl.svg.call(tl.axisZoom);

        tl.pan.toSelection();

        //??need to remove first?
        tl.axis.call(tl.xAxis);
        
    };

    var init = function(){
        
        //self.level3();
    };

    init();
    return self;
};

/**
 * Modify zoom levels here. Maybe this isnt the best way to do this.
 * It could be called just level without the zoom part instead.
 *
 * When the zoom level is changed, this re renders everything of the timeline.
 *
 * @class wv.date.timeline.zoom.lvl
 */

//TODO: Maybe reorganize this somewhere else/in another file
wv.date.timeline.zoom.lvl = wv.date.timeline.zoom.lvl || function(models, config, ui) {
    var self = {};
    var tl = ui.timeline;
    var model = models.date;
    self.level1 = function(){
/*
        tl.ticks.normalTicks = tl.ticks.all.filter(function(d){
            return d.getUTCFullYear() % 10 !== 0;
        });

        tl.ticks.boundaryTicks = tl.ticks.all.filter(function(d){
            return d.getUTCFullYear() % 10 === 0;
        });

        tl.ticks.refresh('year','decade');
        */
    };
    self.level2 = function(){
/*
        tl.ticks.normalTicks = tl.ticks.all.filter(function(d){
            return d.getUTCMonth() !== 0;
        });

        tl.ticks.boundaryTicks = tl.ticks.all.filter(function(d){
            return d.getUTCMonth() === 0;
        });

        var protoData = new Date(Date.UTC(tl.ticks.all.data[0].getUTCFullYear(),
                                          tl.ticks.all.data[0].getUTCMonth()-1,
                                          1));

        tl.ticks.refresh('month','year');*/
    };
    self.level3 = function(){
        var altEnd,
            fNormData,
            //format of the label
            labelFormat = d3.time.format.utc("%b"),
            //printed type of tick
            dateInterval = d3.time.day.utc,
            //step of the ticks
            dateStep = 1,
            //number of ticks total of data range, in days
            tickCount = (tl.data.end() - tl.data.start())/1000/60/60/24,
            tickCountMax,
            //width in pixels of each tick
            tickWidth = 11;

        //Max number of ticks able to be shown on this resolution
        tickCountMax = Math.ceil(tl.width/tickWidth);

        //end tick date if tickCount is less than tickCountMax
        altEnd = new Date(tl.data.start().getUTCFullYear(),
                          tl.data.start().getUTCMonth(),
                          tl.data.start().getUTCDate() + tickCountMax);

        tl.zoom.drawTicks(tickCount,
                  tickCountMax,
                  altEnd,
                  tickWidth,
                  dateInterval,
                  dateStep,
                  labelFormat);

        //Filters ticks for nonboundaries that have the following attribute
        tl.zoom.current.ticks.normal.all = function(){
            tl.ticks.normal.all = tl.ticks.all.filter(function(d){
                return d.getUTCDate() !== 1;
            });
            tl.ticks.normal.setEnds();
        };

        //Filters ticks for boundaries that have the following attribute
        tl.zoom.current.ticks.boundary.all = function(){
            tl.ticks.boundary.all = tl.ticks.all.filter(function(d){
                return d.getUTCDate() === 1;
            });
        };

        //Calculated next boundary tick by date
        tl.zoom.current.ticks.boundary.next = function(current){
            var next = new Date(current);
            return new Date(next.setUTCMonth(next.getUTCMonth()+1));
        };

        //Calculated next normal tick by date
        tl.zoom.current.ticks.normal.next = function(current){
            var next = new Date(current);
            return new Date(next.setUTCDate(next.getUTCDate()+1));
        };

        //Value for hovered normal label
        tl.zoom.current.ticks.normal.hover = function(d){
            //No modifications to date obj at this zoom level
            return d;
        };

        //Value for clicked normal tick
        tl.zoom.current.ticks.normal.clickDate = function(d){
            return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
        };

        //Value for hovered boundary tick
        tl.zoom.current.ticks.boundary.hover = function(d){
            return new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
        };

        //Displayed default label
        tl.zoom.current.ticks.boundary.label = function(d){
            return model.monthAbbr[d.getUTCMonth()];
        };

        //Displayed default sub-label (if any)
        tl.zoom.current.ticks.boundary.subLabel = function(d){
            return d.getUTCFullYear();
        };

        //Value for clicked boundary tick
        tl.zoom.current.ticks.boundary.clickDate = function(d){
            return new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
        };

        //When the date updates while dragging the pick forward
        tl.zoom.current.pick.nextChange = function(d){
            return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1));
        };

        //When the date updates while dragging the pick backward
        tl.zoom.current.pick.prevChange = function(d){
            return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
        };

        tl.zoom.current.pick.hoverTick = function(newDate){
            tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
                .filter(function(d){
                    return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                        (d.getUTCMonth() === newDate.getUTCMonth() &&
                         (d.getUTCDate() === newDate.getUTCDate()));
                });
        };

        self.configure();
        initTicks();

    };

    self.configure = function(){
        var first, last, proto, end;
        tl.ticks.setAll();
        
        //Checks to see if all of the ticks fit onto the timeline space
        //and if so check to see that first and last major ticks are printed
        if(!tl.isCropped){
            first = tl.ticks.firstDate;
            last = tl.ticks.lastDate;
            proto = new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth(),
                                          first.getUTCDate()-1));
            end = new Date(Date.UTC(last.getUTCFullYear(),
                                        last.getUTCMonth(),
                                        last.getUTCDate()+1));
            tl.ticks.compare(proto, end);
        }
        //set normal ticks
        tl.zoom.current.ticks.normal.all();

        //FIXME: Section below is terrible {
        //For determining needed boundary ticks
        if($(tl.ticks.normal.firstElem).is(':nth-child(2)')){
            first = tl.ticks.normal.firstDate;
            proto = new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth(),
                                          1));
            tl.ticks.add(proto, 'g.tick');
        }
        
        //FIXME: Passing from d3 to jQuery to d3 in order to check if its the last tick elem.  WAT.
        if(d3.select($(tl.ticks.normal.lastElem)
                     .next()[0]).classed('domain')){
            last = tl.ticks.normal.lastDate;
            end = new Date(Date.UTC(last.getUTCFullYear()+1,
                                        last.getUTCMonth()+1,
                                        1));
            tl.ticks.add(end, 'path.domain');
        }
        // } End terrible

        tl.ticks.setAll();

        //update boundary ticks
        tl.zoom.current.ticks.boundary.all();

        tl.ticks.boundary.all.classed('tick-labeled',true);

    };

    var initTicks = function(){
        tl.ticks.boundary.init();
        tl.ticks.normal.init();
        tl.ticks.normal.set(); //could probably combine set and bind
        tl.ticks.normal.bind();
        tl.ticks.boundary.set();
        tl.ticks.boundary.bind();
    };

    var init = function(){

        //Default zoom
        self.level3();
    };

    init();
    return self;
};
