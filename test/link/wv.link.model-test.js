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

    "Query string from registered components": function() {
        var c1 = { save: function(state) { state.foo = 1; } };
        var c2 = { save: function(state) { state.bar = 2; } };
        var model = wv.link.model();
        model.register(c1).register(c2);
        buster.assert.equals(model.toQueryString(), "foo=1&bar=2");
    },

    "Values encoded": function() {
        var c1 = { save: function(state) { state.foo = "?"; } };
        var model = wv.link.model();
        model.register(c1);
        buster.assert.equals(model.toQueryString(), "foo=%3F");
    },

    "Exceptions not encoded": function() {
        var c1 = { save: function(state) { state.foo = ","; } };
        var model = wv.link.model();
        model.register(c1);
        buster.assert.equals(model.toQueryString(), "foo=,");
    },

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
            buster.assert.calledWith(call, "service/link/shorten.cgi?url=foo");
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
