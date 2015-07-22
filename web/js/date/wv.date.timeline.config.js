/**
 * Modify zoom levels here. Maybe this isnt the best way to do this.
 * It could be called just level without the zoom part instead.
 *
 * When the zoom level is changed, this re renders everything of the timeline.
 *
 * @class wv.date.timeline.config
 */

var wv = wv || {};
wv.date = wv.date || {};
wv.date.timeline = wv.date.timeline || {};

wv.date.timeline.config = wv.date.timeline.config || function(models, config, ui) {
    var self = {};
    var tl = ui.timeline;
    var model = models.date;

    self.zoom = function(level, event){

        //format of the label
        var labelFormat;
        //printed type of tick
        var dateInterval;
        //step of the ticks, here difference between ticks is always 1
        var dateStep = 1;
        //number of ticks total of data range, in days
        var tickCount;
        //Calculated max number of ticks based on tickCount
        var tickCountMax;
        //width in pixels of each tick
        var tickWidth;
        //end tick date if tickCount is less than tickCountMax
        var altEnd;
        var paddedRange;

        switch(level){
        case 1:
            labelFormat = d3.time.format.utc("%Y");
            dateInterval = d3.time.year.utc;
            tickCount = tl.data.end().getUTCFullYear() - tl.data.start().getUTCFullYear();
            tickWidth = 15;
            tickCountMax = Math.ceil(tl.width/tickWidth);

            paddedRange = [new Date(tl.data.start()
                                    .setUTCFullYear(tl.data.start().getUTCFullYear()-10)),
                           new Date(tl.data.end()
                                    .setUTCFullYear(tl.data.end().getUTCFullYear()+10))];

            altEnd = new Date(tl.data.start().getUTCFullYear() + tickCountMax,
                              tl.data.start().getUTCMonth(),
                              tl.data.start().getUTCDate());



            tl.zoom.drawTicks(tickCount,
                              tickCountMax,
                              altEnd,
                              tickWidth,
                              dateInterval,
                              dateStep,
                              labelFormat,
                              event,
                              paddedRange);

            //Filters ticks for nonboundaries for this zoom level
            tl.zoom.current.ticks.normal.all = function(){
                tl.ticks.normal.all = tl.ticks.all.filter(function(d){
                    return d.getUTCFullYear() % 10 !== 0;
                });
                tl.ticks.normal.setEnds();
            };

            //Filters ticks for boundaries for this zoom level
            tl.zoom.current.ticks.boundary.all = function(){
                tl.ticks.boundary.all = tl.ticks.all.filter(function(d){
                    return d.getUTCFullYear() % 10 === 0;
                });
            };

            //Calculated next boundary tick by date
            tl.zoom.current.ticks.boundary.next = function(current){
                var next = new Date(current);
                return new Date(next.setUTCFullYear(next.getUTCFullYear()+10));
            };

            //Calculated next normal tick by date
            tl.zoom.current.ticks.normal.next = function(current){
                var next = new Date(current);
                return new Date(next.setUTCFullYear(next.getUTCFullYear()+1));
            };

            //Date of first printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.first = function(){
                var first = tl.ticks.normal.firstDate;
                return new Date(Date.UTC(Math.floor(first.getUTCFullYear()/10)*10,
                                         0,
                                         1));
            };

            //Date of first printed normal tick
            tl.zoom.current.ticks.normal.first = function(){
                var first = tl.ticks.firstDate;
                return new Date(Date.UTC(first.getUTCFullYear() - 1,
                                          first.getUTCMonth(),
                                          first.getUTCDate()));
            };

            //Date of last printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.last = function(){
                var last = tl.ticks.normal.lastDate;
                return new Date(Date.UTC(Math.ceil(last.getUTCFullYear()/10)*10,
                                         0,
                                         1));
            };

            //Value for hovered normal label
            tl.zoom.current.ticks.normal.hover = function(d){
                //No modifications to date obj at this zoom level
                return new Date(d.getUTCFullYear(),
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //Value for clicked normal tick
            tl.zoom.current.ticks.normal.clickDate = function(d){
                return new Date(d.getUTCFullYear(),
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //Value for hovered boundary tick
            tl.zoom.current.ticks.boundary.hover = function(d){
                var yearOffset = model.selected.getUTCFullYear() -
                    Math.ceil(new Date(model.selected.getUTCFullYear()/10)*10);

                return new Date(d.getUTCFullYear() + yearOffset,
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //Displayed default label
            tl.zoom.current.ticks.boundary.label = function(d){
                return d.getUTCFullYear();
            };

            //Displayed default sub-label (if any)
            tl.zoom.current.ticks.boundary.subLabel = function(d){
                return null;
            };

            //Value for clicked boundary tick, FIXME: This is exactly the same as hover value
            tl.zoom.current.ticks.boundary.clickDate = function(d){
                var yearOffset = model.selected.getUTCFullYear() -
                    Math.ceil(new Date(model.selected.getUTCFullYear()/10)*10);

                return new Date(d.getUTCFullYear() + yearOffset,
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //When the date updates while dragging the pick forward
            tl.zoom.current.pick.nextChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear() + 1,
                                         model.selected.getUTCMonth(),
                                         model.selected.getUTCDate()));
            };

            //When the date updates while dragging the pick backward
            tl.zoom.current.pick.prevChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear(),
                                         model.selected.getUTCMonth(),
                                         model.selected.getUTCDate()));
            };

            tl.zoom.current.pick.hoverTick = function(newDate){
                tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
                    .filter(function(d){
                        return d.getUTCFullYear() === newDate.getUTCFullYear();
                    });
            };



            //Update placement of zoom buttons
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-years').addClass("depth-1").css("font-size","1.7em");
            $('#zoom-months').addClass("depth-2").css("font-size","1.2em");
            $('#zoom-days').addClass("depth-3").css("margin","-3px 0 5px 0");

            self.currentZoom = 1;
            break;
        case 2:
            labelFormat = d3.time.format.utc("%Y");
            dateInterval = d3.time.month.utc;

            tickCount = (tl.data.end().getUTCFullYear() -
                         tl.data.start().getUTCFullYear()) * 12 +
                tl.data.end().getUTCMonth() + 1 -
                tl.data.start().getUTCMonth();

            tickWidth = 11;
            tickCountMax = Math.ceil(tl.width/tickWidth);

            paddedRange = [new Date(tl.data.start()
                                    .setUTCFullYear(tl.data.start().getUTCFullYear()-1)),
                           new Date(tl.data.end()
                                    .setUTCFullYear(tl.data.end().getUTCFullYear()+1))];

            altEnd = new Date(tl.data.start().getUTCFullYear(),
                              tl.data.start().getUTCMonth() + tickCountMax,
                              tl.data.start().getUTCDate());

            tl.zoom.drawTicks(tickCount,
                              tickCountMax,
                              altEnd,
                              tickWidth,
                              dateInterval,
                              dateStep,
                              labelFormat,
                              event,
                              paddedRange);

            //Filters ticks for nonboundaries for this zoom level
            tl.zoom.current.ticks.normal.all = function(){
                tl.ticks.normal.all = tl.ticks.all.filter(function(d){
                    return d.getUTCMonth() !== 0;
                });
                tl.ticks.normal.setEnds();
            };

            //Filters ticks for boundaries for this zoom level
            tl.zoom.current.ticks.boundary.all = function(){
                tl.ticks.boundary.all = tl.ticks.all.filter(function(d){
                    return d.getUTCMonth() === 0;
                });
            };

            //Calculated next boundary tick by date
            tl.zoom.current.ticks.boundary.next = function(current){
                var next = new Date(current);
                return new Date(next.setUTCFullYear(next.getUTCFullYear()+1));
            };

            //Calculated next normal tick by date
            tl.zoom.current.ticks.normal.next = function(current){
                var next = new Date(current);
                return new Date(next.setUTCMonth(next.getUTCMonth()+1));
            };

            //Date of first printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.first = function(){
                var first = tl.ticks.normal.firstDate;
                return new Date(Date.UTC(first.getUTCFullYear(),
                                         0,
                                         1));
            };

            //Date of first printed normal tick
            tl.zoom.current.ticks.normal.first = function(){
                var first = tl.ticks.normal.firstDate;
                return new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth() - 1,
                                          first.getUTCDate()));
            };

            //Date of last printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.last = function(){
                var last = tl.ticks.normal.lastDate;
                return new Date(Date.UTC(last.getUTCFullYear()+1,
                                         0,
                                         1));
            };

            //Value for hovered normal label
            tl.zoom.current.ticks.normal.hover = function(d){
                //No modifications to date obj at this zoom level
                return new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
            };

            //Value for clicked normal tick
            tl.zoom.current.ticks.normal.clickDate = function(d){
                return new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
            };

            //Value for hovered boundary tick
            tl.zoom.current.ticks.boundary.hover = function(d){
                return new Date(d.getUTCFullYear(),
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //Displayed default label
            tl.zoom.current.ticks.boundary.label = function(d){
                return d.getUTCFullYear();
            };

            //Displayed default sub-label (if any)
            tl.zoom.current.ticks.boundary.subLabel = function(d){
                return null;
            };

            //Value for clicked boundary tick
            tl.zoom.current.ticks.boundary.clickDate = function(d){
                return new Date(d.getUTCFullYear(),
                                model.selected.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //When the date updates while dragging the pick forward
            tl.zoom.current.pick.nextChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear(),
                                         d.getUTCMonth()+1,
                                         model.selected.getUTCDate()));
            };

            //When the date updates while dragging the pick backward
            tl.zoom.current.pick.prevChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear(),
                                         d.getUTCMonth(),
                                         model.selected.getUTCDate()));
            };

            tl.zoom.current.pick.hoverTick = function(newDate){
                tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
                    .filter(function(d){
                        return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                            (d.getUTCMonth() === newDate.getUTCMonth());
                    });
            };

            //Update placement of zoom buttons
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-days').addClass("depth-2").css("margin","5px 0 0 0");
            $('#zoom-years').addClass("depth-2");
            $('#zoom-months').addClass("depth-1").css("font-size","1.7em");

            self.currentZoom = 2;
            break;
        case 3:
            labelFormat = d3.time.format.utc("%b");
            dateInterval = d3.time.day.utc;
            tickCount = (tl.data.end() - tl.data.start())/1000/60/60/24;
            tickWidth = 11;
            tickCountMax = Math.ceil(tl.width/tickWidth);

            paddedRange = [new Date(tl.data.start()
                                    .setUTCDate(tl.data.start().getUTCDate()-15)),
                           new Date(tl.data.end()
                                    .setUTCDate(tl.data.end().getUTCDate()+15))];

            altEnd = new Date(tl.data.start().getUTCFullYear(),
                              tl.data.start().getUTCMonth(),
                              tl.data.start().getUTCDate() + tickCountMax);

            tl.zoom.drawTicks(tickCount,
                              tickCountMax,
                              altEnd,
                              tickWidth,
                              dateInterval,
                              dateStep,
                              labelFormat,
                              event,
                              paddedRange);

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

            //Date of first printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.first = function(){
                var first = tl.ticks.normal.firstDate;
                return new Date(Date.UTC(first.getUTCFullYear(),
                                         first.getUTCMonth(),
                                         1));
            };

            //Date of first printed normal tick
            tl.zoom.current.ticks.normal.first = function(){
                var first = tl.ticks.normal.firstDate;
                return new Date(Date.UTC(first.getUTCFullYear(),
                                          first.getUTCMonth(),
                                          first.getUTCDate() - 1));
            };

            //Date of last printed boundary interval of this zoom level
            tl.zoom.current.ticks.boundary.last = function(){
                var last = tl.ticks.normal.lastDate;
                return new Date(Date.UTC(last.getUTCFullYear(),
                                         last.getUTCMonth()+1,
                                         1));
            };

            //Value for hovered normal label
            tl.zoom.current.ticks.normal.hover = function(d){
                //No modifications to date obj at this zoom level
                return d;
            };

            //Value for clicked normal tick
            tl.zoom.current.ticks.normal.clickDate = function(d){
                return new Date(d.getUTCFullYear(),
                                d.getUTCMonth(),
                                d.getUTCDate());
            };

            //Value for hovered boundary tick
            tl.zoom.current.ticks.boundary.hover = function(d){
                return new Date(d.getUTCFullYear(),
                                d.getUTCMonth(),
                                model.selected.getUTCDate());
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
                return new Date(d.getUTCFullYear(),
                                d.getUTCMonth(),
                                model.selected.getUTCDate());
            };

            //When the date updates while dragging the pick forward
            tl.zoom.current.pick.nextChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear(),
                                         d.getUTCMonth(),
                                         d.getUTCDate()+1));
            };

            //When the date updates while dragging the pick backward
            tl.zoom.current.pick.prevChange = function(d){
                return new Date(Date.UTC(d.getUTCFullYear(),
                                         d.getUTCMonth(),
                                         d.getUTCDate()));
            };

            tl.zoom.current.pick.hoverTick = function(newDate){
                tl.zoom.current.pick.hoveredTick = d3.selectAll('.x.axis>g.tick')
                    .filter(function(d){
                        return (d.getUTCFullYear() === newDate.getUTCFullYear()) &&
                            (d.getUTCMonth() === newDate.getUTCMonth() &&
                             (d.getUTCDate() === newDate.getUTCDate()));
                    });
            };

            d3.selectAll('.x.axis > g.tick').each(function(){
                var currentTick = d3.select(this);
                var currentTickData = currentTick.data()[0];
                if ((currentTickData.getUTCDay() === 0) &&
                    (currentTickData.getUTCDate() !== 1)){
                    currentTick
                        .insert('line','rect')
                        .attr('y1',0)
                        .attr('y2',-10)
                        .attr('x2',0)
                        .classed('tick-week',true);
                }
            });

            //Update placement of zoom buttons
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-years').addClass("depth-3").css("margin","6px 0 0 0");
            $('#zoom-months').addClass("depth-2");
            $('#zoom-days').addClass("depth-1")
                .css("margin", "2px 0 0 0")
                .css('font-size','1.8em');

            self.currentZoom = 3;
            break;

        default:
            console.log('Invalid Zoom level');
        }

        //TODO: Maybe group check, initTicks, and removePadding
        tl.ticks.check();
        initTicks();

        tl.pick.update();
        tl.pick.checkLocation();

        //Update date pickers when timeline zoom level changes.
        //We need to check tl.input because this executes when page is loaded
        if(tl.input !== undefined && tl.input !== undefined)
            if(tl.input.fromDate !== undefined && tl.input.toDate !== undefined) {
                d3.select("#fromPick").attr("transform", tl.pick.updateAnimPickers(tl.input.fromDate));
                d3.select("#toPick").attr("transform", tl.pick.updateAnimPickers(tl.input.toDate));
            }

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

        d3.select("#zoom-years").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            self.zoom(1);
        });
        d3.select("#zoom-months").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            self.zoom(2);
        });
        d3.select("#zoom-days").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            self.zoom(3);

        });
        //Default zoom
        self.zoom(3);
        tl.setClip(); //fix for firefox svg overflow

        //Safe to translate the animation date pickers once to default positions
        var tempDate = new Date(model.selected.valueOf());
        tempDate.setUTCDate(tempDate.getUTCDate() - 14);
        d3.select("#fromPick").attr("transform", ui.timeline.pick.updateAnimPickers(tempDate));
        d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(model.selected));
    };

    init();
    return self;
};
