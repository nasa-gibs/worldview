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
    var dataStartDate = config.startDate;
    var boundaryTicks,normalTicks,allTicks,allBoundaryTickForegrounds,offscreenBoundaryTickText, tooSmall;
    var x,xAxis,y,yAxis,zoom;
    var zoomInterval,zoomStep,subInterval,subStep,zoomTimeFormat,zoomLvl,resizeDomain;
    var timeline,verticalAxis,guitarPick,dataBars;
    var activeLayers,activeLayersDynamic,activeLayersInvisible,layerCount,activeLayersTitles;
    var timer;
    var mousedown = false;
    var margin = {
        top: 0,
        right: 30,
        bottom: 20,
        left: 30
    };

    /* Click or mousedown? */
    var cancelClick;
    var clicked = true;
    var notClickDelay = 200;
    var notClick = function(){
        clicked = false;
    };

    var width;
    
    var getTimelineWidth = function(){
        width = $(window).outerWidth(true) - $("#timeline-header").outerWidth(true) - $("#timeline-zoom").outerWidth(true) - $("#timeline-hide").outerWidth(true)-margin.left-margin.right - 22; //margin left + right + 1px border * 2
    };
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
    var startDateMs = ( model.start ) ? model.start.getTime() : undefined;
    var endDateMs = ( model.end ) ? model.end.getTime() : undefined;
    var dataLimits = [new Date(dataStartDate), new Date(endDateMs)]; //FIXME: used date constructor with a string


    var self = {};
    self.enabled = false;

    var incrementBtn = $("#right-arrow-group");
    var decrementBtn = $("#left-arrow-group");

    var throttleSelect = _.throttle(function(date) {
        if((date>dataLimits[0])&&(date<dataLimits[1])){
            model.select(date);
        }
    }, 100, { trailing: true });

    var selection = d3.svg.line()
        .x(function(d){
            return x(d.x);
        })
        .y(function(d){
            return y(d.y);
        });

    var setData = function(){ //TODO: Finish setting data from product data
        dataBars.selectAll('rect').remove();
        activeLayersTitles = [];

        activeLayers = models.layers.get();
        /*
        activeLayersDynamic = activeLayers.filter(function(al){
            return al.startDate;
        });
        activeLayersInvisible = activeLayers.filter(function(al){
            return al.visible === false;
        });
        */
        layerCount = activeLayers.length;

        $(activeLayers).each(function(i){
            activeLayersTitles[i] = this.id;
        });

        y = d3.scale.ordinal()
            .domain(activeLayersTitles) //loaded product data goes here
            .rangeBands([5,height-5]);

        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(layerCount);

        $(activeLayers).each(function(al){
            var layerStart,layerEnd,layerXY;
            var layerVisible = true;
            var staticLayer = true;
            var layerId = this.id;

            if(this.startDate) {
                layerStart = new Date(this.startDate);
                staticLayer = false;
            }
            else{
                layerStart = dataLimits[0];
            }
            if(this.inactive === true) {
                layerEnd = new Date(this.endDate);
            }
            else{
                layerEnd = dataLimits[1];
            }

            var currentDB = dataBars.append("svg:rect")
                .attr('x',x(layerStart))
                .attr('width',x(layerEnd)-x(layerStart))
                //.attr('height',2)
                .attr('y',y(layerId)-2.5)
                .attr('rx',4)
                .attr('ry',4)
                .attr('data-layer',layerId)
                .attr("class", "data-bar");
//                .attr("d", selection);
            if(!staticLayer){
                currentDB.classed('data-bar-dyn',true);
            }
            if(this.visible === false){
                layerVisible = false;
                currentDB.classed('data-bar-invisible',true);
            }

        });
        dataBars.selectAll('rect')
            .attr('height',(height-15)/layerCount);

        if(verticalAxis){
            verticalAxis.call(yAxis);
        }
    };
    var hideInvalidTicks = function(){ //TODO: In progress
        //console.log('hiding invalid ticks ' + normalTicks.data()[0]);
        if(tooSmall){
            //console.log('tooSmall true');
            var ms = model.selected;
            var yos = parseInt(ms.getUTCFullYear() - Math.floor(ms.getUTCFullYear()/10)*10);
            var nt = new Date(Math.floor(normalTicks.data()[0].getUTCFullYear()/10)*10+yos,ms.getUTCMonth(),ms.getUTCDate());
            //console.log('nt = ' + nt);
            switch(zoomLvl){
            case 0:
                if(nt < normalTicks.data()[0]){
                    d3.select(boundaryTicks[0][0]).selectAll('rect.').on('mouseenter',null);
                    //console.log('delete click');
                }
                else{
                    d3.select(boundaryTicks[0][0]).selectAll('rect');//.('visibility','');
                }
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            }
        }
    };
    var updateTime = function() {
        var ms = new Date(model.selected);
        var nd = new Date(ms.setUTCDate(ms.getUTCDate()+1));
        var pd = new Date(ms.setUTCDate(ms.getUTCDate()-1));
        $('#year-input-group').val(model.selected.getUTCFullYear());
        $('#month-input-group').val(monthNames[model.selected.getUTCMonth()]);
        if (model.selected.getUTCDate()<10){
            $('#day-input-group').val("0" + model.selected.getUTCDate());
        }
        else {
            $('#day-input-group').val(model.selected.getUTCDate());
        }
        if(nd > dataLimits[1]){
            incrementBtn.addClass('button-disabled');
        }
        else{
            incrementBtn.removeClass('button-disabled');
        }
        if(pd.toUTCString() === dataLimits[0].toUTCString()){
            decrementBtn.addClass('button-disabled');
        }
        else{
            decrementBtn.removeClass('button-disabled');
        }
        //hideInvalidTicks(); TODO: Implement invalid ticks
        guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-16)");



    };
    var moveToPick = function(){
        var zt = zoom.translate()[0];
        if(x(model.selected) >= x(normalTicks.data()[normalTicks.data().length-2])){
            if (mousedown){
                zoom.translate([zt - x(model.selected)+x(normalTicks.data()[normalTicks.data().length-2]),0]);
            }
            else{
                zoom.translate([zt - x(model.selected) + (width/8)*7,0]);
            }
            panAxis();
        }
        else if(x(model.selected) <= x(normalTicks.data()[1])){
            if (mousedown){
                zoom.translate([zt - x(model.selected)+x(normalTicks.data()[1]),0]);
            }
            else{
                zoom.translate([zt - x(model.selected) + width/8,0]);
            }
            panAxis();
        }
    };

    var resizeWindow = function() {
        if ( self.enabled && wv.util.browser.small ) {
            self.enabled = false;
            $("#timeline").hide();
        } else if ( !self.enabled && !wv.util.browser.small ) {
            self.enabled = true;
            $("#timeline").show();
        }
        if ( self.enabled ) {
            getTimelineWidth();
            d3.select('#timeline-footer svg')
                .attr('width', width);// + margin.left + margin.right);
            d3.select('#timeline-boundary rect').attr('width',width);//+margin.left+margin.right);
            d3.select('#guitarpick-boundary rect').attr('width',width+margin.left+margin.right);//+margin.left+margin.right);
            timeline.select(".x.axis line:first-child").attr("x2",width);//+margin.left+margin.right);

            setZoom(zoomLvl);
        }
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
            .classed('label-only',true)
            .classed('normal-tick',true);
        fNormTick.append('line')
            .attr('y2',-height);

        setNormalTicks();
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
            .classed('label-only',true)
            .classed('normal-tick',true);
        lNormTick.append('line')
            .attr('y2',-height);

        setNormalTicks();
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
            fBoundTxt = monthNames[fBoundData.getUTCMonth()];
            break;
        case 3:
            fBoundData =  new Date(Date.UTC(fNormData.getUTCFullYear(),fNormData.getUTCMonth(),fNormData.getUTCDate()-fNormData.getUTCDay())); //FIXME
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

        d3.selectAll('.x.axis>g.tick').classed('tick-labeled',false);
        setBoundaryTicks();
        boundaryTicks.classed('tick-labeled',true);

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

        d3.selectAll('.x.axis>g.tick').classed('tick-labeled',false);
        setBoundaryTicks();
        boundaryTicks.classed('tick-labeled',true);

    };
    var setNormalTicks = function(){
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

    };
    var setBoundaryTicks = function(){
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
    };
    var setTicks = function(){
        allTicks = d3.selectAll('.x.axis>g.tick');
        allTicks.classed('tick-labeled',false).classed('label-only',false);

        setNormalTicks();

        if(tooSmall){
            if(allTicks.data()[0] > dataLimits[0]){
                addNormStartTick();
            }
            if(allTicks.data()[allTicks.data().length-1] <= dataLimits[1]){
                addNormEndTick();
            }
        }

        setBoundaryTicks();

        if($(normalTicks[0][0]).is(':nth-child(2)')){
            addStartTick();
        }

        if(d3.select($(normalTicks[0][normalTicks[0].length-1]).next()[0]).classed('domain')){
            addEndTick();
        }

        boundaryTicks.classed('tick-labeled',true);

    };
    var getNextBoundaryTickData = function(tick){
        var nextTick = new Date(tick);
        var rt;
        switch(zoomLvl){
        case 0:
            rt = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+10));
            break;
        case 1:
            rt = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+1));
            break;
        case 2:
            rt = new Date(nextTick.setUTCMonth(nextTick.getUTCMonth()+1));
            break;
        case 3:
            rt = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+7));
            break;

        }
        return rt;
    };
    var getNextNormalTickData = function(tick){
        var nextTick = new Date(tick);
        var rt;
        switch(zoomLvl){
        case 0:
            rt = new Date(nextTick.setUTCFullYear(nextTick.getUTCFullYear()+1));
            break;
        case 1:
            rt = new Date(nextTick.setUTCMonth(nextTick.getUTCMonth()+1));
            break;
        case 2:
            rt = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+1));
            break;
        case 3:
            rt = new Date(nextTick.setUTCDate(nextTick.getUTCDate()+1));
            break;

        }
        return rt;
    };
    var panAxis = function(){  //TODO: Draw y axis

        timeline.select(".x.axis")
            .call(xAxis);

        //FIXME: Make function for other zoom levels

        setTicks();

        allTicks = d3.selectAll('.x.axis>g.tick');

        boundaryTicks.each(function(){

            var boundaryTick = d3.select(this);
            var boundaryTickData = boundaryTick.data()[0];
            var nextBoundaryTickData = getNextBoundaryTickData(boundaryTickData);

            var nextNormalTickData = getNextNormalTickData(boundaryTickData);

            var boundaryTickWidth = Math.abs(x(nextBoundaryTickData) - x(boundaryTickData));
            var normalTickWidth = Math.abs(x(nextNormalTickData) - x(boundaryTickData));

            var subLabel = getSubLabel(boundaryTickData);

            if (($(this).find('line').attr('y1') !== '20')){
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

            if(($(this).find('line').attr('y1') !== '-2')){
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

        if(zoomLvl === 2){
            allTicks.each(function(){
                if(!$(this).find('line.tick-week').length){
                    var currentTick = d3.select(this);
                    var currentTickData = currentTick.data()[0];
                    if (currentTickData.getUTCDay() === 0){
                        //console.log(currentTick);
                        currentTick
                            .insert('line','rect')
                            .attr('y1',0)
                            .attr('y2',-10)
                            .attr('x2',0)
                            .classed('tick-week',true);
                    }
                }
            });
        }
        allTickBackgrounds = d3.selectAll('.x.axis>g.tick>rect.normaltick-background');
        allBoundaryTickForegrounds = d3.selectAll(".x.axis>g.tick>rect.boundarytick-foreground");

        //TODO: Optimize to no rebind what doesn't need to be rebinded
        allTickBackgrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverNormalTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            /*.on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickNormalTick.call(this,d);
            })*/
            .on('mousedown',function(){
                cancelClick = setTimeout(notClick,notClickDelay);
            })
            .on('mouseup',function(){
                clearTimeout(cancelClick);
                if(clicked){
                    d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                    clickNormalTick.call(this,d);
                }
                clicked = true;
            });
        allBoundaryTickForegrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverBoundaryTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('mousedown',function(){
                cancelClick = setTimeout(notClick,notClickDelay);
            })
            .on('mouseup',function(){
                clearTimeout(cancelClick);
                if(clicked){
                    d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                    clickBoundaryTick.call(this,d);
                }
                clicked = true;
            })
            /*.on('click',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                clickBoundaryTick.call(this,d);
            })*/;

        //dataBar.attr('d',selection);

        setData();

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
            $('#zoom-years').addClass("depth-4");
            $('#zoom-months').addClass("depth-3").css("margin","5px 0 0 0");
            $('#zoom-days').addClass("depth-2");
            //$('#zoom-weeks').addClass("depth-1").css("margin","25px 0 0 0");
            break;

        case 'days':
        case 2:
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-years').addClass("depth-3").css("margin","6px 0 0 0");
            $('#zoom-months').addClass("depth-2");
            $('#zoom-days').addClass("depth-1").css("margin", "8px 0 0 0").css('font-size','1.8em');
            //$('#zoom-weeks').addClass("depth-2").css("margin","10px 0 0 0");
            break;

        case 'months':
        case 1:
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-days').addClass("depth-2").css("margin","5px 0 0 0");
            $('#zoom-years').addClass("depth-2");
            $('#zoom-months').addClass("depth-1").css("font-size","1.7em");
            //$('#zoom-weeks').addClass("depth-3").css("margin","-3px 0 3px 0");
            break;

        case 'years':
        case 0:
            $('.zoom-btn').removeClass(function (index, css) {
                return (css.match (/(^|\s)depth-\S+/g) || []).join(' ');
            }).css("margin","").css("font-size","");
            $('#zoom-years').addClass("depth-1").css("font-size","1.7em");
            $('#zoom-months').addClass("depth-2").css("font-size","1.2em");
            $('#zoom-days').addClass("depth-3").css("margin","-3px 0 5px 0");
            //$('#zoom-weeks').addClass("depth-4");
        }
    };
    var removeLabelOnlyStuff = function(){
        var sd;
        var labeledBoundaryTicks = d3.selectAll('.x.axis>g.label-only.tick-labeled');

        labeledBoundaryTicks.selectAll('rect.normaltick-background').remove();
        d3.select(labeledBoundaryTicks[0][labeledBoundaryTicks[0].length-1]).selectAll('rect').remove();

        switch(zoomLvl){
        case 0:
            sd = new Date(dataLimits[0].getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
        case 1:
            sd = new Date(dataLimits[0].getUTCFullYear(),dataLimits[0].getUTCMonth(),model.selected.getUTCDate());
            break;
        case 2:
        case 3:
            sd = new Date(dataLimits[0].getUTCFullYear(),dataLimits[0].getUTCMonth(),dataLimits[0].getUTCDate());
            break;
        }
        if(dataLimits[0] < sd){ //FIXME:  Need to dynamically show and hide selectable areas
            /*d3.selectAll('.x.axis>g.label-only.tick-labeled rect.boundarytick-foreground')
                .on('mouseenter',null)
                .on('mouseleave',null)
                .on('click',null);
            */
        }
    };
    var removeNormalTickOnlyStuff = function(){
        var sd;
        var ftd = d3.selectAll('.x.axis>g.tick').data()[0];
        var lnt = d3.selectAll('.x.axis>g.label-only.tick rect.normaltick-background');

        d3.select(lnt[0][lnt[0].length-1]).remove();
        switch(zoomLvl){
        case 0:
            sd = new Date(ftd.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
            break;
        case 1:
            sd = new Date(ftd.getUTCFullYear(),dataLimits[0].getUTCMonth(),model.selected.getUTCDate());
            break;
        case 2:
        case 3:
            sd = new Date(ftd.getUTCFullYear(),ftd.getUTCMonth(),ftd.getUTCDate());
            break;
        }


        if(dataLimits[0] < sd){ //FIXME: need to dynamically show and hide selectable areas
            //var ft = d3.select(normalTicks[0][0]);
            //ft.remove();
        }
    };
    var setZoom = function(interval, event){  //this function should replace zoomable
        var startDate = dataLimits[0];
        var lastStartDomain = x.domain()[0];
        var lastEndDomain = x.domain()[1];
        var extStartDate = new Date(zoom.xExtent()[0]);
        var extEndDate = new Date(zoom.xExtent()[1]);
        var boundaryTickWidth, endDateInt, endDate,maxNumberOfTicks,normalTickWidth,tw;
        var rangeWidth;
        var mouseBool,mousePos,mouseOffset;

        if($(this).is('svg') && d3.event.sourceEvent){ //TODO: button zoom errors with this but mouse zooming doesnt
            mouseBool = true;
            mousePos = x.invert(d3.mouse(this)[0]);
            mouseOffset = width/2 - d3.mouse(this)[0];
        }

        setZoomBtns(interval);

        switch (interval){
        case 'years':
        case 0:
            tw = 150/10;
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
        case 'months':
        case 1:
            tw = 150/12;

            //Each tick is one month, see how many there are until xExtent
            numberOfTicks = (extEndDate.getUTCFullYear() - extStartDate.getUTCFullYear())*12 + extEndDate.getUTCMonth() + 1 - extStartDate.getUTCMonth();

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
        case 'days': //FIXME: needs to be fixed for being tooSmall
        case 2:
            tw = 11;

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
            tw = 18;

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
                .on("zoom", onPan, d3.event);
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
                .on("zoom", onPan, d3.event);
        }

        d3.select('#timeline-footer svg').call(zoom);

        if (mouseBool){
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
                .attr("x2",width);//+margin.left+margin.right);


        timeline.select(".x.axis")
            .call(xAxis); //update view after translate

        setTicks();
        //setTicks();

        boundaryTicks.selectAll('line')
            .attr("y1","20")
            .attr("y2","-50");

        boundaryTicks.insert("svg:circle","text").attr("r","6");

        boundaryTicks.each(function(){
            var boundaryTick = d3.select(this);
            var boundaryTickData = boundaryTick.data()[0];
            var nextBoundaryTickData = getNextBoundaryTickData(boundaryTickData);
            var nextNormalTickData = getNextNormalTickData(boundaryTickData);

            boundaryTickWidth = x(nextBoundaryTickData) - x(boundaryTickData);

            normalTickWidth = x(nextNormalTickData) - x(boundaryTickData);

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
            var normalTickData = normalTick.data()[0];
            var nextNormalTickData = getNextNormalTickData(normalTickData);

            normalTickWidth = x(nextNormalTickData) - x(normalTickData);

            normalTick.append("svg:rect")
                .attr("class","normaltick-background")
                .attr("height",height-1)
                .attr("y",-height)
                .attr("width",normalTickWidth);
        });

        allTicks = d3.selectAll('.x.axis>g.tick');

        if(zoomLvl === 2){
            allTicks.each(function(){
                var currentTick = d3.select(this);
                var currentTickData = currentTick.data()[0];
                if (currentTickData.getUTCDay() === 0){
                    //console.log(currentTick);
                    currentTick
                        .insert('line','rect')
                        .attr('y1',0)
                        .attr('y2',-10)
                        .attr('x2',0)
                        .classed('tick-week',true);
                }
            });
        }

        allTickBackgrounds = d3.selectAll('.x.axis>g.tick>rect.normaltick-background');
        allBoundaryTickForegrounds = d3.selectAll(".x.axis>g.tick>rect.boundarytick-foreground");

        allTickBackgrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverNormalTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('mousedown',function(){
                cancelClick = setTimeout(notClick,notClickDelay);
            })
            .on('mouseup',function(){
                clearTimeout(cancelClick);
                if(clicked){
                    d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                    clickNormalTick.call(this,d);
                }
                clicked = true;
            });
        allBoundaryTickForegrounds
            .on('mouseenter',function(){
                d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                hoverBoundaryTick.call(this,d);
            })
            .on('mouseleave',unHoverTick)
            .on('mousedown',function(){
                cancelClick = setTimeout(notClick,notClickDelay);
            })
            .on('mouseup',function(){
                clearTimeout(cancelClick);
                if(clicked){
                    d = d3.select(this.parentNode).data()[0]; //get Data from parent node (which is a tick)
                    clickBoundaryTick.call(this,d);
                }
                clicked = true;
            });
        if(tooSmall){
            removeLabelOnlyStuff();
            removeNormalTickOnlyStuff();
        }
        setData();
        //dataBar.attr('d',selection);

        //UPDATE GUITARPICK
        if (guitarPick){
            guitarPick.attr("transform","translate("+(x(model.selected)-25)+",-16)");
        }

    };

    var hoverBoundaryTick = function(d){
        if (zoomLvl === 0){
            var yearOffset = model.selected.getUTCFullYear() - Math.ceil(new Date(model.selected.getUTCFullYear()/10)*10);
            d = new Date(d.getUTCFullYear()+yearOffset,model.selected.getUTCMonth(),model.selected.getUTCDate());
        }
        else if (zoomLvl === 1){
            d = new Date(d.getUTCFullYear(),model.selected.getUTCMonth(),model.selected.getUTCDate());
        }
        else if (zoomLvl === 2){
            d = new Date(d.getUTCFullYear(),d.getUTCMonth(),model.selected.getUTCDate());
        }
        showHoverLabel.call(this,d);
    };
    var clickBoundaryTick = function(d){
        switch(zoomLvl){
        case 0:
            var yearOffset = model.selected.getUTCFullYear() - Math.ceil(new Date(model.selected.getUTCFullYear()/10)*10);
            d = new Date(d.getUTCFullYear()+yearOffset,model.selected.getUTCMonth(),model.selected.getUTCDate());
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
        if(tick.classList.contains('tick-labeled')){ //TODO: Check comaptibility of classList.contains
            $boundaryTick = $(tick);
        }
        else{
            $boundaryTick = $(tick).prevAll('g.tick-labeled').first(); //Grab Boundary Tick if it is a Normal Tick
        }

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
            .xExtent(dataLimits);



        //create timeline elements
        d3.select('#timeline-footer')
            .append("svg:svg")
            .attr('width', width)// + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .call(zoom)
            .append("svg:defs")
            .append("svg:clipPath")
            .attr("id","timeline-boundary")
            .append("svg:rect")
            .attr('width', width)// + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        d3.select("#timeline-footer svg defs")
            .append("svg:clipPath")
            .attr("id","guitarpick-boundary")
            .append("svg:rect")
            .attr('width', width+margin.left+margin.right)// + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr("y","-16")
            .attr("x",-margin.left);

        timeline = d3.select("#timeline-footer svg")
            .append("svg:g")
            .attr("clip-path","#timeline-boundary")
            .attr("style","clip-path:url(#timeline-boundary)");

        timeline.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .insert("line",":first-child")
                .attr("x1",0)
                .attr("x2",width);//+margin.left+margin.right);

        zoom.translate([width/2 - x(model.selected),0]); //go to selected date

        timeline.select(".x.axis")
            .call(xAxis); //update view after translate



        dataBars = timeline.insert("svg:g",'.x.axis')
            .attr("style","clip-path:url(#timeline-boundary)")
            .attr("clip-path","#timeline-boundary")
            .attr("height",height)
            .classed('plot',true);

        setZoom('days');
        setZoomBtns('days');

        //draw vertical ticks
        verticalAxis = timeline.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        verticalAxis.selectAll("text").remove();

        //Plot data

        /*
        dataBar = timeline.insert("svg:g",'.x.axis')
            .attr("style","clip-path:url(#timeline-boundary)")
            .attr("clip-path","#timeline-boundary")
            .attr("height",height)
            .classed('plot',true)
            .append("svg:path")
            .datum(layers)
            .attr("class", "data-bar")
            .attr("d", selection);
        */


        //initial setup of zoom buttons FIXME: make this much better


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

        guitarPick.on("mousedown",function(){  //TODO: Drag slider over small axes
            mousedown = true;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            guitarPick.classed('pick-clicked',true);
        })
        .on("mouseup",function(){
            mousedown = false;
            guitarPick.classed('pick-clicked',false);

        });

        //update date when sliding guitarpick across small axis
        d3.select(document).on("mousemove",function(){
            if (mousedown){
                var evt = window.event || d3.event || e;
                var xPos = evt.x || evt.clientX; //FIXME: needs more accuracy in Firefox
                var newDate;
                var mouseDate = x.invert((xPos-$('#timeline-header').outerWidth()-margin.left));
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

                if((newDate > dataLimits[0]) && (newDate < dataLimits[1])){
                    guitarPick.attr("transform","translate("+ (x(newDate)-28) +",-16)");
                    model.select(newDate);


                    //TODO: This is going to need to be udated when the zoom changes
                    var hoveredNormalTick = d3.selectAll('.x.axis>g.tick').filter(function(d){
                        switch(zoomLvl){
                        case 0:
                            return (d.getUTCFullYear() === newDate.getUTCFullYear());
                        case 1:
                            return (d.getUTCFullYear() === newDate.getUTCFullYear()) && (d.getUTCMonth() === newDate.getUTCMonth());
                        case 2:
                            return (d.getUTCFullYear() === newDate.getUTCFullYear()) && (d.getUTCMonth() === newDate.getUTCMonth() && (d.getUTCDate() === newDate.getUTCDate()));
                        case 3:
                            return (d.getUTCFullYear() === newDate.getUTCFullYear()) && (d.getUTCMonth() === newDate.getUTCMonth() && (d.getUTCDate() === newDate.getUTCDate()));

                        }
                    });
                    var hoveredNormalTickBackground = hoveredNormalTick.select('rect.normaltick-background')[0][0];
                    var d = d3.select(hoveredNormalTick[0][0]).data()[0];

                    unHoverTick();
                    hoverNormalTick.call(hoveredNormalTickBackground,d);
                }
            }
        });

        //stop guitarpick if mouseup anywhere on document
        d3.select(document).on("mouseup",function(){
            if (mousedown){
                mousedown = false;
                guitarPick.classed('pick-clicked',false);
                unHoverTick();
            }
        });
        ////////////////////////////End Timeline/////////////////////////////////////
        ///////////////////////////Begin Datepicker//////////////////////////////////
        //TODO: move to new file
        incrementBtn
            .mousedown(function() {
                forwardNextDay();
            })
            .mouseup(animateEnd);
        decrementBtn
            .mousedown(function() {
                reversePrevDay();
            })
            .mouseup(animateEnd);
        $(document)
            .keydown(function(event) {
                /*if ( event.target.nodeName === "INPUT" ) {
                    if((event.keyCode || event.which) === 9){

                        $('.button-input-group').parent().css('border-color','');
                        updateTime();

                    }
                    else return;
                }*/
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

        //bind click action to interval radio buttons
        var $buttons = $('.button-input-group');
        $buttons.on('focus',function(e){
            e.preventDefault();
            $buttons.siblings('.date-arrows').css('visibility','');
            $buttons.parent().removeClass('selected');
            $(this).parent().addClass('selected');
            $(this).siblings('.date-arrows').css('visibility','visible');
        });
        $buttons.focusout(function(e){
            $buttons.siblings('.date-arrows').css('visibility','');
            $buttons.parent().removeClass('selected');
        });
        var $incrementIntDate = $('.date-arrow-up');
        var $decrementIntDate = $('.date-arrow-down');
        $incrementIntDate.click(function(e){
            if(timer){
                clearTimeout(timer);
                daysInMonth = (new Date(selectedDate.getUTCFullYear(),selectedDate.getUTCMonth()+1,0)).getUTCDate();
            }
            else{
                selectedDate = new Date(model.selected);
                daysInMonth = (new Date(model.selected.getUTCFullYear(),model.selected.getUTCMonth()+1,0)).getUTCDate();
            }
            var $interval = $(this).siblings('.button-input-group').attr('id').replace("-input-group", "");
            var $dateVal = $(this).siblings('input.button-input-group');

            switch($interval){
                case 'day':
                var numberDate;
                if(parseInt($dateVal.val())<daysInMonth){
                    numberDate = parseInt(selectedDate.getUTCDate())+1;
                }
                else{
                    numberDate = 1;
                }
                if (numberDate>9){
                    $dateVal.val(numberDate);
                }
                else{
                    $dateVal.val("0" + numberDate);
                }
                selectedDate.setUTCDate(numberDate);
                break;
                case 'month':
                var monthDate;
                if (monthNumber($dateVal.val())+1<monthNames.length){
                    monthDate = parseInt(selectedDate.getUTCMonth())+1;
                }
                else{
                    monthDate = 0;
                }
                $dateVal.val(monthNames[monthDate]);
                selectedDate.setUTCMonth(monthDate);
                break;
                case 'year':
                $dateVal.val(parseInt(selectedDate.getUTCFullYear())+1);
                selectedDate.setUTCFullYear($dateVal.val());
                break;
            }
            timer = setTimeout(function(){
                if((selectedDate>dataLimits[0])&&(selectedDate<dataLimits[1])){
                    model.select(selectedDate);
                }
                else{
                    updateTime();
                }
                timer = null;
            },400);
            $(this).siblings('.button-input-group').focus();
        });

        //select all input on focus
        $('input').focus(function(e){
            $(this).select();
        }).mouseup(function(e){
            e.preventDefault();
        });

        $decrementIntDate.click(function(e){
            if(timer){
                clearTimeout(timer);
                daysInMonth = (new Date(selectedDate.getUTCFullYear(),selectedDate.getUTCMonth()+1,0)).getUTCDate();
            }
            else{
                selectedDate = new Date(model.selected);
                daysInMonth = (new Date(model.selected.getUTCFullYear(),model.selected.getUTCMonth()+1,0)).getUTCDate();
            }
            var $interval = $(this).siblings('.button-input-group').attr('id').replace("-input-group", "");
            var $dateVal = $(this).siblings('input.button-input-group');

                switch($interval){
                case 'day':
                    var numberDate;
                    if($dateVal.val()>1){
                        numberDate = parseInt(selectedDate.getUTCDate())-1;
                    }
                    else{
                        numberDate = daysInMonth;
                    }
                    if(numberDate>9){
                        $dateVal.val(numberDate);
                    }
                    else{
                        $dateVal.val("0" + numberDate);
                    }
                    selectedDate.setUTCDate(numberDate);
                    break;
                case 'month':
                    var monthDate;
                    if (monthNumber($dateVal.val())>0){
                        monthDate = parseInt(selectedDate.getUTCMonth())-1;
                    }
                    else{
                        monthDate = 11;
                    }
                    $dateVal.val(monthNames[monthDate]);
                    selectedDate.setUTCMonth(monthDate);
                    break;
                case 'year':
                    $dateVal.val(parseInt(selectedDate.getUTCFullYear())-1);
                    selectedDate.setUTCFullYear($dateVal.val());
                    break;
                }
            timer = setTimeout(function(){
                if((selectedDate>dataLimits[0])&&(selectedDate<dataLimits[1])){
                    model.select(selectedDate);
                }
                else{
                    updateTime();
                }
                timer = null;
            },400);

            $(this).siblings('.button-input-group').focus();
        });

        $('.button-input-group').keydown(function(event){
            //.change(function(){
            var kc = event.keyCode || event.which;
            if((kc === 13) || (kc === 9)){
                event.preventDefault();

                if($(this).parent().hasClass('selected')){
                    var selected = $(this);
                    var YMDInterval = selected.attr('id');
                    var newInput = selected.val();
                    var selectedDateObj = null;
                    switch(YMDInterval){
                    case 'year-input-group':
                        if ((newInput > 1000) && (newInput < 9999))
                            selectedDateObj = new Date((new Date(model.selected)).setUTCFullYear(newInput));
                        break;
                    case 'month-input-group':
                        if ($.isNumeric(newInput) && (newInput < 13) && (newInput > 0)){
                            selectedDateObj = new Date((new Date(model.selected)).setUTCMonth(newInput-1));
                        }
                        else{
                            var validStr = false;
                            var newIntInput;
                            newInput = newInput.toUpperCase();

                            for (var i=0;i<monthNames.length;i++){
                                if (newInput === monthNames[i]){
                                    validStr = true;
                                    newIntInput = i;
                                }
                            }
                            if (validStr){
                                selectedDateObj = new Date((new Date(model.selected)).setUTCMonth(newIntInput));
                            }
                        }
                        break;
                    case 'day-input-group':
                        if(newInput>0 && newInput<=(new Date(model.selected.getYear(),model.selected.getMonth()+1,0).getDate())){
                            selectedDateObj = new Date((new Date(model.selected)).setUTCDate(newInput));
                        }
                        break;
                    }
                    if((selectedDateObj > dataLimits[0]) && (selectedDateObj <= dataLimits[1])){
                        var ztw = zoom.translate()[0];
                        var sib =  selected.parent().next('div.input-wrapper').find('input.button-input-group');
                        if(sib.length < 1){
                            $('#focus-guard-2').focus();
                        }
                        model.select(selectedDateObj);
                        $('.button-input-group').parent().css('border-color','');
                        selected.parent().removeClass('selected');
                        sib.select().addClass('selected');
                    }
                    else{
                        selected.parent().css('border-color','#ff0000');
                        //updateTime();
                        selected.select();
                    }
                }
            }
        });
        $("#focus-guard-1").on('focus',function(){
            $("#day-input-group").focus().select();
        });
        $("#focus-guard-2").on('focus',function(){
           $("#year-input-group").focus().select();
        });
        ///////////////////////////End Datepicker////////////////////////////////////
        ////////////////////////////Click bindings///////////////////////////////////
        d3.select("#zoom-years").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('years');
        });
        d3.select("#zoom-months").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('months');
        });
        d3.select("#zoom-days").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('days');

        });
        /*d3.select("#zoom-weeks").on("click",function(d){
            $('.zoom-btn').removeClass("zoom-btn-selected");
            $(this).addClass("zoom-btn-selected");
            setZoom('week');

        });*/

        $('#timeline-hide').click(function() { self.toggle(); });

        //////////////////////////////end clicks////////////////////////////////////


        model.events.on("select", function(){
            updateTime();
            moveToPick();
        });

        models.layers.events.on("change",function(){
            setData();
        });
        models.layers.events.on('update',function(){

        });
        models.layers.events.on('visibility',function(){

        });

        updateTime();
        resizeWindow();
        wv.ui.mouse.wheel($("#timeline-footer svg")).change(zoomed);
        $('#timeline-footer').css('margin-left',margin.left-1 + 'px');
        $('#timeline-footer').css('margin-right',margin.right-1 + 'px');        
    }; // end init()
    var forwardNextDay = function(){ //FIXME: Limit animation correctly
        var nextDay = new Date(new Date(model.selected)
                               .setUTCDate(model.selected.getUTCDate()+1));
        if(nextDay <= dataLimits[1]){
            animateForward("day");
        }
        else{
            animateEnd();
        }
    };
    var reversePrevDay = function(){ //FIXME: Limit animation correctly
         var prevDay = new Date(new Date(model.selected)
                               .setUTCDate(model.selected.getUTCDate()-1));
        if(prevDay >= dataLimits[0]){
            animateReverse("day");
        }
        else{
            animateEnd();
        }
    };
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

    var zoomed = function(amount, event) {
        zoomLvl += amount;
        if ( zoomLvl < 0 ) {
            zoomLvl = 0;
        }
        if ( zoomLvl > 2 ) {
            zoomLvl = 2;
        }
        setZoom.call(this, zoomLvl, event);
    };

    var onPan = function(event) {
        if ( !(tooSmall) ) { //pan by mousedown and drag
            panAxis();
        }
    };

    init();
    $(window).resize(resizeWindow);

    self.toggle = function(){
        var tl = $('#timeline-footer');
        var tlz = $('#timeline-zoom');
        var tlg = d3.select('#timeline-footer svg > g:nth-child(2)');
        var gp = d3.select('#guitarpick');
        if(tl.is(':hidden')){
            tl.show('slow',function(){
                tlz.show();
                $('#timeline').css('right','10px');
                tlg.attr('style','clip-path:url("#timeline-boundary")');
                gp.attr("style","display:block;clip-path:url(#guitarpick-boundary);");
            });

        }
        else{
            tlg.attr('style','clip-path:none');
            gp.attr("style","display:none;clip-path:none");
            tlz.hide();
            tl.hide('slow');
            $('#timeline').css('right','auto');
        }
    };

    self.expand = function(){
        var tl = $('#timeline-footer, #timeline-zoom');
        if (tl.is(":hidden")){
            self.toggle();
        }
    };

    self.collapse = function(){
        var tl = $('#timeline-footer, #timeline-zoom');
        if (!tl.is(":hidden")){
            self.toggle();
        }
    };

    return self;
};
