/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * Namespace: Worldview.Permalink
 * Handles permalinks
 */
Worldview.namespace("State");

$(function() {
    
    // This namespace
    var ns = Worldview.State;
    
    var components = {};

    ns.register = function(name, component) {
        components[name] = component;    
    };
    
    ns.parse = function(queryString) {
        if ( !queryString ) {
            queryString = Worldview.Permalink.fromRegistry();
        }
        var results = {
            components: {}
        };
        $.each(components, function(name, component) {
            results.components[name] = component;
            component.parse(queryString, results);
        });
        return results; 
    };
    
    ns.get = function() {
        return ns.parse(Worldview.Permalink.fromRegistry());
    };
    
});

    