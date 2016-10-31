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
    self.delay = 500;
    self.events = wv.util.events();

    self.animationState = {
       active: false,
       speed: 10,
       loop: false,
       reverse: false
    };

    /*
     * Pulls state.a from permalink
     * on page load
     * 
     * @method load
     * @static
     *
     * @param state {object} state object
     * @param errors {object} error object
     * @returns {void}
     *
     */
    self.load = function(state, errors) {
        //is running twice on page load?????
        //console.log('loading');

        self.rangeState = self.rangeState || {};
        // self.rangeState.playing = false;
        // if(state.a) {
        //     self.rangeState.state = 'on';
        //     attributes = state.a.attributes;
        //     attributes.forEach(function(attr) {
        //         self.rangeState[attr.id] = attr.value;
        //     });
        // }

        if(state.ab) {
            self.rangeState.state = state.ab;
        }
        if(state.as && state.ae) {

            if(state.ae.length == 10 && state.as.length == 10) {
                self.rangeState.startDate = state.as;
                self.rangeState.endDate = state.ae;
            }
        }
        if(state.av) {
            self.rangeState.speed = state.av;
        }
        if(state.al) {
            self.rangeState.loop = Boolean(state.al);
        }
    };

    /*
     * Toggles state object between
     * on and off
     * 
     * @method toggleActive
     * @static
     *
     * @returns {void}
     *
     */
    self.toggleActive = function() {
        if(self.rangeState.state === 'off') {
            self.rangeState.state = 'on';
        } else {
            self.rangeState.state = 'off';
        }
    };

    /*
     * saves animation state to permalink
     * 
     * @method save
     * @static
     *
     * @returns {void}
     *
     */

    self.add = function(arra) {
        // var updatedState = _.clone(self.state);
        // arra.forEach(function(prop) {
        //     updatedState[prop.id] = prop.value;
        // });
        // self.animationState = updatedState;
    };

    /*
     * saves animation state to permalink
     * 
     * @method save
     * @static
     *
     * @returns {void}
     *
     */
    self.save = function(state) {
        var activeState;
        var playStates;
        var options;
        var newState;

        rangeState = self.rangeState;
        // state.a = state.a || [];
        // newState = {id: rangeState.state};
        // newState.attributes = [];
        if(rangeState.state) {
            state.ab = rangeState.state;
            state.as = rangeState.startDate;
            state.ae = rangeState.endDate;
            state.av = String(rangeState.speed);
            state.al = String(rangeState.loop);
        }
        // newState.attributes.push(
        //     {
        //         id:'startDate',
        //         value: rangeState.startDate
        //     },
        //     {
        //         id:'endDate',
        //         value: rangeState.endDate
        //     },
        //     {
        //         id:'speed',
        //         value: rangeState.speed
        //     },
        //     {
        //         id:'loop',
        //         value: rangeState.loop
        //     }
        // );
        // state.a.push(newState);
    };
    return self;
};