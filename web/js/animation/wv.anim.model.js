/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
var wv = wv || {};
wv.anim = wv.anim || {};
wv.anim.model = wv.anim.model || function(models, config) {     
    //state.a is now an object, check input and set values
    var self = {};
    self.delay = options.delay || 500;

    self.animationState = {
       active: false,
       speed: 10,
       loop: false,
       reverse: false,
    };

    self.load = function(state, errors) {
        if ( !_.isUndefined(state.a) ) {
            self.doAnimation = true; //set to false if something is wrong

            var attributes = state.a.attributes;
            attributes.forEach(function(attr) { //handle all input here
                if(attr.id === 'speed') {
                    try {
                        self.delay = parseFloat(1000 / attr.value);
                        if (self.delay > 1000)
                            self.delay = 1000;
                        else if (self.delay < 33)
                            self.delay = 33;
                    } catch (e) {
                        errors.push({message: "Invalid speed: " + e});
                        self.doAnimation = false;
                    }
                }
                else if(attr.id === 'loop')
                    self.loop = attr.value === 'true';
                else if(attr.id === 'interval') {
                    self.interval = attr.value;
                    if(self.interval !== 'day' && self.interval !== 'month' && self.interval !== 'year')
                        self.interval = 'day';
                }
                else if(attr.id === 'start') {
                    try {
                        self.initDate = wv.util.parseDateUTC(attr.value);
                    } catch (e) {
                        errors.push({message: e});
                        self.doAnimation = false;
                    }
                }
                else if(attr.id === 'end') {
                    try {
                        self.endDate = wv.util.parseDateUTC(attr.value);
                    } catch (e) {
                        errors.push({message: e});
                        self.doAnimation = false;
                    }
                }
            });

            //Check if dates have been set and no data download, otherwise no animation
            if(self.initDate === undefined || self.endDate === undefined || state.download)
                self.doAnimation = false;

            if(self.doAnimation) {
                //Prepare and start animation. Set UI elements
                $("#dialog").dialog("open");

                //HACK: Weird functionality with Date objects mean to show the right date, need to offset it by one
                var tempFrom = new Date(self.initDate), tempTo = new Date(self.endDate);
                tempFrom.setUTCDate(tempFrom.getUTCDate() + 1);
                tempTo.setUTCDate(tempTo.getUTCDate() + 1);
                ui.timeline.input.fromDate = _.clone(self.initDate);
                ui.timeline.input.toDate = _.clone(self.endDate);

                //update date picker widgets and sliders
                if(self.interval === 'month') {
                    $("#wv-month").attr("checked", "true");
                    ui.timeline.config.zoom(2); //zoom out to see pickers
                }
                else if(self.interval === 'year') {
                    $("#wv-year").attr("checked", "true");
                    ui.timeline.config.zoom(2);
                }

                $("#wv-speed-slider").val((1000 / self.delay).toFixed()); //val is the nouislider setter
                $("#loopcheck").attr("checked", self.loop);
                $("#from").datepicker("setDate", tempFrom);
                $("#to").datepicker("setDate", tempTo);
                d3.select("#fromPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.initDate));
                d3.select("#toPick").attr("transform", ui.timeline.pick.updateAnimPickers(self.endDate));
                model.selected = new Date(self.initDate.valueOf());

                ui.timeline.input.disableDialog();
                self.setDirectionAndRun(self.endDate.getTime(), self.initDate.getTime());
            }
        }
    };
    self.add = function(arra) {
        var updatedState = _.clone(self.state);
        arra.forEach(function(prop) {
            updatedState[prop.id] = prop.value;
        });
        self.animationState = updatedState;
    }

    //update animation fields, set animation settings into an object
    self.save = function(state, args) {
        var attributes;
        var activeState;
        var playStates;

        state.a = state.a || [];
        attributes = [];
        activeState = {id: args.active};
        playStates = {id: speed, args.}



        if($("#dialog").dialog("isOpen")) { //save if animation dialog open not just animating
            state.a = state.a || [];
            var astate = {id: "on"};
            astate.attributes = [];
            astate.attributes.push({id: "speed", value: (1000 /self.delay).toFixed()}, {id: "loop", value: (self.loop) ? "true" : "false"}, {id: "interval", value: self.interval});
            astate.attributes.push({id: "start", value: self.initDate.toISOString().split("T")[0]}, {id: "end", value: self.endDate.toISOString().split("T")[0]});
            state.a.push(astate);
        }
    };
    return self;
}