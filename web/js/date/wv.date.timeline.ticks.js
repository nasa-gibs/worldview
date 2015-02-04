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
 * Perform timeline tick functions
 *
 * @class wv.date.timeline.ticks
 */
wv.date.timeline.ticks = wv.date.timeline.ticks || function(models, config, ui) {

    var tl = ui.timeline;

    var self = {};

    self.setAll = function(){
        self.all = d3.selectAll('.x.axis>g.tick');
        self.firstDate = self.all.data()[0];
        self.lastDate = self.all.data()[self.all.data().length-1];
        //remove previous classes for labels
        self.all.classed('tick-labeled',false).classed('label-only',false);

    };
    self.normal = {
        //FIXME: this is actually the ends of all ticks,
        //not just the normal ticks.
        setEnds: function(){  
            var all = self.normal.all;
            self.normal.firstDate = all.data()[0];
            self.normal.firstElem = all[0][0];
            self.normal.lastDate = all.data()[all.data().length-1];
            self.normal.lastElem = all[0][all.length-1];
        }
    };
    self.boundary = {

        init: function(){  //TODO: In progress
            
            var ticks = self.boundary.all;
            ticks.selectAll('line')
                .attr("y1","20")
                .attr("y2","-50");

            ticks.insert("svg:circle","text").attr("r","6");

            ticks.each(function(){
                var current = d3.select(this);
                var currentData = current.data()[0];
                var nextData = tl.zoom.current.ticks.boundary.next(currentData);
                console.log(nextData);
                //console.log(d3.select($(this).next('.tick-labeled')[0]).data()[0]);
            });
            /*
            var nextData = getNextBoundaryTickData(boundaryTickData);
            var nextNormalTickData = getNextNormalTickData(boundaryTickData);

            boundaryTickWidth = x(nextBoundaryTickData) - x(boundaryTickData);

            normalTickWidth = x(nextNormalTickData) - x(boundaryTickData) + 1;

            var subLabel = getSubLabel(boundaryTickData);

            boundaryTick.insert("svg:rect", "text")
                .attr("x","0")
                .attr("y","0")
                .attr("width",boundaryTickWidth)
                .attr("height",height)
                .attr("class","boundarytick-background");

            boundaryTick.append("svg:rect")
                .attr("x","0")
                .attr("y","0")
                .attr("width",boundaryTickWidth)
                .attr("height",height)
                .attr("class","boundarytick-foreground");

            boundaryTick.append("svg:rect")
                .attr("class","normaltick-background")
                .attr("height",height-1)
                .attr("y",-height)
                .attr("x",-0.5)
                .attr("width",normalTickWidth);

            if(subLabel){
                boundaryTick.select('text').append("tspan")
                    .text(" " + subLabel)
                    .attr("class","sub-label");
            }

        });

        boundaryTicks.selectAll('text')
            .attr('class','tick-label')
            .attr('x',7)
            .attr('style','text-anchor:left;');
*/
        }
    };
    self.compare = function(proto, end){
        if(self.firstDate > tl.data.start()){
            //the data and what element to insert it before
            //probably a better way of doing this
            self.add(proto, 'g.tick');
        }
        if(self.lastDate <= wv.util.today()){
            self.add(end, 'path.domain');
        }
    };
    self.add = function(data, elem){
        var tick = tl.axis.insert('g', elem)
            .data([data])
            .attr('class','tick')
            .attr('transform','translate(' + x(data) + ',0)')
            .classed('label-only',true); //if add function is for label only

        var text = data.getUTCFullYear() +
            ' ' + models.date.monthAbbr[data.getUTCMonth()] +
            ' ' + data.getUTCDate();

        tick.append('line')
            .attr('y2',-tl.height);

        tick.append('text')
            .attr('y', '5')
            .attr('dy','.71em')
            .text(text);
    };
    self.hover = {
        //hoverNormalTick()
    };
    self.click = {
        //clickNormalTick()
    };

    self.label = {
        show: function(){
            //showHoverLabel()
        },
        remove: function(){
            
        }
    };

    var init = function(){

    };

    init();
    return self;
};

/**
 * Loaded after setting up wv.date.timeline.zoom
 *
 * @class wv.date.timeline.ticks
 */
/*
wv.date.timeline.ticks.update = function(models, config, ui, current) {
    var tl = ui.timeline;

    var self = {};
    console.log(current.ticks.normal);
    var update = function(){
        tl.ticks.setAll();
        
        //Checks to see if all of the ticks fit onto the timeline space
        //and if so check to see that first and last major ticks are printed
        if(!tl.isCropped){
            var first = tl.ticks.firstDate;
            var last = tl.ticks.lastDate;
            var proto = new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth(),
                                          first.getUTCDate()-1));
            var end = new Date(Date.UTC(last.getUTCFullYear(),
                                        last.getUTCMonth(),
                                        last.getUTCDate()+1));
            tl.ticks.compare(proto, end);
        }
        //set normal ticks
        current.ticks.normal.all();

        //FIXME: Section below is terrible {
        //For determining needed boundary ticks
        if($(tl.ticks.normal.firstElem).is(':nth-child(2)')){
            var first = tl.ticks.normal.firstDate;
            var proto = new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth(),
                                          1));
            tl.ticks.add(proto, 'g.tick');
        }

        //FIXME: Passing from d3 to jQuery to d3 in order to check if its the last tick elem.  WAT.
        if(d3.select($(tl.ticks.normal.lastElem)
                     .next()[0]).classed('domain')){
            var last = tl.ticks.normal.lastDate;
            var end = new Date(Date.UTC(last.getUTCFullYear()+1,
                                        last.getUTCMonth()+1,
                                        1));
            tl.ticks.add(end, 'path.domain');
        }
        // } End terrible

        //update boundary ticks
        current.ticks.boundary.all();
        tl.ticks.boundary.all.classed('tick-labeled',true);

        tl.ticks.boundary.init();
        console.log('ttt');

    };

    update();
};

*/
