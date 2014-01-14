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

buster.testCase("wv.layers.model", {

    config: null,
    models: null,
    model: null,

    setUp: function() {
        this.config = {
            defaults: {
                projection: "geographic"
            },
            projections: {
                "arctic": {},
                "geographic": {}
            },
            layers: {
                "layer1": {
                    id: "layer1",
                    startDate: "2000-01-01",
                    endDate: "2002-01-01",
                    group: "overlays"
                },
                "layer2": {
                    id: "layer2",
                    startDate: "2001-01-01",
                    endDate: "2003-01-01",
                    group: "overlays"
                },
                "static: {
                    id: "static",
                    group: "overlays"
                }
            }
        };
        this.models = {};
        this.models.proj = wv.proj.model(this.config);
        this.models.layers = wv.layers.model(this.models, this.config);
        this.model = this.models.layers;
    },

    "Date range with one layer": function() {
        this.model.add("layer1");
        var range = this.model.dateRange();
        buster.assert.equals(range.min.getTime(),
            new Date(Date.UTC(2000, 0, 1)).getTime());
        buster.assert.equals(range.max.getTime(),
            new Date(Date.UTC(2002, 0, 1)).getTime());
    },

    "Date range with two layers": function() {
        this.model.add("layer1");
        this.model.add("layer2");
        var range = this.model.dateRange();
        buster.assert.equals(range.min.getTime(),
            new Date(Date.UTC(2000, 0, 1)).getTime());
        buster.assert.equals(range.max.getTime(),
            new Date(Date.UTC(2003, 0, 1)).getTime());
    },

    "No date range with static": function() {
        this.model.add("static");
        buster.refute(this.model.dateRange());
    }

});
