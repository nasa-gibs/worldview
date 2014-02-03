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

buster.testCase("wv.ui.indicator", {

    "Delayed indicator shown": function(done) {
        this.stub(wv.ui.indicator, "loading");
        this.stub(wv.ui.indicator, "hide");
        var promise = $.Deferred();
        wv.ui.indicator.delayed(promise, 10);
        setTimeout(function() {
            promise.resolve();
            buster.assert.called(wv.ui.indicator.loading);
            buster.assert.called(wv.ui.indicator.hide);
            done();
        }, 20);
    },

    "Delayed indicator not shown": function(done) {
        this.stub(wv.ui.indicator, "loading");
        this.stub(wv.ui.indicator, "hide");
        var promise = $.Deferred();
        wv.ui.indicator.delayed(promise, 1000);
        setTimeout(function() {
            promise.resolve();
            buster.refute.called(wv.ui.indicator.loading);
            buster.refute.called(wv.ui.indicator.hide);
            done();
        }, 20);
    },

});
