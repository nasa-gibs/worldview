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

var wv = wv || {};
wv.util = wv.util || {};

wv.util.load = wv.util.load || (function() {

    var self = {};
    var configPromises = {};
    var loading = 0;

    self.config = function(root, attr, url) {
        promise = $.Deferred();
        // If a request is already outstanding, "ignore" it by returning
        // a promise that will never be fulfilled.
        if ( configPromises[url]) {
            return promise;
        }
        if ( root[attr] && _.size(root[attr]) > 0 ) {
            promise.resolve(root[attr]);
        } else {
            if ( loading === 0 ) {
                wv.ui.indicator.delayed(promise, 1000);
            }
            loading += 1;
            promise = $.getJSON(wv.brand.url(url));
            promise.done(function(result) {
                root[attr] = result;
            }).always(function() {
                delete configPromises[url];
                loading -= 1;
                if ( loading === 0 ) {
                    wv.ui.indicator.hide();
                }
            }).fail(wv.util.error);

            configPromises[url] = promise;
        }
        return promise;
    };

    return self;

})();
