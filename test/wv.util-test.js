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

buster.testCase("wv.util", {

    "fromQueryString: Converts string to object": function() {
        var query = wv.util.fromQueryString("foo=a&bar=b");
        buster.assert.equals(query.foo, "a");
        buster.assert.equals(query.bar, "b");
    },

    "fromQueryString: Empty object when there is no string": function() {
        buster.assert.equals(wv.util.fromQueryString(), {});
    },

    "fromQueryString: Decodes value": function() {
        var query = wv.util.fromQueryString("format=image%2fpng");
        buster.assert.equals(query.format, "image/png");
    },

    "toQueryString: Empty string with no values": function() {
        buster.assert.equals(wv.util.toQueryString({}), "");
    },

    "toQueryString: Converts object to string": function() {
        var qs = wv.util.toQueryString({foo: "a", bar: "b"});
        buster.assert.equals(qs, "?foo=a&bar=b");
    },

    "toQueryString: Encodes value": function() {
        var qs = wv.util.toQueryString({format: "image/png"});
        buster.assert.equals(qs, "?format=image%2Fpng");
    },

    "toQueryString: Exception not encoded": function() {
        var qs = wv.util.toQueryString({format: "image/png"}, ["%2f"]);
        buster.assert.equals(qs, "?format=image/png");
    },

    "toQueryString: Multiple exceptions not encoded": function() {
        var qs = wv.util.toQueryString({format: "/image/png/"}, ["%2f"]);
        buster.assert.equals(qs, "?format=/image/png/");
    },
});
