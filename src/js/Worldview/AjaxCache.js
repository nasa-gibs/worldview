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
 * @module Worldview
 */

Worldview.AjaxCache = function(spec) {
    
    spec = spec || {};
    var size = spec.size || null;
    var options = spec.options || {};
    var cache = new Cache(size);
    
    var self = {};
    
    self.submit = function(parameters) {
        var key = $.param(parameters, true);
        var results = cache.getItem(key);
        
        if ( results ) {
            return $.Deferred().resolve(results).promise();
        } else {
            var promise = $.ajax(parameters);
            promise.done(function(results) {
                cache.setItem(key, results, options);
            });
            return promise;
        }    
    };
    
    return self;
    
};

