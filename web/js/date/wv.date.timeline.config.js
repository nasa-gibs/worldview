/**
 * Modify zoom levels here. Maybe this isnt the best way to do this.
 * It could be called just level without the zoom part instead.
 *
 * When the zoom level is changed, this re renders everything of the timeline.
 *
 * @class wv.date.timeline.config
 */

wv.date.timeline.config = wv.date.timeline.config || function(models, config, ui) {
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

        tl.ticks.check();
        initTicks();

    };

    //Draw ticks based on zoom level
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
