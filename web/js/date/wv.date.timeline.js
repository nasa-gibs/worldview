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
    var model = models.date;
    var layers;
    var boundaryTicks,normalTicks,allTicks,allBoundaryTickForegrounds,offscreenBoundaryTickText, tooSmall;
    var x,xAxis,y,yAxis,zoom;
    var zoomInterval,zoomStep,subInterval,subStep,zoomTimeFormat,zoomLvl,resizeDomain;
    var timeline,verticalAxis,guitarPick;
    var margin = {
        top: 0,
        right: 0,
        bottom: 20,
        left: 10
    };

    var width;
    var getTimelineWidth = function(){width = window.innerWidth - $("#timeline-header").outerWidth() - $("#timeline-zoom").outerWidth() - $("#timeline-hide").outerWidth() - 40;};
    var height = 65 - margin.top - margin.bottom;

    var monthNames = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];
    var monthNumber = function(name){
        for (var i=0;i<monthNames.length;i++){
            if (name.toUpperCase() === monthNames[i]){
                return i;
            }
        }
    };

    var dataLimits = [new Date(Date.UTC(2002,11,1)), new Date(Date.UTC(2021,5,1))];


    var self = {};

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

    var setData = function(){ //TODO: Finish setting data from product data
        layers = [
            {
                "x1": model.start,
                "x2": model.end
            },
            {
            }
        ];

        y = d3.scale.ordinal()
            .domain(["Data1","Data2","Data3"]) //loaded product data goes here
            .rangeBands([0,height]);

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(3);

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

        guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-16)");

    };

    var resizeWindow = function(){
        getTimelineWidth();
        d3.select('#timeline-footer svg')
            .attr('width', width + margin.left + margin.right);
        d3.select('#timeline-boundary rect').attr('width',width+margin.left+margin.right);
        d3.select('#guitarpick-boundary rect').attr('width',width+margin.left+margin.right);
        timeline.select(".x.axis line:first-child").attr("x2",width+10);
        console.log(zoomLvl);
        setZoom(zoomLvl);
        //redrawAxis();
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

    var selectByDateInterval = function(d){

    };
    var addNormStartTick = function(){
        var startTick = d3.selectAll('.x.axis>g.tick').data()[0];
        var fNormData;
        switch (zoomLvl){
        case 0:
            fNormData = new Date(Date.UTC(startTick.getUTCFullYear()-1,0,1));
            break;
        case 1:
            fNormData = new Date(Date.UTC(startTick.getUTCFullYear(),startTick.getUTCMonth()-1,1));
            break;
        case 2:
        case 3:
            fNormData = new Date(Date.UTC(startTick.getUTCFullYear(),startTick.getUTCMonth(),startTick.getUTCDate()-1));
            break;
        }
        var fNormTick = timeline.select('.x.axis').insert('g','g.tick')
            .data([fNormData])
            .attr('class','tick')
            .attr('transform','translate(' + x(fNormData) + ',0)')
            .classed('label-only',true);
        fNormTick.append('line')
            .attr('y2',-height);
        
        setTicks();
    };
    var addNormEndTick = function(){
        var allTickData = d3.selectAll('.x.axis>g.tick').data();
        var endTick = dataLimits[1];
        
        var lNormData;
        switch (zoomLvl){
        case 0:
            lNormData = new Date(Date.UTC(endTick.getUTCFullYear()+1,0,1));
            break;
        case 1:
            lNormData = new Date(Date.UTC(endTick.getUTCFullYear(),endTick.getUTCMonth()+1,1));
            break;
        case 2:
        case 3:
            lNormData = new Date(Date.UTC(endTick.getUTCFullYear(),endTick.getUTCMonth(),endTick.getUTCDate()+1));
            break;
        }
        var lNormTick = timeline.select('.x.axis').insert('g','path.domain')
            .data([lNormData])
            .attr('class','tick')
            .attr('transform','translate(' + x(lNormData) + ',0)')
            .classed('label-only',true);
        lNormTick.append('line')
            .attr('y2',-height);
        
        setTicks();
    };

    var addStartTick = function(){
        var fBoundData,fBoundTxt;
        var fNormData = normalTicks.data()[0];
        switch (zoomLvl){
        case 0:
            fBoundData = new Date(Date.UTC(Math.floor(fNormData.getUTCFullYear()/10)*10,0,1));
            fBoundTxt = fBoundData.getUTCFullYear();
            break;
        case 1:
            fBoundData = new Date(Date.UTC(fNormData.getUTCFullYear(),0,1));
            fBoundTxt = fBoundData.getUTCFullYear();
            break;
        case 2:
            fBoundData = new Date(Date.UTC(fNormData.getUTCFullYear(),fNormData.getUTCMonth(),1));
            fBoundTxt = fBoundData.getUTCMonth();
            break;
        case 3:
            fBoundData =  new Date(Date.UTC(fNormData.getUTCFullYear(),fNormData.getUTCMonth(),fNormData.getUTCDate()));
            fBoundTxt = fBoundData.getUTCDate();
            break;
        }
        var fBoundTick = timeline.select('.x.axis').insert('g','g.tick').data([fBoundData])
            .attr('class','tick')
            .attr('transform','translate(' + x(fBoundData) + ',0)')
            .classed('label-only',true);
        fBoundTick.append('line')
            .attr('y1',20)
            .attr('y2',-50);//TODO: make these dynamic
        fBoundTick.append('text')
            .attr('y','5')
            .attr('dy','.71em')
            .text(fBoundTxt);
        
        setTicks();
        
    };

    var addEndTick = function(){

        var lBoundData,lBoundTxt;
        var lNormData = normalTicks.data()[normalTicks.data().length-1];
        
        switch (zoomLvl){
        case 0:
            lBoundData = new Date(Date.UTC(Math.ceil(lNormData.getUTCFullYear()/10)*10,0,1));
            lBoundTxt = lBoundData.getUTCFullYear();
            break;
        case 1:
            lBoundData = new Date(Date.UTC(lNormData.getUTCFullYear()+1,0,1));
            lBoundTxt = lBoundData.getUTCFullYear();
            break;
        case 2:
            lBoundData = new Date(Date.UTC(lNormData.getUTCFullYear()+1,lNormData.getUTCMonth()+1,1));
            lBoundTxt = lBoundData.getUTCMonth();
            break;
        case 3:
            lBoundData = new Date(Date.UTC(lNormData.getUTCFullYear()+1,lNormData.getUTCMonth()+1,lNormData.getUTCDate()+1));
            lBoundTxt = lBoundData.getUTCDate();
            break;
        }

        var lBoundTick = timeline.select('.x.axis').insert('g','path.domain').data([lBoundData])
            .attr('class','tick')
            .attr('transform','translate(' + x(lBoundData) + ',0)')
            .classed('label-only',true);
        lBoundTick.append('line')
            .attr('y1',20)
            .attr('y2',-50);//TODO: make these dynamic
        lBoundTick.append('text')
            .attr('y','5')
            .attr('dy','.71em')
            .text(lBoundTxt);

        setTicks();
        
    };

    var setTicks = function(){
        var allTicks = d3.selectAll('.x.axis>g.tick');
        allTicks.classed('tick-labeled',false);

        normalTicks = d3.selectAll('.x.axis>g.tick').filter(function(d){
            var selection,value;
            switch (zoomLvl){
            case 0:
                selection = d.getUTCFullYear() % 10;
                value = 0;
                break;
            case 1:
                selection = d.getUTCMonth();
                value = 0;
                break;
            case 2:
                selection = d.getUTCDate();
                value = 1;
                break;
            case 3:
                selection = d.getUTCDay();
                value = 0;
                break;
            }
            return selection !== value;
        });
        
        if(tooSmall){
            if(allTicks.data()[0] > dataLimits[0]){
                return addNormStartTick();
            }
            if(allTicks.data()[allTicks.data().length-1] <= dataLimits[1]){
                return addNormEndTick();
            }
        }
        
        boundaryTicks = d3.selectAll('.x.axis>g.tick').filter(function(d){
            var selection,value;
            switch (zoomLvl){
            case 0:
                selection = d.getUTCFullYear() % 10;
                value = 0;
                break;
            case 1:
                selection = d.getUTCMonth();
                value = 0;
                break;
            case 2:
                selection = d.getUTCDate();
                value = 1;
                break;
            case 3:
                selection = d.getUTCDay();
                value = 0;
                break;
            }
            return selection === value;
        });

        if($(normalTicks[0][0]).is(':nth-child(2)')){
            addStartTick();
            return;
        }

        if(d3.select($(normalTicks[0][normalTicks[0].length-1]).next()[0]).classed('domain')){
            return addEndTick();
        }

        boundaryTicks.classed('tick-labeled',true);

    };
    var getNextBoundaryTickData = function(tick){
        var nextTick = new Date(tick);
        switch(zoomLvl){
        case 0:
            var returnTick = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+10));
            break;
        case 1:
            var returnTick = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+1));
            break;
        case 2:
            var returnTick = new Date(nextTick.setUTCMonth(nextTick.getUTCMonth()+1));
            break;
        case 3:
            var returnTick = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+7));
            break;
            
        }
        return returnTick;
    };
    var getNextNormalTickData = function(tick){
        var nextTick = new Date(tick);
        switch(zoomLvl){
        case 0:
            var returnTick = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+1));
            break;
        case 1:
            var returnTick = new Date(nextTick.setUTCMonth(nextTick.getUTCMonth()+1));
            break;
        case 2:
            var returnTick = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+1));
            break;
        case 3:
            var returnTick = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+1));
            break;
            
        }
        return returnTick;
    };
    var redrawAxis = function(){  //TODO: Draw y axis

        timeline.select(".x.axis")
            .call(xAxis);

        //FIXME: Make function for other zoom levels
        
        setTicks();
        
        var allTicks = d3.selectAll('.x.axis>g.tick');

        boundaryTicks.each(function(){

            var boundaryTick = d3.select(this);
            var boundaryTickData = boundaryTick.data()[0];
            var nextBoundaryTickData = getNextBoundaryTickData(boundaryTickData);

            var nextNormalTickData = getNextNormalTickData(boundaryTickData);

            var boundaryTickWidth = Math.abs(x(nextBoundaryTickData) - x(boundaryTickData));
            var normalTickWidth = Math.abs(x(nextNormalTickData) - x(boundaryTickData));

            var subLabel = getSubLabel(boundaryTickData);

            if (!($(this).find('line').attr('y1') === '20')){
                boundaryTick.select('line')
                    .attr("y1","20")
                    .attr("y2","-50");
            }
            if(!$(this).find('text').hasClass('tick-label')){
                boundaryTick.select('text')
                    .attr('class','tick-label')
                    .attr('x',7)
                    .attr('style','text-anchor:left;');
                if(subLabel){
                    boundaryTick.select('text').append("tspan")
                        .text(" " + subLabel)
                        .attr("class","sub-label");
                }
            }
            if(!$(this).find('circle').length)
                boundaryTick.insert("svg:circle","text").attr("r","6");

            if(!$(this).find('rect').length){

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
                    .attr("width",normalTickWidth);

                if(subLabel){
                    boundaryTick.select('text').append("tspan")
                        .text(" " + subLabel)
                        .attr("class","sub-label");
                }
            }
            else{
                boundaryTick.select('rect.boundarytick-background')
                    .attr("width",boundaryTickWidth);
                boundaryTick.select('rect.boundarytick-foreground')
                    .attr("width",boundaryTickWidth);
                boundaryTick.select('rect.normaltick-background')
                    .attr("width",normalTickWidth);
            }
            
        });

        normalTicks.each(function(){

            var normalTick = d3.select(this);
            var normalTickData = normalTick.data()[0];
            var nextNormalTickData = getNextNormalTickData(normalTickData);
//            var nextNormalTickData = d3.select($(this).nextAll('g.tick').first()[0]).data()[0];
            var normalTickWidth = x(nextNormalTickData) - x(normalTickData);

            if(!($(this).find('line').attr('y1') === '-2')){
                normalTick.select('line')
                    .attr("y1","-2");
            }
            
            if(($(this).find('text').length)){
                normalTick.select("text").remove();
            }
            if(!$(this).find('rect').length){
                normalTick.append("svg:rect")
                    .attr("class","normaltick-background")
                    .attr("height",height-1)
                    .attr("y",-height)
                    .attr("width",normalTickWidth);
            }
            else{
                normalTick.select('rect.normaltick-background')
                    .attr("width",normalTickWidth);
            }
        });

        allTickBackgrounds = d3.selectAll('.x.axis>g.tick>rect.normaltick-background');
        allBoundaryTickForegrounds = d3.selectAll(".x.axis>g.tick>rect.boundarytick-foreground");

        //TODO: Optimize to no rebind what doesn't need to be rebinded
        allTickBackgrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverNormalTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickNormalTick.call(this,d);
            });
        allBoundaryTickForegrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverBoundaryTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickBoundaryTick.call(this,d);
            });

        //UPDATE GUITARPICK
        if (guitarPick){
            guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-16)");
        }


    };
    var setZoomBtns = function(interval){
        switch (interval){
            case 'week':
            case 3:
                $('.zoom-btn').removeClass(function (index, css) {
                    return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
                }).css("margin","").css("font-size","");
                $('#zoom-decades').addClass("depth-4");
                $('#zoom-years').addClass("depth-3").css("margin","5px 0 0 0");
                $('#zoom-months').addClass("depth-2");
                $('#zoom-weeks').addClass("depth-1").css("margin","25px 0 0 0");
            break;

            case 'month':
            case 2:
                $('.zoom-btn').removeClass(function (index, css) {
                    return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
                }).css("margin","").css("font-size","");
                $('#zoom-decades').addClass("depth-3").css("margin","5px 0 0 0");
                $('#zoom-years').addClass("depth-2");
                $('#zoom-months').addClass("depth-1");
                $('#zoom-weeks').addClass("depth-2").css("margin","10px 0 0 0");
            break;

            case 'year':
            case 1:
                $('.zoom-btn').removeClass(function (index, css) {
                    return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
                }).css("margin","").css("font-size","");
                $('#zoom-decades, #zoom-months').addClass("depth-2");
                $('#zoom-years').addClass("depth-1").css("font-size","1.7em");
                $('#zoom-weeks').addClass("depth-3").css("margin","-3px 0 3px 0");
            break;

            case 'decade':
            case 0:
                $('.zoom-btn').removeClass(function (index, css) {
                    return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
                }).css("margin","").css("font-size","");
                $('#zoom-decades').addClass("depth-1");
                $('#zoom-years').addClass("depth-2").css("font-size","1.2em");
                $('#zoom-months').addClass("depth-3").css("margin","-3px 0 5px 0");
                $('#zoom-weeks').addClass("depth-4");
        }
    };
    var removeLabelOnlyStuff = function(){
        d3.selectAll('.x.axis>g.label-only.tick-labeled rect.normaltick-background').remove();
        d3.selectAll('.x.axis>g.label-only.tick-labeled rect.boundarytick-foreground')
            .on('mouseenter',null)
            .on('mouseleave',null)
            .on('click',null);
    };
    var setZoom = function(interval){  //this function should replace zoomable

        var startDate = dataLimits[0];
        var lastStartDomain = x.domain()[0];
        var lastEndDomain = x.domain()[1];
        var extStartDate = new Date(zoom.xExtent()[0]);
        var extEndDate = new Date(zoom.xExtent()[1]);
        var boundaryTickWidth, endDateInt, endDate,maxNumberOfTicks,normalTickWidth;
        var rangeWidth;

        if($(this).is('svg') && d3.event.sourceEvent){ //TODO: button zoom errors with this but mouse zooming doesnt
            console.log('mouse');
            var mousePos = x.invert(d3.mouse(this)[0]);
            var mouseOffset = width/2 - d3.mouse(this)[0];
        }
        

        setZoomBtns(interval);

        switch (interval){
        case 'decade':
        case 0:
            var tw = 150/10;
            //Each tick is one year, see how many there are until xExtent

            numberOfTicks = (extEndDate.getUTCFullYear() - extStartDate.getUTCFullYear());
            //Max possible ticks for this screen resolution
            maxNumberOfTicks = Math.ceil(width/tw);

            if (maxNumberOfTicks > numberOfTicks){ //range does not exceed xExtent
                tooSmall = true;
                startDate = extStartDate;
                endDate = extEndDate;
                rangeWidth = numberOfTicks * tw;
            }
            else{ //range exceeds xExtent
                tooSmall = false;

                endDateInt = extStartDate.getUTCFullYear() + maxNumberOfTicks;
                endDate = new Date(endDateInt,extStartDate.getUTCMonth(),extStartDate.getUTCDate()); 
            }
            
            zoomInterval = d3.time.year.utc;
            zoomStep = 1;
            zoomTimeFormat = d3.time.format.utc("%Y");
            
            zoomLvl = 0;
            break;
        case 'year':
        case 1:
            var tw = 150/12;

            //Each tick is one month, see how many there are until xExtent
            numberOfTicks = (extEndDate.getUTCFullYear() - extStartDate.getUTCFullYear())*12
                + extEndDate.getUTCMonth() + 1 - extStartDate.getUTCMonth();

            //Max possible ticks for this screen resolution
            maxNumberOfTicks = Math.ceil(width/tw);

            if (maxNumberOfTicks > numberOfTicks){ //range does not exceed xExtent
                tooSmall = true;
                startDate = extStartDate;
                endDate = extEndDate;
                rangeWidth = numberOfTicks * tw;

            }
            else{ //range exceeds xExtent
                tooSmall = false;
                endDateInt = extStartDate.getUTCMonth() + maxNumberOfTicks;
                endDate = new Date(extStartDate.getUTCFullYear(),endDateInt,extStartDate.getUTCDate());
            }

            zoomInterval = d3.time.month.utc;
            zoomStep = 1;
            zoomTimeFormat = d3.time.format.utc("%Y");
            
            zoomLvl = 1;
            break;
        case 'month': //FIXME: needs to be fixed for being tooSmall
        case 2:
            var tw = 7;
            
            //Each tick is one year, see how many there are until xExtent
            numberOfTicks = (extEndDate - extStartDate)/1000/60/60/24;

            //Max possible ticks for this screen resolution
            maxNumberOfTicks = Math.ceil(width/tw);

            if (maxNumberOfTicks > numberOfTicks){ //range does not exceed xExtent
                tooSmall = true;
                startDate = extStartDate;
                endDate = extEndDate;
                rangeWidth = numberOfTicks * tw;
            }
            else{ //range exceeds xExtent
                tooSmall = false;
                endDateInt = extStartDate.getUTCDate() + maxNumberOfTicks;
                endDate = new Date(extStartDate.getUTCFullYear(),extStartDate.getUTCMonth(),endDateInt);
            }
            
            zoomInterval = d3.time.day.utc;
            zoomStep = 1;
            zoomTimeFormat = d3.time.format.utc("%b");
            
            zoomLvl = 2;
            break;
        case 'week': //FIXME: for maxNumberofTicks and tooSmall
        case 3:
             var tw = 18;
            
            //Each tick is one year, see how many there are until xExtent
            numberOfTicks = (extEndDate - extStartDate)/1000/60/60/24;

            //Max possible ticks for this screen resolution
            maxNumberOfTicks = Math.ceil(width/tw);

            if (maxNumberOfTicks > numberOfTicks){ //range does not exceed xExtent
                tooSmall = true;
                startDate = extStartDate;
                endDate = extEndDate;
                rangeWidth = numberOfTicks * tw;
            }
            else{ //range exceeds xExtent
                tooSmall = false;
                endDateInt = extStartDate.getUTCDate() + maxNumberOfTicks;
                endDate = new Date(extStartDate.getUTCFullYear(),extStartDate.getUTCMonth(),endDateInt);

            }
            zoomInterval = d3.time.day.utc;
            zoomStep = 1;
            zoomTimeFormat = d3.time.format.utc("%d");
            
            zoomLvl = 3;
            break;
            
        }
        //console.log(zoom.translate());
        
        if (tooSmall === true){
            
            x = d3.time.scale.utc()
                .domain([startDate,endDate])
                .range([(width/2)-(rangeWidth/2),(width/2)+(rangeWidth/2)]);

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickSize(-height)
                .tickPadding(5)
                .ticks(zoomInterval,zoomStep)
                .tickFormat(zoomTimeFormat);
            
            zoom = d3.behavior.zoom()
                .x(x)
                .scale(1)
                .scaleExtent([1, 1]) //don't use default zoom provided by d3
                .xExtent(dataLimits)
                .on("zoom", zoomable, d3.event);
        }
        
        else{

            x = d3.time.scale.utc()
                .domain([startDate,endDate])
                .range([0,width]);

            xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickSize(-height)
                .tickPadding(5)
                .ticks(zoomInterval,zoomStep)
                .tickFormat(zoomTimeFormat);
            
            zoom = d3.behavior.zoom()
                .x(x)
                .scale(1)
                .scaleExtent([1, 1]) //don't use default zoom provided by d3
                .xExtent(dataLimits)
                .on("zoom", zoomable, d3.event);
            
        }

        d3.select('#timeline-footer svg').call(zoom);
        
        if (mousePos){
            zoom.translate([-x(mousePos)+width/2-mouseOffset,0]);
        }
        else{
            zoom.translate([-x(model.selected)+width/2,0]);
        }

        timeline.selectAll('.x.axis').remove();


        timeline.insert("svg:g",'.y.axis')
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .insert("line",":first-child")
                .attr("x1",0)
                .attr("x2",width);


        timeline.select(".x.axis")
            .call(xAxis); //update view after translate

//        console.log('xaxis updated');

        setTicks();
        
        boundaryTicks.selectAll('line')
            .attr("y1","20")
            .attr("y2","-50");
        
        boundaryTicks.insert("svg:circle","text").attr("r","6");

        boundaryTicks.each(function(){
            var boundaryTick = d3.select(this);
            var boundaryTickWidth,normalTickWidth;
            var boundaryTickData = boundaryTick.data()[0];
            var nextBoundaryTickData = getNextBoundaryTickData(boundaryTickData);
            var nextNormalTickData = getNextNormalTickData(boundaryTickData);

            var boundaryTickWidth = x(nextBoundaryTickData) - x(boundaryTickData);

            var normalTickWidth = x(nextNormalTickData) - x(boundaryTickData);
            
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

        normalTicks.selectAll('line')
            .attr("y1","-2");

        normalTicks.selectAll("text").remove();

        normalTicks.each(function(){
            var normalTick = d3.select(this);
            var normalTickWidth;
            var normalTickData = normalTick.data()[0];
            var nextNormalTickData = getNextNormalTickData(normalTickData);//d3.select($(this).nextAll('g.tick').first()[0]).data()[0];

            //replaces statement below
            var normalTickWidth = x(nextNormalTickData) - x(normalTickData);
            /*
            nextNormalTickData ? 
                normalTickWidth = x(nextNormalTickData) - x(normalTickData) 
                : 
                normalTickWidth = width - x(normalTickData);
            */

            normalTick.append("svg:rect")
                .attr("class","normaltick-background")
                .attr("height",height-1)
                .attr("y",-height)
                .attr("width",normalTickWidth);

        });
        
        allTickBackgrounds = d3.selectAll('.x.axis>g.tick>rect.normaltick-background');
        allBoundaryTickForegrounds = d3.selectAll(".x.axis>g.tick>rect.boundarytick-foreground");

        allTickBackgrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverNormalTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickNormalTick.call(this,d);
            });
        allBoundaryTickForegrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverBoundaryTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickBoundaryTick.call(this,d);
            });
        removeLabelOnlyStuff();



        //UPDATE GUITARPICK
        if (guitarPick){
            guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-16)");
        }













        //redrawAxis(); this doesnt work because it only updates existing ticks, not draw whole new ones
        
    };
    var clickBoundaryTick = function(d){ //FIXME: Combine with selectByDateInterval
        d3.event.stopPropagation();
        var d = d3.select(this.parentNode).data()[0];
        var newDate;
        
        switch(zoomLvl){ //FIXME: combine with other zoomLvl actions
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
            var dayOffset = model.selected.getUTCDay() - d.getUTCDay();
            newDate = new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate() + dayOffset);
            break;
        default:
            break;
        }
        model.select(newDate);
    };

    var hoverBoundaryTick = function(d){
        if (zoomLvl === 0){
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
        }
        else if (zoomLvl === 1){
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
        }
        showHoverLabel.call(this,d);
    };
    var clickBoundaryTick = function(d){
        switch(zoomLvl){
            case 0:
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 1:
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 2:
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 3:
            var dayOffset = model.selected.getUTCDay() - d.getUTCDay();
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate() + dayOffset);
            break;
            //FIXME:  Add default case
        }
        model.select(d);
    };
    var hoverNormalTick = function(d){
        if (zoomLvl === 0){
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
        }
        else if (zoomLvl === 1){
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
        }
        showHoverLabel.call(this,d);
    };
    var clickNormalTick = function(d){
        switch(zoomLvl){
            case 0:
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 1:
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
            break;
            case 2:
            case 3:
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
            break;
            //FIXME:  Add default case
        }
        model.select(d);
    };
    var showHoverLabel = function(d){
        var tick = this.parentNode;
        var boundaryTick, boundaryTickWidth;
        tick.classList.contains('tick-labeled') ? //TODO: Check comaptibility of classList.contains
            $boundaryTick = $(tick)
            :
            $boundaryTick = $(tick).prevAll('g.tick-labeled').first(); //Grab Boundary Tick if it is a Normal Tick

        boundaryTickWidth = $boundaryTick.find('rect.boundarytick-background').attr('width'); //get width from one boundary to the next
        boundaryTick = d3.select($boundaryTick[0]); //Convert jquery selection to d3 selection
        boundaryTick
            .selectAll('.tick-label, .sub-label')
            .attr('visibility','hidden'); //hide current labels
            
        boundaryTick.select('rect.boundarytick-background')
            .classed('bg-hover',true); //trigger hover state

        boundaryTick.append("svg:text")
            .attr("class","hover-tick-label")
            .attr("y","15")
            .attr("x",boundaryTickWidth/2)
            .attr("style","text-anchor:middle")
            .attr("width",boundaryTickWidth)
            .text(d.getUTCFullYear() + " " + monthNames[d.getUTCMonth()] + " " + d.getUTCDate()); //Add hover Label
    };
    var unHoverTick = function(d){
        timeline.selectAll('.tick-label, .sub-label').attr("visibility",""); //Show current labels
        timeline.selectAll('.hover-tick-label, .hover-sub-label').remove(); //Remove hover label
        timeline.selectAll('rect.boundarytick-background.bg-hover')
            .classed('bg-hover',false); //untrigger hover state

    };
    var setOffscreenBoundaryTick = function(){
        //TODO: Optimize
        var firstBoundaryTick = d3.select(boundaryTicks[0][0]);
        var firstBoundaryTickData = firstBoundaryTick.data()[0];
       
        if(firstBoundaryTick.classed('tick-labeled')) {
            var offscreenBoundaryTickData = getOffscreenBoundaryTickData(firstBoundaryTickData);

            var offscreenBoundaryTick = timeline.select('.x.axis')
                .insert('svg:g','g.tick')
                .attr('class','tick tick-labeled')
                .attr('transform','translate('+ x(offscreenBoundaryTickData) +',0)')
                .data([offscreenBoundaryTickData]);

            offscreenBoundaryTick
                .append('svg:text')
                .attr('y',5)
                .attr('dy','.71em')
                .text(offscreenBoundaryTickText);

            offscreenBoundaryTick
                .insert('svg:line','text');

            //TODO: Optimize, don't have to set normalTicks
            setTicks();
        }
    };
    var getOffscreenBoundaryTickData = function(d){
        switch(zoomLvl){
            case 0:
            d = new Date(new Date(d).setUTCFullYear(d.getUTCFullYear()-10));
            offscreenBoundaryTickText = d.getUTCFullYear();
            break;
            case 1:
            d = new Date(new Date(d).setUTCFullYear(d.getUTCFullYear()-1));
            offscreenBoundaryTickText = d.getUTCFullYear();
            break;
            case 2:
            d = new Date(new Date(d).setUTCMonth(d.getUTCMonth()-1));
            offscreenBoundaryTickText = d.getUTCMonth();
            break;
            case 3:
            d = new Date(new Date(d).setUTCDate(d.getUTCDate()-7));
            offscreenBoundaryTickText = d.getUTCDate();
            break;
            //FIXME:  Add default case
        }
        return d;
    };
    var init = function() {

        var endDateInt,endDate;

        getTimelineWidth();

        var startDate = dataLimits[0]; //TODO: place first date of data here
        var tickWidth = 150;
        var numberOfTicks = Math.ceil(width/tickWidth);  //number of ticks for browser width FIXME: should be a multiple of tickWidth

        endDateInt = startDate.getUTCFullYear() + numberOfTicks;
        endDate = new Date(endDateInt,startDate.getUTCMonth(),startDate.getUTCDate());
        zoomInterval = d3.time.month.utc;
        zoomStep = 1;
        zoomTimeFormat = d3.time.format.utc("%Y");
        zoomLvl = 1;
        
        x = d3.time.scale.utc()
            .domain([startDate,endDate])
            .range([0,width]);

        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height)
            .tickPadding(5)
            .ticks(zoomInterval,zoomStep)
            .tickFormat(zoomTimeFormat);
        
        zoom = d3.behavior.zoom()
            .x(x)
            .scale(1)
            .scaleExtent([1, 1]) //don't use default zoom provided by d3
            .xExtent(dataLimits)
            .on("zoom", zoomable, d3.event);

        setData();

        //create timeline elements
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
            .attr('height', height + margin.top + margin.bottom)
            .attr("y","-16");

        timeline = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("clip-path","#timeline-boundary")
            .attr("style","clip-path:url(#timeline-boundary)");

        timeline.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .insert("line",":first-child")
                .attr("x1",0)
                .attr("x2",width);

        zoom.translate([width/2 - x(model.selected),0]); //go to selected date

        timeline.select(".x.axis")
            .call(xAxis); //update view after translate

        setZoom('year');
        
        //initial setup of zoom buttons FIXME: make this much better
        $('#zoom-decades, #zoom-months').addClass("depth-2");
        $('#zoom-years').addClass("depth-1").css("font-size","1.7em");
        $('#zoom-weeks').addClass("depth-3").css("margin","-3px 0 3px 0");

        //draw vertical ticks
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


        //Add guitar pick
        guitarPick = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("id","guitarpick")
            .attr("style","clip-path:url(#guitarpick-boundary);")
            .append("svg:g")
            .attr("transform","translate("+(x(model.selected)-28)+",-16)");

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
            mousedown = true;
            d3.event.preventDefault();
            d3.event.stopPropagation();
        })
        .on("mouseup",function(){
            mousedown = false;
        });
        
        //update date when sliding guitarpick across small axis
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
                    case 3:
                    newDate = new Date(mouseDate.getUTCFullYear(),mouseDate.getUTCMonth(),mouseDate.getUTCDate());
                    break;
                }
                guitarPick.attr("transform","translate("+ (x(newDate)-28) +",-16)");

                model.select(newDate);

                //TODO: This is going to need to be udated when the zoom changes
                var hoveredNormalTick = d3.selectAll('.x.axis>g.tick').filter(function(d){
                    return (d.getUTCFullYear() === newDate.getUTCFullYear()) && (d.getUTCMonth() === newDate.getUTCMonth());
                });
                var hoveredNormalTickBackground = hoveredNormalTick.select('rect.normaltick-background')[0][0];
                var d = d3.select(hoveredNormalTick[0][0]).data()[0];

                unHoverTick();
                hoverNormalTick.call(hoveredNormalTickBackground,d);
                
            }
        });

        //stop guitarpick if mouseup anywhere on document
        d3.select(document).on("mouseup",function(){
            if (mousedown){
                mousedown = false;
            }
        });

