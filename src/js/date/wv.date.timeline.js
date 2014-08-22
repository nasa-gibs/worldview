
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
 * @module wv.date
 */
var wv = wv || {};
wv.date = wv.date || {};

/**
 * Undocumented.
 *
 * @class wv.date.timeline
 */
wv.date.timeline = wv.date.timeline || function(models, config, ui) {

    var id = "timeline";
    var selector = "#" + id;
    var DAY_IN_MS = 24*60*60*1000;
    var $container;
    var model = models.date;
    var selectedDateMs = model.selected.getTime();
    var startDateMs = ( model.start ) ? model.start.getTime() : undefined;
    var endDateMs = ( model.end ) ? model.end.getTime() : undefined;
    var selectedDateObj, x,y,line,zoom,xAxis, yAxis, timeline, data2;
    var zoomLvl = 2;
    var zoomInterval = d3.time.month.utc;
    var zoomStep = 1;
    var subInterval = d3.time.day.utc;
    var subStep = 1;
    var zoomScale,axisBgWidth,subAxisBgWidth,smallTicks,guitarPick,chartBody,layers;
    var margin = {
            top: 0,
            right: 0,
            bottom: 35,
            left: 10
        };

    //subtract the datepicker from the width of the screen
    var width;
    var setWidth = function(){width = window.innerWidth - $("#timeline-header").outerWidth() - $("#timeline-zoom").outerWidth() - $("#timeline-hide").outerWidth() - 40;}
    setWidth();
    var height = 75 - margin.top - margin.bottom;

    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var self = {};
    self.NAME = "TEST NAME";
    // TODO: Prefix names with $ to indicate they are jQuery objects
    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");

    var throttleSelect = _.throttle(function(date) {
        model.select(date);
    }, 100, { trailing: true });

    var selection = d3.svg.line()
        .x(function(d){
            return x(d.x);
        })
        .y(function(d){
            return y(d.y);
        });
    var setData = function(){
        layers = [
            {
                "x": model.start,
                "y": model.end
            },
            {
            }
        ];
        data2 = [
            {
                "x": model.selected.getTime(),
                "y": "0" 
            },
            {
                "x": model.selected.getTime(),
                "y": "10"
            }
        ];
        x = d3.time.scale.utc()
            .domain([new Date(1900,0,1), new Date(2100,0,1)])

            //.nice(d3.time.year)
            .range([-200, 2800]);
        /* FIXME: Fix this to be ordinal in place of linear
        */
        y = d3.scale.ordinal()
            .domain(["Data1","Data2","Data3"]) //loaded product data goes here
            .rangeBands([0,height]);
        /*
        y = d3.scale.linear()
            .domain([0,6])
            .range([0,height]);
        */
        xAxis = d3.svg.axis()
            .scale(x)
            //.tickValues(model.start,model.end)
            .orient("bottom")

            //.tickFormat(d3.time.format.multi([["%b %Y", function(d) { return d.getUTCMonth(); }], ["%b %Y", function() { return true; }]]));
            .tickFormat(customTimeFormat2);
        
        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(3);
    
        zoom = d3.behavior.zoom()
            .x(x)
            .scale(170)
            //.translate([-700,0])
            .scaleExtent([1, 3070]) //FIXME: fix scale
            .on("zoom", zoomable, d3.event);
        zoomScale = 1;
    };

    var redrawAxis = function(interval, step){
        //remove all ticks in order to update //FIXME:  Maybe optimize this
        timeline.select(".x.axis").call(xAxis.ticks(0));

        if (interval) { 
            zoomInterval = interval; 
            zoomStep = step;
        }
        timeline.select(".x.axis")
            .call(xAxis.tickSize(-height)
                  .tickPadding(5)
                  .ticks(zoomInterval,zoomStep));

        addSubAxes();

        //UPDATE GUITARPICK
        if (guitarPick){
            guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-20)");
        }

    };
    var addSubAxes = function(){
        var ticks = timeline.selectAll('.x.axis>.tick');

        //general non-specific objects added to all ticks
        ticks.insert("svg:circle","text").attr("r","6");
        ticks.selectAll("line:first-child")
            .attr("y1",-height)
            .attr("y2",margin.bottom);

        d3.selectAll('.x.axis>.tick text').attr('class','tick-label');

        //Draw sub axes for smaller intervals, each tick has date attached
        for (var i=0;i<ticks.data().length-1;i++){

            var tickGroup = timeline.select('.x.axis>.tick:nth-child('+(i+2)+')');
            var tickDate = ticks.data()[i];
            var nextTickDate = ticks.data()[i+1];
            var tickWidth = x(nextTickDate) - x(tickDate);
            var subLabel = getSubLabel(tickDate);
            //draw background (rect)
            tickGroup.insert("svg:rect", "text")
                .attr("x","0")
                .attr("y","0")
                .attr("width",tickWidth)
                .attr("height",height)
                .attr("class","axis-background");
            
            //draw sub-label (high freq)
            if(subLabel){
                tickGroup.append("svg:text")
                    .text(subLabel)
                    .attr("y","30")
                    .attr("class","sub-label");
            }
            var x2 = d3.time.scale.utc()
                .domain([tickDate,nextTickDate])
                .range([0,x(nextTickDate)-x(tickDate)]);

            var xSmallAxis = d3.svg.axis()
                .scale(x2);

            var smallAxis = tickGroup.insert("svg:g","line")
                .attr("class", "subtick")
                .attr("transform", "translate(0,"+ -height +")")
                .call(xSmallAxis.tickSize(height-1).ticks(subInterval,subStep));
            smallAxis.selectAll("text").remove();

            var smallAxisTicks = smallAxis.selectAll('g.subtick > .tick');

            //get background width from one subtick to the next FIXME: probably can be condensed
            var subTickBgWidth =  x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(2)').data()[0]) -
                    x(timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child(1)').data()[0]);

            //draw background (rect) for each subtick and bind subtick mouseenter action
            for (var j=1;j<smallAxisTicks.data().length;j++){

                timeline.select('.x.axis > g.tick:nth-child('+(i+2)+') > g.subtick > g.tick:nth-child('+j+')').append("svg:rect")
                    .attr("class","subtick-background")
                    .attr("height",height-1)
                    .attr("width",subTickBgWidth);
                
            }
        }
        d3.selectAll(".x.axis rect.axis-background").on("click",function(){
            var d = d3.select(this.parentNode).data()[0];
            var newDate;
            switch(zoomLvl){
            case 0:
                var yearOffset = model.selected.getUTCFullYear() - Math.ceil(new Date(model.selected.getUTCFullYear()/10)*10);
                newDate = new Date(d.getUTCFullYear()+yearOffset,model.selected.getUTCMonth(),model.selected.getUTCDate());
                break;
            case 1:
                newDate = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
                break;
            case 2:
                newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
                break;
            case 3:
                newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
                break;
            default:
                break;
            }
            model.select(newDate);

        });
        d3.selectAll('.x.axis>.tick text').attr('x',7).attr('style','text-anchor:left;');

        var timelineTicks = timeline.selectAll('.x.axis>g.tick > g.subtick > g.tick');
        timelineTicks.on("mouseenter",function(d){
            var tickParent = d3.select(this.parentNode.parentNode);
            var tickDate = d;
            var rectWidth = tickParent.select('rect.axis-background').attr("width");

            tickParent.selectAll('.tick-label, .sub-label').attr("visibility","hidden");
            tickParent.append("svg:text")
                .attr("class","hover-tick-label")
                .attr("y","15")
                .attr("x",rectWidth/2)
                .attr("style","text-anchor:middle")
                .text(tickDate.getUTCDate() + " " + monthNames[tickDate.getUTCMonth()]);
            tickParent.append("svg:text")
                .attr("class","hover-sub-label")
                .attr("y","30")
                .attr("x",rectWidth/2)
                .attr("style","text-anchor:middle")
                .text(tickDate.getUTCFullYear());
            
        })
        .on("mouseleave",function(d){
            var tickParent = d3.select(this.parentNode.parentNode);
            tickParent.selectAll('.tick-label, .sub-label').attr("visibility","");
            tickParent.selectAll('.hover-tick-label, .hover-sub-label').remove();
        })
        .on("click",function(d){
            model.select(selectByDateInterval(d));
        });
    };
    var selectByDateInterval = function(d){
        var newDate;
        switch(zoomLvl){
            case 0:
            newDate = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 1:
            newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 2:
            newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
            break;
            case 3:
            newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
            break;
            default:
            return model.selected;
        }
        return newDate;
    };
    var updateTime = function() {
        $('#year-input-group').val(model.selected.getUTCFullYear());
        $('#month-input-group').val(monthNames[model.selected.getUTCMonth()]);
        if (model.selected.getUTCDate()<10){
            $('#day-input-group').val("0" + model.selected.getUTCDate());
        }
        else {
            $('#day-input-group').val(model.selected.getUTCDate());
        }


        guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-20)");
        // Don't grab focus to allow arrow keys to work

        //$('.button-input-group-selected').select();
        //data2[0].date = model.selected.getTime();
        //data2[1].date = data2[0].date;

    };

    var resizeWindow = function(){
        setWidth();
        d3.select('#timeline-footer svg')
            .attr('width', width + margin.left + margin.right);
        timeline.select(".x.axis line:first-child").attr("x2",width);
        //redrawAxis();
    };

    var init = function() {
        setData(); //x,y,xAxis,yAxis,zoom
        incrementBtn
            .mousedown(function() {
                animateForward("day");
            })
            .mouseup(animateEnd);
        decrementBtn
            .mousedown(function() {
                animateReverse("day");
            })
            .mouseup(animateEnd);
        $(document)
            .keydown(function(event) {
                if ( event.target.nodeName === "INPUT" ) {
                    return;
                }
                switch ( event.keyCode ) {
                    case wv.util.key.LEFT:
                        animateReverse("day");
                        event.preventDefault();
                        break;
                    case wv.util.key.RIGHT:
                        animateForward("day");
                        event.preventDefault();
                        break;
                    case wv.util.key.UP:
                        animateForward("month");
                        event.preventDefault();
                        break;
                    case wv.util.key.DOWN:
                        animateReverse("month");
                        event.preventDefault();
                        break;
                }
            })
            .keyup(function(event) {
                if ( event.target.nodeName === "INPUT" ) {
                    return;
                }
                switch ( event.keyCode ) { 
                    case wv.util.key.LEFT:
                    case wv.util.key.RIGHT:
                    case wv.util.key.UP:
                    case wv.util.key.DOWN:
                        animateEnd();
                        event.preventDefault();
                        break;
                }
            });
        
        d3.select('#timeline-footer')
            .append("svg:svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .call(zoom)
            .append("svg:defs")
            .append("svg:clipPath")
            .attr("id","timeline-boundary")
            .append("svg:rect")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        d3.select("#timeline-footer svg defs")
            .append("svg:clipPath")
            .attr("id","guitarpick-boundary")
            .append("svg:rect")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom+10)
            .attr("y","-20");

        timeline = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("clip-path","#timeline-boundary")
            .attr("style","clip-path:url(#timeline-boundary);");

        zoom.translate([width/2 - x(model.selected),0]);

        timeline.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .insert("line",":first-child")
                .attr("x1",-10)
                .attr("x2",width+100);

        redrawAxis(zoomInterval, zoomStep);

        $('#zoom-decades').addClass("depth-3").css("margin","5px 0 0 0");
        $('#zoom-years').addClass("depth-2");
        $('#zoom-months').addClass("depth-1");
        $('#zoom-weeks').addClass("depth-2").css("margin","10px 0 0 0");
        //Add y axis and remove labels

        verticalAxis = timeline.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        verticalAxis.selectAll("text").remove();


        //Plot data
        var chartBody = timeline.append("svg:g")
            .attr("style","clip-path:url(#timeline-boundary)")
            .attr("clip-path","#timeline-boundary")
            .attr("height",height);
        /*chartBody.append("svg:path")
            .datum(layers)
            .attr("class","layer-bar")
            .attr("d", bar);
*/

        //Add guitar pick

        guitarPick = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("id","guitarpick")
            .attr("style","clip-path:url(#guitarpick-boundary);")
            .append("svg:g")
            .attr("transform","translate("+(x(model.selected)-28)+",-20)");

        guitarPick.append("svg:path")
            .attr("d", "M 7.3151,0.7426 C 3.5507,0.7426 0.5,3.7926 0.5,7.5553 l 0,21.2724 14.6038,15.7112 14.6039,15.7111 14.6038,-15.7111 14.6037,-15.7112 0,-21.2724 c 0,-3.7627 -3.051,-6.8127 -6.8151,-6.8127 l -44.785,0 z");
        guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","21")
            .attr("y","11");
        guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","28")
            .attr("y","11");
        guitarPick.append("svg:rect")
            .attr("width","4")
            .attr("height","20")
            .attr("x","35")
            .attr("y","11");
        var mousedown = false;
        guitarPick.on("mousedown",function(){  //TODO: Drag slider over small axes
            console.log("mousedown");
            mousedown = true;
            d3.event.preventDefault();
            d3.event.stopPropagation();
//            console.log(d3.mouse(this)[0]);

            
        })
        .on("mouseup",function(){
            mousedown = false;
        });
        d3.select("#timeline-footer svg").on("mousemove",function(){
            if (mousedown){
                var newDate;
                var mouseDate = x.invert(d3.mouse(this)[0]);
                var currentDate = new Date(model.selected);
                switch(zoomLvl){
                    case 0:
                    newDate = new Date(mouseDate.getUTCFullYear(),currentDate.getUTCMonth(),currentDate.getUTCDate());
                    break;
                    case 1:
                    newDate = new Date(mouseDate.getUTCFullYear(),mouseDate.getUTCMonth(),currentDate.getUTCDate());
                    break;
                    case 2:
                    newDate = new Date(mouseDate.getUTCFullYear(),mouseDate.getUTCMonth(),mouseDate.getUTCDate());
                    break;
                    case 3:
                    newDate = new Date(mouseDate.getUTCFullYear(),mouseDate.getUTCMonth(),mouseDate.getUTCDate());
                    break;
                    default:

                    break;
                }
                guitarPick.attr("transform","translate("+ (x(newDate)-28) +",-20)");
                model.select(newDate);
            }
        });
        d3.select(document).on("mouseup",function(){
            if (mousedown){
                mousedown = false;
            }
        });

        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.on('focus',function(e){
            buttons.removeClass('button-input-group-selected');
            $(this).addClass('button-input-group-selected');
            $(this).select();
        });
        $('#timeline-hide').click(function(e){
            var $tl = $('#timeline-footer, #timeline-zoom');
            if($tl.is(':hidden')){
                $tl.show('slow');
                $('#timeline').css('right','10px');
                d3.select('#timeline-footer svg g').attr("clip-path","#timeline-boundary");
                $("#guitarpick").show();
            }
            else{
                $tl.hide('slow');
                $("#guitarpick").hide();
                $('#timeline').css('right','auto');
            }
            
        });
        model.events.on("select", function(){
            updateTime();
        });
        models.layers.events.on("change",function(){
            if(model.start && model.start.getTime() !== startDateMs){
                startDateMs = model.start.getTime();
                //setData();           FIXME: update actual data 
            }
        });

        $("#focus-guard-1").on('focus',function(){
           $("#day-input-group").focus().select(); 
        });
        $("#focus-guard-2").on('focus',function(){
           $("#year-input-group").focus().select(); 
        });
        
        updateTime();
        $('#day-input-group').addClass('button-input-group-selected');
        $('#day-input-group').select();
        $('.button-input-group').change(function(){
            if($(this).hasClass('button-input-group-selected')){
                var selected = $(".button-input-group-selected");
                var YMDInterval = selected.attr('id');
                var newInput = selected.val();
                switch(YMDInterval){
                    case 'year-input-group':
                        selectedDateObj = new Date((new Date(model.selected)).setUTCFullYear(newInput));
                        model.select(selectedDateObj);
                        break;
                    case 'month-input-group':
                        for(var i=0;i<monthNames.length;i++){
                            if(newInput===monthNames[i] || (newInput==i+1) || (newInput===("0"+(i+1)))){
                               selectedDateObj = new Date((new Date(model.selected)).setUTCMonth(i));
                               model.select(selectedDateObj);
                            }
                        }
                        break;
                    case 'day-input-group':
                        if(newInput>0 && newInput<=(new Date(model.selected.getYear(),model.selected.getMonth()+1,0).getDate())){
                            selectedDateObj = new Date((new Date(model.selected)).setUTCDate(newInput));
                            try {
                                model.select(selectedDateObj);
                             }
                            catch(e){
                             //TODO: error catching
                             }
                        }
                        else{
                            //TODO: notice to user goes here
                        }
                        break;
                }
            }        
        });

        $("#day-input-group").blur();
        
        d3.select("#zoom-decades").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoomLevel(0);
        });
        d3.select("#zoom-years").on("click",function(d){
            setZoomLevel(1);
        }); 
        d3.select("#zoom-months").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoomLevel(2);
        }); 
        d3.select("#zoom-weeks").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoomLevel(3);
        });

    }; // /init
    var setZoomLevel = function(interval,mousePos,mouseOffset){
        //console.log(interval);

        zoomLvl = interval;
        switch(zoomLvl){
            case 'decades':
            case 0:
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.year.utc;
            subStep = 1;
            zoomStep = 10;
            zoomScale = 1;
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-decades').addClass("depth-1");
            $('#zoom-years').addClass("depth-2").css("font-size","1.2em");
            $('#zoom-months').addClass("depth-3").css("margin","-3px 0 5px 0");
            $('#zoom-weeks').addClass("depth-4");
            

            break;
            case 'years':
            case 1:
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.month.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 10
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-decades, #zoom-months').addClass("depth-2");
            $('#zoom-years').addClass("depth-1").css("font-size","1.7em");
            $('#zoom-weeks').addClass("depth-3").css("margin","-3px 0 3px 0");

            break;
            case 'months':
            case 2:
            zoomInterval = d3.time.month.utc;
            subInterval = d3.time.day.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 170;
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-decades').addClass("depth-3").css("margin","5px 0 0 0");
            $('#zoom-years').addClass("depth-2");
            $('#zoom-months').addClass("depth-1");
            $('#zoom-weeks').addClass("depth-2").css("margin","10px 0 0 0");

            break;
            case 'weeks':
            case 3:
            zoomInterval = d3.time.week.utc;
            subInterval = d3.time.day.utc;
            subStep = 1;
            zoomStep = 1;
            zoomScale = 570;
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-decades').addClass("depth-4");
            $('#zoom-years').addClass("depth-3").css("margin","5px 0 0 0");
            $('#zoom-months').addClass("depth-2");
            $('#zoom-weeks').addClass("depth-1").css("margin","25px 0 0 0");

            break;
            default:
            zoomInterval = d3.time.year.utc;
            subInterval = d3.time.year.utc;
            subStep = 1;
            zoomStep = 10;
            zoomScale = 1;
        }
        //zoom.translate([-9000,0]);
        zoom.scale(zoomScale);
        if (mousePos){
            zoom.translate([0,0]);
            zoom.translate([-x(mousePos)+width/2-mouseOffset,0]);
        }
        else{
            zoom.translate([0,0]);
            zoom.translate([-x(model.selected)+width/2,0]);
        }
        redrawAxis(zoomInterval,zoomStep);

    };
    var getSubLabel = function(tickDate){
        var sl;
        switch (zoomLvl){
            case 0:
            case 1:
            sl = null;
            break;
            case 2:
            sl = tickDate.getUTCFullYear();
            break;
            case 3:
            sl = monthNames[tickDate.getUTCMonth()] + " " + tickDate.getUTCFullYear();
            break;
            default:
            sl = null;
        }
        return sl;
    };
    var setSmallAxisTickNumbers = function(ticks,i){

        switch (zoomLvl){
            case 0:
            smallTickWidth = ticks.data()[i+1] - ticks.data()[i]/1000/60/60/24/365;
            break;
            case 1:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60/24/30);
            break;
            case 2:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60/24);            
            break;
            case 3:
            smallTickWidth = Math.floor((ticks.data()[i+1].getTime() - ticks.data()[i].getTime())/1000/60/60);
            break;
            
            default:
            
            break;
        }

    };
    var customTimeFormat2 = d3.time.format.utc.multi([
        [".%L", function(d) { return d.getUTCMilliseconds(); }],
        [":%S", function(d) { return d.getUTCSeconds(); }],
        ["%I:%M", function(d) { return d.getUTCMinutes(); }],
        ["%I %p", function(d) { return d.getUTCHours(); }],
        //["%a %d", function(d) { return d.getUTCDay() && d.getDate() != 1; }],
        ["%d", function(d) { return d.getUTCDate() != 1; }],
        ["%b", function(d) { return d.getUTCMonth(); }],
        ["%Y", function(d) { return true; }],
    ]);

    var animateForward = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, 1);
        ui.anim.interval = interval;
        ui.anim.play("forward");
    };
    
    var animateReverse = function(interval) {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(interval, -1);
        ui.anim.interval = interval;
        ui.anim.play("reverse");
    };
    
    var animateEnd = function() {
        ui.anim.stop();
    };
    
    var zoomable = function(e){

        var mousePos = x.invert(d3.mouse(this)[0]);
        var mouseOffset = width/2 - d3.mouse(this)[0];
        var evt = window.event || d3.event.sourceEvent || e;
        var deltaY=evt.deltaY ? evt.deltaY : evt.wheelDeltaY || evt.detail ? evt.detail*(-120) : evt.wheelDelta;
        var deltaX=evt.deltaX ? evt.deltaY : evt.wheelDeltaX;
        if (deltaY < 0){
            //console.log("Up");
            if (zoomLvl < 3){
                zoomLvl++;
                setZoomLevel(zoomLvl,mousePos,mouseOffset);
            }
        }
        else if (deltaY > 0){
            //console.log("Down")
            if (zoomLvl > 0){
                zoomLvl--;
                setZoomLevel(zoomLvl,mousePos,mouseOffset);
            }
        }
        else{
            redrawAxis();
        }
    };
    self.test = "TESTING VAR";
    init();
    $(window).resize(resizeWindow);

    return self;
};
