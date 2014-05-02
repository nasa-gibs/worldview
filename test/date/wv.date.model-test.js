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

buster.testCase("wv.date.model", {

    now: null,

    setUp: function() {
        var now = new Date(Date.UTC(2013, 0, 15));
        this.now = now;
        this.stub(wv.util, "now").returns(now);
    },

    "Initializes to today": function() {
        var date = wv.date.model();
        buster.assert.equals(date.selected.getUTCFullYear(), 2013);
        buster.assert.equals(date.selected.getUTCMonth(), 0);
        buster.assert.equals(date.selected.getUTCDate(), 15);
    },

    "Initializes with a specified date": function() {
        var initial = new Date(Date.UTC(2013, 0, 5));
        var date = wv.date.model({ initial: initial });
        buster.assert.equals(date.selected, initial);
    },

    "Select new date": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var listener = this.stub();
        var date = wv.date.model(this.config);
        date.events.on("select", listener);
        date.select(d);
        buster.assert.equals(date.selected, d);
        buster.assert.calledWith(listener, d);
    },

    "Date before start date selects start date": function() {
        var model = wv.date.model(this.config);
        model.range({
            start: wv.util.parseDateUTC("2013-01-01"),
            end: wv.util.parseDateUTC("2013-12-31")
        });
        model.select(wv.util.parseDateUTC("2012-03-15"));
        buster.assert.equals(wv.util.toISOStringDate(model.selected),
            "2013-01-01");
    },

    "Date after end date selects end date": function() {
        var model = wv.date.model(this.config);
        model.range({
            start: wv.util.parseDateUTC("2012-01-01"),
            end: wv.util.parseDateUTC("2012-01-31")
        });
        model.select(wv.util.parseDateUTC("2012-02-01"));
        buster.assert.equals(wv.util.toISOStringDate(model.selected),
            "2012-01-31");
    },

    "Saves state": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var date = wv.date.model(this.config);
        date.select(d);
        var state = {};
        date.save(state);
        buster.assert.equals(state.t, "2013-01-05");
    },

    "Loads state": function() {
        var date = new Date(Date.UTC(2013, 0, 5));
        var model = wv.date.model(this.config);
        var state = { t: date };
        model.load(state);
        buster.assert.equals(model.selected, date);
    },

    "Nothing selected when missing in state": function() {
        var model = wv.date.model(this.config);
        model.load({});
        buster.assert.equals(model.selected, this.now);
    },

    "Start/End times set to null if range is null": function() {
        var date = wv.date.model(this.config);
        date.range(null);
        buster.assert.equals(date.start, null);
        buster.assert.equals(date.end, null);
    },

    "End date set to today if end range is later": function() {
        var date = wv.date.model(this.config);
        date.range({
            start: wv.util.parseDateUTC("2012-01-01"),
            end:   wv.util.parseDateUTC("2013-04-01")
        });
        buster.assert.equals(date.end, wv.util.parseDateUTC("2013-01-15"));
    }

});
