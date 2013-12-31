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

buster.testCase("wv.link.model", {

    "Shorten calls cgi script": function(done) {
        var link = wv.link.model();
        var call = this.stub(jQuery, "getJSON");
        call.returns(jQuery.Deferred().resolve({
            data: {
                url: "shorten"
            }
        }));
        var promise = link.shorten("foo");
        promise.done(function(result) {
            buster.assert.calledWith(call, "service/wv.link/shorten.cgi?url=foo");
            buster.assert.equals(result.data.url, "shorten");
            done();
        });
    },

    "Repeated call cached": function(done) {
        var link = wv.link.model();
        var call = this.stub(jQuery, "getJSON");
        call.returns(jQuery.Deferred().resolve({
            data: {
                url: "shorten"
            }
        }));
        link.shorten("foo");
        var promise = link.shorten("foo");
        promise.done(function(result) {
            buster.assert.equals(result.data.url, "shorten");
            buster.assert.calledOnce(call);
            done();
        });

    }

});
