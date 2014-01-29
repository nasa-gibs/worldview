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

    "fromQueryString: Empty object when there is no query string": function() {
        buster.assert.equals(wv.util.fromQueryString(""), {});
    },

    "fromQueryString: Values are parsed correctly": function() {
        var x = wv.util.fromQueryString("?foo=a&bar=b");
        buster.assert.equals("a", x.foo);
        buster.assert.equals("b", x.bar);
    },

    "fromQueryString: Does not need a leading ?": function() {
        var x = wv.util.fromQueryString("foo=a&bar=b");
        buster.assert.equals("a", x.foo);
        buster.assert.equals("b", x.bar);
    },

    "fromQueryString: Escaped values are converted": function() {
        var x = wv.util.fromQueryString("foo=image%2fjpeg");
        buster.assert.equals("image/jpeg", x.foo);
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

    "parseTimestampUTC: Parses valid timestamp": function() {
        var answer = new Date(Date.UTC(2013, 02, 15, 11, 22, 33));
        var result = wv.util.parseTimestampUTC("2013-03-15T11:22:33Z");
        buster.assert.equals(result.getTime(), answer.getTime());
    },

    "parseTimestampUTC: Parses valid timestamp without Z": function() {
        var answer = new Date(Date.UTC(2013, 02, 15, 11, 22, 33));
        var result = wv.util.parseTimestampUTC("2013-03-15T11:22:33");
        buster.assert.equals(result.getTime(), answer.getTime());
    },

    "parseDateUTC: Parses valid date": function() {
        var answer = new Date(Date.UTC(2013, 02, 15));
        var result = wv.util.parseDateUTC("2013-03-15");
        buster.assert.equals(result.getTime(), answer.getTime());
    },

    "parseDateUTC: Exception on invalid date": function() {
        buster.assert.exception(function() {
            wv.util.parseDateUTC("x");
        });
    },

    "toISOStringDate: Converts date": function() {
        var d = new Date(Date.UTC(2013, 0, 15));
        buster.assert.equals(wv.util.toISOStringDate(d), "2013-01-15");
    },

    "toISOStringTimeHM: Converts time": function() {
        var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
        buster.assert.equals(wv.util.toISOStringTimeHM(d), "11:22");
    },

    "toCompactTimestamp: Converts timestamp": function() {
        var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
        buster.assert.equals(wv.util.toCompactTimestamp(d),
            "20130115112233444");
    },

    "fromCompactTimestamp: Parses timestamp": function() {
        var answer = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
        var result = wv.util.fromCompactTimestamp("20130115112233444");
        buster.assert.equals(answer.getTime(), result.getTime());
    },

    "fromCompactTimestamp: Throws exception when invalid": function() {
        var answer = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
        buster.assert.exception(function() {
            wv.util.fromCompactTimestamp("x0130115112233444");
        });
    },

    "clearTimeUTC: Time set to UTC midnight": function() {
        var d = new Date(2013, 02, 15, 12, 34, 56, 789);
        wv.util.clearTimeUTC(d);
        buster.assert.equals(2013, d.getUTCFullYear());
        buster.assert.equals(2, d.getUTCMonth());
        buster.assert.equals(15, d.getUTCDate());
        buster.assert.equals(0, d.getUTCHours());
        buster.assert.equals(0, d.getUTCMinutes());
        buster.assert.equals(0, d.getUTCSeconds());
    },

    "ajaxCache: Non-cached request returned": function(done) {
        this.stub(jQuery, "ajax").returns(jQuery.Deferred().resolve("answer"));
        var cache = wv.util.ajaxCache();
        var promise = cache.submit({
            url: "url",
            data: "foo=bar"
        }).done(function(data) {
            buster.assert.equals(data, "answer");
            done();
        });
    },

    "URL with build nonce": function() {
        buster.assert.equals(wv.brand.url("foo"), "foo?v=@BUILD_NONCE@");
    },

    "URL build build nonce, existing query string": function() {
        buster.assert.equals(wv.brand.url("foo?bar=1"),
                "foo?bar=1&v=@BUILD_NONCE@");
    }

});
