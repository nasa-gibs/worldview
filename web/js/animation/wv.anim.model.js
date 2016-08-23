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

    self.load = function(state, errors) {
        if(state.a) {
            self.rangeState = self.rangeState || {};
            attributes = state.a.attributes;

            attributes.forEach(function(attr) {
               self.rangeState[attr.id] = attr.value;
            })
        }
    };
    self.add = function(arra) {
        var updatedState = _.clone(self.state);
        arra.forEach(function(prop) {
            updatedState[prop.id] = prop.value;
        });
        self.animationState = updatedState;
    };
    
    self.animate = function() {
        
    }

    //update animation fields, set animation settings into an object
    self.save = function(state) {
        var activeState;
        var playStates;
        var options;
        var newState;

        rangeState = self.rangeState;
        state.a = state.a || [];
        newState = {id: rangeState.state};
        newState.attributes = [];

        newState.attributes.push(
          {
            id:'startDate',
            value: rangeState.startDate
          },
          {
            id:'endDate',
            value: rangeState.endDate
          }
          );
        state.a.push(newState);
    };
    return self;
}