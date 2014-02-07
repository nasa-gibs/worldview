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

buster.testCase("wv.date", {

    "Parses valid date": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var state = { time: "2013-01-05" };
        var errors = [];
        wv.date.parse(state, errors);
        buster.assert.equals(state.time, d);
        buster.assert.equals(errors.length, 0);
    },

    "Error added if date is invalid": function() {
        var state = { time: "X" };
        var errors = [];
        wv.date.parse(state, errors);
        buster.assert.equals(errors.length, 1);
        buster.refute(state.time);
    },

    "Overrides now": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var state = { now: "2013-01-05" };
        var errors = [];
        wv.date.parse(state, errors);
        buster.assert.equals(wv.util.now(), d);
        buster.assert.equals(errors.length, 0);
    },

    "Error added if now is invalid": function() {
        var state = { now: "X" };
        var errors = [];
        wv.date.parse(state, errors);
        buster.assert.equals(errors.length, 1);
        buster.refute(state.now);
    }

});

