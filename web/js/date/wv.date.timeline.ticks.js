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


/**
 * Perform timeline tick functions
 *
 * @class wv.date.timeline.ticks
 */

wv.date.timeline.ticks = wv.date.timeline.ticks || function(models, config, ui) {

    var tl = ui.timeline;

    var self = {};

    self.refresh = function(normalInterval,boundaryInterval){
        //setTicks()
        self.allTicks = d3.selectAll('.x.axis>g.tick');
        self.allTicks.classed('tick-labeled',false).classed('label-only',false);

        self.normal.set(normalInterval);

        if(!tl.isCropped){  //TODO: rewrite later
            if(self.allTicks.data()[0] > tl.data.start()){
                self.normal.add.start(normalInterval);
                //addNormStartTick();
            }

            if(self.allTicks.data()[self.allTicks.data().length-1] <= wv.util.today()){
                self.normal.add.end(normalInterval);
                //addNormEndTick();
            }
        }

        self.boundary.set(normalInterval);

        if($(self.normalTicks[0][0]).is(':nth-child(2)')){
            self.boundary.add.start(boundaryInterval);
            //addStartTick();
        }

        if(d3.select($(self.normalTicks[0][self.normalTicks[0].length-1]).next()[0]).classed('domain')){
            self.boundary.add.end(boundaryInterval);
            //addEndTick();
        }

        self.boundaryTicks.classed('tick-labeled',true);
    };

    self.normal = {
        add: {
            start: function(interval){ //TODO: Clean up and remove case.
                //addNormStartTick()
                var startTick = d3.selectAll('.x.axis>g.tick').data()[0];
                var fNormData;
                switch (interval){
                case 'year':
                    fNormData = new Date(Date.UTC(startTick.getUTCFullYear()-1,0,1));
                    break;
                case 'month':
                    fNormData = new Date(Date.UTC(startTick.getUTCFullYear(),startTick.getUTCMonth()-1,1));
                    break;
                case 'day':
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
                    .attr('y2',-tl.height);
                
                self.normal.set(interval);
                
            },
            end: function(interval){  //TODO: Clean up, remove case and maybe combine with start
                //addNormEndTick()
                var allTickData = d3.selectAll('.x.axis>g.tick').data();
                var endTick = wv.util.today();

                var lNormData;
                switch (interval){
                case 'year':
                    lNormData = new Date(Date.UTC(endTick.getUTCFullYear()+1,0,1));
                    break;
                case 'month':
                    lNormData = new Date(Date.UTC(endTick.getUTCFullYear(),endTick.getUTCMonth()+1,1));
                    break;
                case 'day':
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
                    .attr('y2',-tl.height);
                
                self.normal.set(interval);
            }
        },
        set: function(interval){  //TODO: remove cases?
            //setNormalTicks()
            self.normalTicks = d3.selectAll('.x.axis>g.tick').filter(function(d){
                var selection, value;
                switch (interval){
                case 'year':
                    selection = d.getUTCFullYear() % 10;
                    value = 0;
                    break;
                case 'month':
                    selection = d.getUTCMonth();
                    value = 0;
                    break;
                case 'day':
                    selection = d.getUTCDate();
                    value = 1;
                    break;
                }
                return selection !== value;
            });
        },
        hover: function(){
            //hoverNormalTick()
        },
        click: function(){
            //clickNormalTick()
        }
    };
    self.boundary = {
        add: { //TODO: Clean up and optimize
            start: function(interval){
                //addStartTick()
                var fBoundData,fBoundTxt;
                var fNormData = self.normalTicks.data()[0];
                switch (interval){
                case 'year':
                    fBoundData = new Date(Date.UTC(Math.floor(fNormData.getUTCFullYear()/10)*10,0,1));
                    fBoundTxt = fBoundData.getUTCFullYear();
                    break;
                case 'month':
                    fBoundData = new Date(Date.UTC(fNormData.getUTCFullYear(),0,1));
                    fBoundTxt = fBoundData.getUTCFullYear();
                    break;
                case 'day':
                    fBoundData = new Date(Date.UTC(fNormData.getUTCFullYear(),fNormData.getUTCMonth(),1));
                    fBoundTxt = '';//FIXME: monthNames[fBoundData.getUTCMonth()];
                    break;
                
                }
                var fBoundTick = tl.boundary.select('.x.axis').insert('g','g.tick').data([fBoundData])
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
                self.boundary.set(interval);
                self.boundaryTicks.classed('tick-labeled',true);
            },
            end: function(){
                //addEndTick()
                
            },
        },
        set: function(interval){ //FIXME: Remove cases?
            //setBoundaryTicks()
            self.boundaryTicks = d3.selectAll('.x.axis>g.tick').filter(function(d){
                var selection, value;
                switch (interval){
                case 'year':
                    selection = d.getUTCFullYear() % 10;
                    value = 0;
                    break;
                case 'month':
                    selection = d.getUTCMonth();
                    value = 0;
                    break;
                case 'day':
                    selection = d.getUTCDate();
                    value = 1;
                    break;
                }
                return selection === value;
            });
        },
        hover: function(){
            //hoverBoundaryTick()
        },
        click: function(){
            //clickBoundaryTick()
        }
        
    };

    self.label = {
        show: function(){
            //showHoverLabel()
        },
        remove: function(){
            
        }
    };

    var init = function(){
        
        //self.refresh();
    };

    init();
    return self;
};

