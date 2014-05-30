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

buster.testCase("wv.date.model", function() {

    var self = {};
    var config, models, now;

    self.setUp = function() {
        now = new Date(Date.UTC(2013, 0, 15));
        this.stub(wv.util, "now").returns(now);
        config = fixtures.config();
        models = fixtures.models(config);
    };

    self["Initializes to today"] = function() {
        buster.assert.equals(models.date.selected.getUTCFullYear(), 2013);
        buster.assert.equals(models.date.selected.getUTCMonth(), 0);
        buster.assert.equals(models.date.selected.getUTCDate(), 15);
    };

    self["Initializes with a specified date"] = function() {
        var initial = new Date(Date.UTC(2013, 0, 5));
        var date = wv.date.model({ initial: initial });
        buster.assert.equals(date.selected, initial);
    };

    self["Select new date"] = function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        var listener = this.stub();
        models.date.events.on("select", listener);
        models.date.select(d);
        buster.assert.equals(models.date.selected, d);
        buster.assert.calledWith(listener, d);
    };

    self["Date before start date selects start date"] = function() {
        models.date.range({
            start: wv.util.parseDateUTC("2013-01-01"),
            end: wv.util.parseDateUTC("2013-12-31")
        });
        models.date.select(wv.util.parseDateUTC("2012-03-15"));
        buster.assert.equals(wv.util.toISOStringDate(models.date.selected),
            "2013-01-01");
    };

    self["Date after end date selects end date"] = function() {
        models.date.range({
            start: wv.util.parseDateUTC("2012-01-01"),
            end: wv.util.parseDateUTC("2012-01-31")
        });
        models.date.select(wv.util.parseDateUTC("2012-02-01"));
        buster.assert.equals(wv.util.toISOStringDate(models.date.selected),
            "2012-01-31");
    };

    self["Saves state"] = function() {
        var d = new Date(Date.UTC(2013, 0, 5));
        models.date.select(d);
        var state = {};
        models.date.save(state);
        buster.assert.equals(state.t, "2013-01-05");
    };

    self["Loads state"] = function() {
        var date = new Date(Date.UTC(2013, 0, 5));
        var state = { t: date };
        models.date.load(state);
        buster.assert.equals(models.date.selected, date);
    };

    self["Nothing selected when missing in state"] = function() {
        models.date.load({});
        buster.assert.equals(models.date.selected, now);
    };

    self["Start/End times set to null if range is null"] = function() {
        models.date.range(null);
        buster.assert.equals(models.date.start, null);
        buster.assert.equals(models.date.end, null);
    };

    self["End date set to today if end range is later"] = function() {
        models.date.range({
            start: wv.util.parseDateUTC("2012-01-01"),
            end:   wv.util.parseDateUTC("2013-04-01")
        });
        buster.assert.equals(models.date.end, 
                wv.util.parseDateUTC("2013-01-15"));
    };
    
    self["Clears time to UTC midnight when selecting"] = function() {
        var date = new Date(Date.UTC(2013, 1, 2, 3, 4, 5));
        models.date.select(date);
        var selected = models.date.selected;
        buster.assert.equals(selected.getUTCFullYear(), 2013);
        buster.assert.equals(selected.getUTCMonth(), 1);
        buster.assert.equals(selected.getUTCDate(), 2);
        buster.assert.equals(selected.getUTCHours(), 0);
        buster.assert.equals(selected.getUTCMinutes(), 0);
        buster.assert.equals(selected.getUTCSeconds(), 0);
    };
    
    return self;

}());
