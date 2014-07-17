

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

    var sliderContent = [];
    var $container;
    var model = models.date;
    var svg;
    var timelineJumpInPix, zoomScale;
    var jumpInterval;
    var selectedDateObj;
    var selectedDateMs = model.selected.getTime();
    var startDateMs = model.start.getTime();
    var endDateMs = model.end.getTime();
    var buttonInterval = "day";
    
    //this is where the data would go for showing available dates
    var data = [];
    var data2 = [];
    var x,y,line,zoom,xAxis,hoverLineGroup,hoverLine;
    //margins for the timeline
    margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };

    //subtract the datepicker from the width of the screen
    width = window.innerWidth - $("#timeline header").outerWidth() - 20;
    height = 60 - margin.top - margin.bottom;
    //var currentDate = new Date(data2[0].date);
    var dateTimestamp;
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var self = {};
    
    // TODO: Prefix names with $ to indicate they are jQuery objects
    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");

    var throttleSelect = _.throttle(function(date) {
        model.select(date);
    }, 100, { trailing: true });

    var setData = function(){
        data = [
            {
            "date": model.start,
            "value": "5"
            },
            {
            "date": model.end,
            "value": "5"
            }
        ];
        //Current date line
        data2 = [
            {
            "date": model.selected.getTime(),
            "value": "0" 
            },
            {
            "date": model.selected.getTime(),
            "value": "6"
            }
        ];
        x = d3.time.scale.utc()
            .domain([
                d3.min(data, function(d) { return d.date; }),
                d3.max(data, function(d) { return d.date; })
            ])
            .range([0, width]);

        y = d3.scale.linear()
            .domain(d3.extent(data2, function (d) {
                return d.value;
            }))
            .range([height, 0]);
        line = d3.svg.line()
            .x(function (d) {
                return x(d.date);
            })
            .y(function (d) {
                return y(d.value);
            });

        xAxis = make_x_axis(x);

        zoom = d3.behavior.zoom()
            .x(x)
            .scaleExtent([1, 100])
            .on("zoom", zoomable, d3.event);

        try{
            redrawAxis();
        }
        catch(e){
            console.log("error is following:" + e);
        }

    
    };
    var redrawAxis = function(){
        if (!svg){return;}
        svg.select(".x.axis").call(xAxis);

        svg.select(".x.grid")
            .call(make_x_axis(x)
            .tickSize(-60, 0, 0)
            .tickFormat(""));
        svg.select(".line")
            .attr("class", "line")
            .attr("d", line);
        svg.select(".line2")
            .attr("class", "line2")
            .attr("d", line);

        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        d3.select(".line").datum(data).attr("d", line);
        d3.select(".line2").datum(data2).attr("d", line);
        updateTime();

        d3.select('#timeline footer');
    };
    var redraw = function(){
        //resizing window redrawing goes here
        
        width = window.innerWidth - $("#timeline header").outerWidth() - 20;
        
        d3.select('#timeline footer svg')
            .attr('width', width + margin.left + margin.right);
            
        d3.select("rect.plot")
            .attr("width", width);
        d3.select("#clip")
            .attr("width", width);
            
        x.range([0, width]);
        
        redrawAxis();
    };
    //not using
    var zoomed = function(){
        var t = zoom.translate(),
        s = zoom.scale();
        console.log(s);
        tx = Math.min(0, Math.max(width * (1 - s), t[0]));
        ty = Math.min(0, Math.max(height * (1 - s), t[1]));
        zoom.translate([tx, ty]);
        
        redrawAxis();
        
        if(($("svg#now-line").offset().left) < ($("#timeline footer").offset().left)){
            $("svg#now-line").css("visibility","hidden");

        }
        else{
            $("svg#now-line").css("visibility","visible");

        }
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
    };
    function timeFormat(formats) {
        return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            return f[0](date);
        };
    }
    function customTickFunction(t0, t1, dt)
    {
        console.log(t0);
        console.log(t1);
        console.log(dt);
        var labelSize = 30; // largest label is 23 pixels ("May")
        var maxTotalLabels = Math.floor(width / labelSize);
        
        function step(date, offset)
        {
            date.setMonth(date.getMonth() + offset);
        }
        
        var time = d3.time.month.ceil(t0), times = [], monthFactors = [2,3,4,6];
        
        while (time < t1) times.push(new Date(+time)), step(time, 1);
        
        var i;
        for(i=1 ; times.length > maxTotalLabels ; i++)
            times = _.filter(times, function(d){
                return (d.getMonth()) % monthFactors[i] == 0;
            });
        
        return times;
    }
    var make_x_axis = function (x) {
        return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(7)//.tickFormat(d3.time.format("%Y %b %d"));
            .tickFormat(customTimeFormat2);
    };
    var customTimeFormat = timeFormat([
        [d3.time.format("%Y"), function() { return true; }],
        [d3.time.format("%b"), function(d) { return d.getMonth(); }],
        [function(){return "";}, function(d) { return d.getDate() != 1; }]
    ]);
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
    var format = d3.time.format.multi([
        [".%L", function(d) { return d.getMilliseconds(); }],
        [":%S", function(d) { return d.getSeconds(); }],
        ["%I:%M", function(d) { return d.getMinutes(); }],
        ["%I %p", function(d) { return d.getHours(); }],
        ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
        ["%b %d", function(d) { return d.getDate() != 1; }],
        ["%B", function(d) { return d.getMonth(); }],
        ["%Y", function() { return true; }]
    ]);

    var animateForward = function() {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(buttonInterval, 1);
        ui.anim.interval = buttonInterval;
        ui.anim.play("forward");
    };
    
    var animateReverse = function() {
        if ( ui.anim.active ) {
            return;
        }
        models.date.add(buttonInterval, -1);
        ui.anim.interval = buttonInterval;
        ui.anim.play("reverse");
    };
    
    var animateEnd = function() {
        ui.anim.stop();
    };
    
    var init = function() {
        setData();
        
        incrementBtn
            .mousedown(animateForward)
            .mouseup(animateEnd);
        decrementBtn
            .mousedown(animateReverse)
            .mouseup(animateEnd);
            
        svg = d3.select('#timeline footer')
            .append("svg:svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);

        svg.append("svg:rect")
            .attr("width", width)
            .attr("height", 60)
            .attr("class", "plot");



        svg.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + 30 + ")")
            .call(xAxis);



        svg.append("g")
            .attr("class", "x grid")
            .attr("transform", "translate(0," + 60 + ")")
            .call(make_x_axis(x)
                .tickSize(-60, 0, 0));

        var clip = svg.append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", 60);

        var chartBody = svg.append("g")
            .attr("clip-path", "url(#clip)").attr("height", 60);

        chartBody.append("svg:path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        chartBody.append("svg:path")
            .datum(data2)
            .attr("class", "line2")
            .attr("d", line);
        
        

        var firstTick = svg.select(".x.axis .tick:first-child text");
        var firstTickData = firstTick.data()[0];
        console.log(firstTickData.getUTCFullYear());
        svg.select(".x.axis").insert("g",":first-child")
            .attr("class", "first")
            .attr("transform", "translate(5," + 23 + ")")
            .append("text").text(firstTickData.getUTCFullYear());


        updateTimeline();
        
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        if (zoom.scale() === 1){
            console.log("True!");
        }

        console.log((new Date(2014, 0, 1) - new Date(2011, 0, 1))/DAY_IN_MS);
        
        // Hover line.
        hoverLineGroup = svg.append("g")
                            .attr("class", "hover-line");
        hoverLine = hoverLineGroup
            .append("line")
                    .attr("x1", 10).attr("x2", 10)
                    .attr("y1", 0).attr("y2", height);

        // Hide hover line by default.
        hoverLineGroup.style("opacity", 1e-6);
        
        /****************************** TIMELINE LINES ************************************/
        
        d3.select("#timeline footer")
          .on("mouseenter", function() { 
            $("#timeline-text").show();
            hoverLineGroup.style("opacity", 1);
          })
          .on("mousemove", bindTimelineMouseMove)
          .on("mouseleave", function() {
            hoverLineGroup.style("opacity", 1e-6);
            $("#timeline-text").hide();
          })
          .on("click", bindUpdateOnFooter);
        /*.on("mousedown",function(){
            mouse_x_start = d3.mouse(this)[0];
            var mouse_x_jump = mouse_x_start + timelineJump;
            console.log("$$$$$$$$$$$$ ");
          })*/ 
        d3.select("#timeline footer svg")
            .on("mousewheel.zoom", null)
            .on("DOMMouseScroll.zoom", null)
            .on("dblclick.zoom", null)
            .on("onwheel",null)
            .on("mousewheel",null)
            .on("onmousewheel",null)
            .on("wheel",null)
            .on("MozMousePixelScroll",null);

        $("svg#now-line")
          .mousedown(function(e){
            e.preventDefault();
            d3.select("#timeline footer")
              .on("mousemove", bindUpdateOnFooter);
          })
          .mouseup(function(){
            d3.select("#timeline footer")
              .on("mousemove", null);
            d3.select("#timeline footer")
              .on("mousemove", bindTimelineMouseMove);
          });
        /**************************END TIMELINE LINES****************************/
        
        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.on('focus',function(e){
            // e.stopPropagation();
            // e.preventDefault();
            buttons.removeClass('button-input-group-selected');
            $(this).addClass('button-input-group-selected');
            jumpInterval = $(this).attr('id');
            switch(jumpInterval){
                case 'year-input-group':
                    buttonInterval = "year";
                    break;
                case 'month-input-group':
                    buttonInterval = "month";
                    break;
                case 'day-input-group':
                    buttonInterval = "day";
                    break;
                default:
                    alert("cannot find selected interval!");
                    break;
            }
            updateBarSpeed();
            $(this).select();
        });

        model.events.on("select", function(){
            updateTime();
        });
        models.layers.events.on("change",function(){
            if(model.start && model.start.getTime() !== startDateMs){
                startDateMs = model.start.getTime();
                setData();            
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

        $("#timeline-zoom").hover(function(e){
            $("#timeline footer").css("background","rgba(40,40,40,0.9)");
        },function(e){
            $("#timeline footer").css("background","");
        });
        $("#timeline-zoom input").on("input",function(e){
            var testZoomLevel = $(this).val();
            if (zoomLevel != testZoomLevel){
                switch(testZoomLevel){
                case '0':
                    zoomScale = 1;
                    break;
                    
                case '1':
                    zoomScale = 2;
                    break;
                case '2':
                    zoomScale = 4;
                    break;
                case '3':
                    zoomScale = 20;
                    break;
                case '4':
                    zoomScale = 60;
                    break;
                default:
                    console.log("Doesn't work");
                }
                //console.log(zoom.scale());
                zoomLevel = testZoomLevel;
                zoom.scale(zoomScale);
                tx = Math.min(0, width * (1 - zoomScale));
                ty = Math.min(0, height * (1 - zoomScale));
                zoom.translate([tx, ty]);
                redrawAxis();
                var firstTickZ = svg.select(".x.axis .tick:nth-child(2) text");
                var firstTickDataZ = firstTickZ.data()[0];
                console.log(firstTickZ);
                if ((zoomScale === 20) || (zoomScale === 60)){
                    console.log("Correct" + firstTickDataZ.getUTCMonth());
                    svg.select(".x.axis .first text").text(firstTickDataZ.getUTCFullYear() + 
                            " " + monthNames[firstTickDataZ.getUTCMonth()]);
                }
                else{
                    
                    svg.select(".x.axis .first text").text(firstTickDataZ.getUTCFullYear());

                    }
            }
        });
        $("#timeline-hide").click(function(e){
            var tl = $("#timeline footer");
            if(tl.is(":hidden"))
            {
                tl.show("slow");
                $("#timeline-zoom input").show();
                $("#timeline-hide").text("Hide Timeline");
                $("#timeline-zoom").css("right","10px");
                $("#timeline-zoom").css("left","auto");
                $("#now-line").show();

            }
            else{
                tl.hide("slow");
                $("#timeline-zoom input").hide();
                $("#timeline-hide").text("Show Timeline");
                $("#timeline-zoom").css("left","183px");
                $("#timeline-zoom").css("right","auto");
                $("#now-line").hide();
            }

        });

    }; // /init
    var incrementZoom = function(){

    };
    var zoomable = function(e){
        var tempVal;
        var sliderVal = parseInt($("#timeline-zoom input").val());

        var evt = window.event || d3.event.sourceEvent || e;
        var delta=evt.deltaY ? evt.deltaY : evt.wheelDeltaY || evt.detail ? evt.detail*(-120) : evt.wheelDelta;
        if (delta < 0){
            
            tempVal = sliderVal + 1;
        }
        else{
            tempVal = sliderVal - 1;
        }
        if ((tempVal >= 0) && (tempVal <= 4)){
            $("#timeline-zoom input").val(tempVal).trigger("input");
        }
        else
            return;
    };
    var bindTimelineMouseMove = function() {
        var mouse_x = d3.mouse(this)[0];
        var graph_x = x.invert(mouse_x);
        var format = d3.time.format('%e %b');
        //format.parse(graph_x)
        var stringDate = String(graph_x).split(' ');
        $("#timeline-text").text(stringDate[3] + " " + stringDate[1] + " " + stringDate[2]); //FIXME: Use d3 time formatting
        hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
        if ((mouse_x > (x(data2[0].date)- 3)) && (mouse_x < (x(data2[0].date) + 6))){
            hoverLineGroup.style("opacity", 1e-6);
            $("#timeline-text").hide();
            $(".line2").css("stroke","#fff");
        }else {
            $("#timeline-text").show();
            hoverLineGroup.style("opacity", 1);
            $(".line2").css("stroke","transparent");
        }
        $("#timeline-text").css({"left": d3.event.pageX});
            
    };
    
    var bindUpdateOnFooter = function(){
        var mouse_x = d3.mouse(this)[0];
        throttleSelect(x.invert(mouse_x));
    };
    
    var bindMouseOnFooter = function(d3){
        var mouse_x = d3.mouse(this)[0];
        var graph_x = x.invert(mouse_x);
        var format = d3.time.format('%e %b');
        //format.parse(graph_x)
        var stringDate = String(graph_x).split(' ');
        $("#timeline-text").text(stringDate[3] + " " + stringDate[1] + " " + stringDate[2]); //FIXME: Use d3 time formatting
        hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
        if ((mouse_x > (x(data2[0].date)- 3)) && (mouse_x < (x(data2[0].date) + 6))){
            hoverLineGroup.style("opacity", 1e-6);
            $("#timeline-text").hide();
            $(".line2").css("stroke","#fff");
        }else {
            $("#timeline-text").show();
            hoverLineGroup.style("opacity", 1);
            $(".line2").css("stroke","transparent");
        }
        $("#timeline-text").css({"left": d3.event.pageX});
    };

    var updateTimeline = function(){
        //update timeline line
        
        // FIXME: This is invoked before svg is initialized
        if ( !svg ) { return ; }
        
        svg.select(".line2").attr("d", line);
        var line2Pos = $(".line2").offset();
        $("svg#now-line").css("left", (line2Pos.left-3) + "px");
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
        //remove selection when clicking too fast
        //document.getSelection().removeAllRanges();
        //$('.button-input-group-selected').select();
        data2[0].date = model.selected.getTime();
        data2[1].date = data2[0].date;
        updateTimeline();
        
    };
    var updateBarSpeed = function(){
        var currentElement = $(".button-input-group-selected").attr("id");
        var dateNow = new Date(data2[0].date);
        switch (currentElement)
        {
            case 'year-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setUTCFullYear(dateNow.getUTCFullYear() - 1) );
                break;
            case 'month-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setUTCMonth(dateNow.getUTCMonth() - 1) );
                break;
            case 'day-input-group':
                timelineJumpInPix = x(dateNow) - x( dateNow.setUTCDate(dateNow.getUTCDate() - 1) );
                break;
        }
    };
    init();
    $(window).resize(redraw);

    return self;
};
