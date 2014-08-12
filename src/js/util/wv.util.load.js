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
    var indicatorTimeout = null;

    self.config = function(root, attr, url) {
        promise = $.Deferred();
        // If a request is already outstanding, chain to that one
        if ( configPromises[url]) {
            configPromises[url].done(promise.resolve).fail(promise.reject);
            return promise;
        }
        if ( root[attr] && _.size(root[attr]) > 0 ) {
            promise.resolve(root[attr]);
        } else {
            loading += 1;
            promise = $.getJSON(wv.brand.url(url));
            if ( loading === 1 ) {
                indicatorTimeout = setTimeout(function() {
                    wv.ui.indicator.loading();
                }, 2000);
            }
            promise.done(function(result) {
                root[attr] = result;
            }).always(function() {
                delete configPromises[url];
                loading -= 1;
                if ( loading === 0 ) {
                    clearTimeout(indicatorTimeout);
                    indicatorTimeout = null;
                    wv.ui.indicator.hide();
                }
            }).fail(wv.util.error);

            configPromises[url] = promise;
        }
        return promise;
    };

    return self;

})();
