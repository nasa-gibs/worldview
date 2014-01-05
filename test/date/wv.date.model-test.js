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

    config: null,
    now: null,

    setUp: function() {
        this.config = {
            defaults: {
                archiveStartDate: "2013-01-01"
            }
        };
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

    "Initializes with archive start date": function() {
        var date = wv.date.model(this.config);
        buster.assert.equals(date.archiveStartDate.getUTCFullYear(), 2013);
        buster.assert.equals(date.archiveStartDate.getUTCMonth(), 0);
        buster.assert.equals(date.archiveStartDate.getUTCDate(), 1);
    },

    "Exception thrown on invalid archive start date": function() {
        var config = {
            defaults: {
                archiveStartDate: "foo"
            }
        };
        buster.assert.exception(function() {
            var date = wv.date.model(config);
        });
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

    "To permalink": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var date = wv.date.model(this.config);
        date.select(d);
        buster.assert.equals(date.toPermalink(), "time=2013-01-05");
    },

    "From valid permalink": function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var date = wv.date.model(this.config);
        date.fromPermalink("time=2013-01-05");
        buster.assert.equals(date.selected, d);
    },

    "Not selected when time is not in permalink": function() {
        var date = wv.date.model(this.config);
        date.fromPermalink("foo=2013-01-05");
        buster.assert.equals(date.selected, this.now);
    },

    "Warning emitted when time is invalid": function() {
        var date = wv.date.model(this.config);
        this.stub(wv.util, "warn");
        date.fromPermalink("time=X");
        buster.assert.equals(date.selected, this.now);
        buster.assert.calledOnce(wv.util.warn);
    }

});