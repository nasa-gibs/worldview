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
wv.date.timeline = wv.date.timeline || function(models, config) {


    var id = "timeline";
    var selector = "#" + id;
    var DAY_IN_MS = 24*60*60*1000;

    var sliderContent = [];
    var $container;
    var model = models.date;
    var svg;
    var timelineJumpInPix;
    var jumpInterval;
    var selectedDateObj;
    var selectedDateMs = model.selected.getTime();
    var startDateMs = model.start.getTime();
    var endDateMs = model.end.getTime();

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
    
    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");

    
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
        x = d3.time.scale()
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

        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);

        zoom = d3.behavior.zoom()
            .x(x)
            .scaleExtent([1, 100])
            .on("zoom", zoomed);

        try{
            redrawAxis();
        }
        catch(e){
            console.log("error is following:" + e);
        }

    
    };
    var redrawAxis = function(){
        d3.select(".axis").call(xAxis);
        d3.select(".grid").call(make_x_axis(x).tickSize(-60, 0, 0));
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
        d3.select(".line").datum(data).attr("d", line);
        d3.select(".line2").datum(data2).attr("d", line);
        updateTime();

        d3.select('#timeline footer').call(zoom);
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
    
    var zoomed = function(){
        var t = zoom.translate(),
        s = zoom.scale();

        tx = Math.min(0, Math.max(width * (1 - s), t[0]));
        ty = Math.min(0, Math.max(height * (1 - s), t[1]));
        zoom.translate([tx, ty]);

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
        updateTimeline();
        
        if(($("svg#now-line").offset().left) < ($("#timeline footer").offset().left)){
            $("svg#now-line").css("visibility","hidden");

        }
        else{
            $("svg#now-line").css("visibility","visible");

        }
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');
        
    };

    var make_x_axis = function (x) {
        return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
    };

            
    var init = function() {
        setData();
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
            .attr("transform", "translate(0, " + 35 + ")")
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
        
        updateTimeline();
        
        d3.selectAll('.x.axis .tick text').attr('x',5).attr('style','text-anchor:left;');

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
        
        d3.select("#timeline footer").on("mouseenter", function() { 
            $("#timeline-text").show();
            hoverLineGroup.style("opacity", 1);
        }).on("mousemove", bindTimelineMouseMove).on("mouseleave", function() {
            hoverLineGroup.style("opacity", 1e-6);
            $("#timeline-text").hide();

        }).on("click", function(){
            var mouse_x = d3.mouse(this)[0];
            model.select(x.invert(mouse_x));
            
        })/*.on("mousedown",function(){
            mouse_x_start = d3.mouse(this)[0];
            var mouse_x_jump = mouse_x_start + timelineJump;
            console.log("$$$$$$$$$$$$ ");
        })*/;
        
        $("svg#now-line").mousedown(function(e){
            e.preventDefault();
            d3.select("#timeline footer").on("mousemove", function(){
                var mouse_x = d3.mouse(this)[0];
                model.select(x.invert(mouse_x));
            });
        }).mouseup(function(){
            d3.select("#timeline footer").on("mousemove", null);
            d3.select("#timeline footer").on("mousemove", bindTimelineMouseMove);
        });
        /**************************END TIMELINE LINES****************************/
        
        //bind click action to interval radio buttons
        var buttons = $('.button-input-group');
        buttons.click(function(e){
            buttons.removeClass('button-input-group-selected');
            $(this).addClass("button-input-group-selected");
            
            jumpInterval = $(this).attr('id');
            switch(jumpInterval){
                case 'year-input-group':
                    bindBtnsToYear();
                    break;
                case 'month-input-group':
                    bindBtnsToMonth();
                    break;
                case 'day-input-group':
                    bindBtnsToDay();
                    break;
                default:
                    alert("cannot find selected interval!");
                    break;
            }
            
            $(this).select();
            updateBarSpeed();
        });
        model.events.on("select", function(){
            updateTime();
        });
        models.layers.events.on("change",function(){
            if(model.start.getTime() !== startDateMs){
                startDateMs = model.start.getTime();
                setData();            
            }
        });
        updateTime();
        $('#day-input-group').addClass('button-input-group-selected');
        bindBtnsToDay();
        $('#day-input-group').select();
        $('.button-input-group').change(function(){
            if($(this).hasClass('button-input-group-selected')){
                var selected = $(".button-input-group-selected");
                var YMDInterval = selected.attr('id');
                var newInput = selected.val();
                switch(YMDInterval){
                    case 'year-input-group':
                        if(newInput>model.start.getUTCFullYear() && newInput<model.end.getUTCFullYear()){
                            selectedDateObj = new Date((new Date(model.selected)).setUTCFullYear(newInput));
                            model.select(selectedDateObj);
                        }
                        else{
                            //TODO: error catching
                        }
                        break;
                    case 'month-input-group':
                        for(var i=0;i<monthNames.length;i++){
                            if(newInput===monthNames[i] || (newInput==i+1)){
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
        $("#timeline header").on('keydown', '.button-input-group', function(e) { 
            var keyCode = e.keyCode || e.which; 
            if (keyCode == 9) {  
                var tabIndex = $(this).attr('tabindex');
                var inputBtns = $('.button-input-group');
                e.preventDefault();
                var ntabindex = parseInt(document.activeElement.tabIndex);
                ntabindex++;
                inputBtns.removeClass('button-input-group-selected');
                $('input[tabindex='+ntabindex+']').focus().addClass('button-input-group-selected').select();
                
            } 
        });

        
    }; // /init
    var bindTimelineMouseMove = function() { //FIXME: Replace with function
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
        model.select(x.invert(mouse_x));
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
    var bindBtnsToYear = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCFullYear(model.selected.getUTCFullYear()+1)));
        });
        decrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCFullYear(model.selected.getUTCFullYear()-1)));
        });
        
    };
    var bindBtnsToMonth = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCMonth(model.selected.getUTCMonth()+1)));
        });
        decrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCMonth(model.selected.getUTCMonth()-1)));
        });
        
    };
    var bindBtnsToDay = function(){
        incrementBtn.unbind();
        decrementBtn.unbind();
        incrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCDate(model.selected.getUTCDate()+1)));
            
        });
        decrementBtn.click(function(e){
            selectedDateObj = new Date(model.selected);
            model.select(new Date(selectedDateObj.setUTCDate(model.selected.getUTCDate()-1)));
            
        });
    };
    var updateTimeline = function(){
        //update timeline line
        svg.select(".line2").attr("d", line);
        var makeFill = d3.select('.line2').attr("d");
        d3.select(".line2").attr("d", makeFill + "l3,0l0,60z");
        var makeFillPos = $(".line2").offset();
        $("svg#now-line").css("left", (makeFillPos.left-3) + "px");
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
        $('.button-input-group-selected').select();
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
