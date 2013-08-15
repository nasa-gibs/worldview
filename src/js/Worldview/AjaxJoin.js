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

Worldview.AjaxJoin = function(calls) {
    
    var completed = 0;
    var result = {};
    var deferred = $.Deferred();
    
    $.each(calls, function(index, call) {
        call.promise.done(function(data) {
            result[call.item] = data;
            completed += 1;
            if ( completed == calls.length ) {
                deferred.resolve(result);
            }          
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(jqXHR, textStatus, errorThrown);
        });
    });

    return deferred.promise();
};
