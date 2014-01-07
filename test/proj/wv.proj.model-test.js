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

buster.testCase("wv.proj.model", {

    config: null,

    setUp: function() {
        this.config = {
            defaults: {
                projection: "geographic",
            },
            projections: {
                "geographic": {
                    id: "geographic",
                    epsg: "4326",
                    crs: "EPSG:4326"
                },
                "arctic": {
                    id: "arctic",
                    epsg: "3413",
                    crs: "EPSG:3413",
                    proj4: "Proj4 def"
                }
            }
        };
        window.Proj4js = window.Proj4js || {};
        window.Proj4js.defs = window.Proj4js.defs || {};
    },

    "Initializes with default": function() {
        var model = wv.proj.model(this.config);
        buster.assert.equals(model.selected.id, "geographic");
        buster.assert.equals(model.selected.crs, "EPSG:4326");
    },

    "Throws exception witn an invalid default": function() {
        this.config.defaults.projection = "invalid";
        var self = this;
        buster.assert.exception(function() {
            wv.proj.model(self.config);
        });
    },

    "Selects projection": function() {
        var model = wv.proj.model(this.config);
        var listener = this.stub();
        model.events.on("select", listener);
        model.select("arctic");
        buster.assert.equals(model.selected.id, "arctic");
        buster.assert.equals(model.selected.crs, "EPSG:3413");
        buster.assert.calledOnce(listener);
    },

    "Registers projection": function() {
        var model = wv.proj.model(this.config);
        model.select("arctic");
        buster.assert.equals(Proj4js.defs["EPSG:3413"], "Proj4 def");
    },

    "Event not fired if selection does not change": function() {
        var model = wv.proj.model(this.config);
        var listener = this.stub();
        model.events.on("select", listener);
        model.select("geographic");
        buster.refute.called(listener);
    },

    "To permalink": function() {
        var model = wv.proj.model(this.config);
        buster.assert.equals(model.toPermalink(), "switch=geographic");
    },

    "From permalink": function() {
        var model = wv.proj.model(this.config);
        model.fromPermalink("switch=arctic");
        buster.assert.equals(model.selected.id, "arctic");
    },

    "Ignores query string without projection": function() {
        var model = wv.proj.model(this.config);
        model.fromPermalink("x=arctic");
        buster.assert.equals(model.selected.id, "geographic");
    },

    "Emits warning on invalid projection in query string": function() {
        this.stub(wv.util, "warn");
        var model = wv.proj.model(this.config);
        model.fromPermalink("switch=foo");
        buster.assert.equals(model.selected.id, "geographic");
        buster.assert.calledOnce(wv.util.warn);
    }

});