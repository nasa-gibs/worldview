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
        this.models.change = wv.proj.change(this.models);
    },

    "Initializes with new projection": function() {
        buster.refute(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:4326");
    },

    "New projection with arctic": function() {
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        this.models.proj.select("arctic");
        buster.refute(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:3413");
    },

    "Old projection with arctic via projection change": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        buster.assert(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:3995");
    },

    "Old projection with arctic via date change": function() {
        this.models.proj.select("arctic");
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        buster.assert(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:3995");
    },

    "Old projection with antarctic": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("antarctic");
        buster.assert(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:3031");
    },

    "Changes back to new on date change": function() {
        this.models.proj.select("arctic");
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.date.select(new Date(Date.UTC(2014, 0, 1)));
        buster.refute(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:3413");
    },

    "Changes back to new on projection change": function() {
        this.models.date.select(new Date(Date.UTC(2013, 0, 1)));
        this.models.proj.select("arctic");
        this.models.proj.select("geographic");
        buster.refute(this.models.change.old);
        buster.assert.equals(this.models.change.crs, "EPSG:4326");
    }

});