////////////////////////////Click bindings/////////////////////////////////// 
        d3.select("#zoom-decades").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('decade');
        });
        d3.select("#zoom-years").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('year');
        });
        d3.select("#zoom-months").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('month');

        });
        d3.select("#zoom-weeks").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('week');

        });

//////////////////////////////end clicks////////////////////////////////////

        model.events.on("select", function(){
            updateTime();
        });

        models.layers.events.on("change",function(){
            if(model.start && model.start.getTime() !== startDateMs){
                startDateMs = model.start.getTime();
                //setData();           FIXME: update actual data
            }
        });

        updateTime();

    }; // end init()



    var zoomLvlTiny = 0;
    var zoomable = function(e){

        var evt = window.event || d3.event.sourceEvent || e;
        var deltaY=evt.deltaY ? evt.deltaY : evt.wheelDeltaY || evt.detail ? evt.detail*(-120) : evt.wheelDelta;
        var deltaX=evt.deltaX ? evt.deltaY : evt.wheelDeltaX;
        if (deltaY < 0){
            //console.log("Up");
            if (zoomLvl < 3){
                zoomLvlTiny++;
                if (zoomLvlTiny===3){
                    zoomLvl++;
                    zoomLvlTiny = 0;
                    setZoom.call(this,zoomLvl);
                }
            }
        }
        else if (deltaY > 0){
            //console.log("Down")
            if (zoomLvl > 0){
                zoomLvlTiny--;
                if (zoomLvlTiny===-3){
                    zoomLvl--;
                    zoomLvlTiny = 0;
                    setZoom.call(this,zoomLvl);
                }
            }
        }
        else{
            //zoom.translate(panLimit());
            redrawAxis();
        }

    };
    init();
    $(window).resize(resizeWindow);

    return self;
}
