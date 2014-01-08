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

buster.testCase("wv.proj.change", {

    config: null,
    models: null,

    setUp: function() {
        this.config = {
            defaults: {
                projection: "geographic",
            },
            projections: {
                geographic: {
                    id: "geographic",
                    epsg: "4326",
                    crs: "EPSG:4326"
                },
                arctic: {
                    id: "arctic",
                    epsg: "3413",
                    crs: "EPSG:3413",
                    proj4: "Proj4 def"
                },
                antarctic: {
                    id: "antarctic",
                    epsg: "3031",
                    crs: "EPSG:3031"
                }
            }
        };
        this.models = {
            date: wv.date.model(),
            proj: wv.proj.model(this.config)
        };
        this.stub(wv.ui, "notify");
    },

    "Initializes with new projection": function() {
        var model = wv.proj.change(this.models);
        buster.refute(model.old);
        buster.assert.equals(model.crs, "EPSG:4326");
    },

    "New projection with arctic": function() {
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        this.models.proj.select("arctic");
        buster.refute(model.old);
        buster.assert.equals(model.crs, "EPSG:3413");
    },

    "Old projection with arctic via projection change": function() {
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        buster.assert(model.old);
        buster.assert.equals(model.crs, "EPSG:3995");
    },

    "Old projection with arctic via date change": function() {
        var model = wv.proj.change(this.models);
        this.models.proj.select("arctic");
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        buster.assert(model.old);
        buster.assert.equals(model.crs, "EPSG:3995");
    },

    "Old projection with antarctic": function() {
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("antarctic");
        buster.assert(model.old);
        buster.assert.equals(model.crs, "EPSG:3031");
    },

    "Changes back to new on date change": function() {
        var model = wv.proj.change(this.models);
        this.models.proj.select("arctic");
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        buster.refute(model.old);
        buster.assert.equals(model.crs, "EPSG:3413");
    },

    "Changes back to new on projection change": function() {
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        this.models.proj.select("geographic");
        buster.refute(model.old);
        buster.assert.equals(model.crs, "EPSG:4326");
    },

    "No notification in first new arctic projection visit": function() {
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        buster.refute.called(wv.ui.notify);
    },

    "No notification in first old arctic projection visit": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        buster.refute.called(wv.ui.notify);
    },

    "Notification switching from new to old projection": function() {
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        buster.assert.calledOnce(wv.ui.notify);
    },

    "Notification switching from old to new projection": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        buster.assert.calledOnce(wv.ui.notify);
    },

    "Only notified once": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        buster.assert.calledOnce(wv.ui.notify);
    },

    "Not notified if 'Dont show again' selected": function() {
        this.stub(wv.util, "localStorage")
            .withArgs("projection_change_no_show")
            .returns("true");
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        var model = wv.proj.change(this.models);
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        buster.refute.called(wv.ui.notify);
    }

});

