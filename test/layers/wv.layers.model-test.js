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
                "arctic": { id: "arctic" },
                "geographic": { id: "geographic" }
            },
            layers: {
                "historical_1": {
                    id: "historical_1",
                    startDate: "2000-01-01",
                    endDate: "2002-01-01",
                    group: "baselayers",
                    projections: { geographic: {} }
                },
                "historical_2": {
                    id: "historical_2",
                    startDate: "2001-01-01",
                    endDate: "2003-01-01",
                    group: "overlays",
                    projections: { geographic: {} }
                },
                "active_1": {
                    id: "active_1",
                    startDate: "2005-01-01",
                    group: "overlays",
                    projections: { geographic: {} }
                },
                "static": {
                    id: "static",
                    group: "overlays",
                    projections: { geographic: {} }
                },
            }
        };
        this.models = {};
        this.models.proj = wv.proj.model(this.config);
        this.models.layers = wv.layers.model(this.models, this.config);
        this.model = this.models.layers;
        this.stub(wv.util, "today").returns(new Date(Date.UTC(2010, 0, 1)));
    },

    "Date range with one layer": function() {
        this.model.add("historical_1");
        var range = this.model.dateRange();
        buster.assert.equals(range.start.getTime(),
            new Date(Date.UTC(2000, 0, 1)).getTime());
        buster.assert.equals(range.end.getTime(),
            new Date(Date.UTC(2010, 0, 1)).getTime());
    },

    "Date range with two layers": function() {
        this.model.add("historical_1");
        this.model.add("historical_2");
        var range = this.model.dateRange();
        buster.assert.equals(range.start.getTime(),
            new Date(Date.UTC(2000, 0, 1)).getTime());
        buster.assert.equals(range.end.getTime(),
            new Date(Date.UTC(2010, 0, 1)).getTime());
    },

    "End of date range is today if no end date": function() {
        this.model.add("active_1");
        var range = this.model.dateRange();
        buster.assert.equals(range.start.getTime(),
            new Date(Date.UTC(2005, 0, 1)).getTime());
        buster.assert.equals(range.end.getTime(),
            new Date(Date.UTC(2010, 0, 1)).getTime());
    },

    "No date range with static": function() {
        this.model.add("static");
        buster.refute(this.model.dateRange());
    },

    "Saves state": function() {
        this.model.add("historical_1");
        this.model.add("historical_2");
        var state = {};
        this.model.save(state);
        buster.assert.equals(state.products,
                "baselayers,historical_1~overlays,historical_2");
    },

    "Saves state with hidden layer": function() {
        this.model.add("historical_1");
        this.model.setVisibility("historical_1", false);
        var state = {};
        this.model.save(state);
        buster.assert.equals(state.products, "baselayers,!historical_1");
    },

    "Loads state": function() {
        var state = {
            products: ["historical_1", "historical_2"]
        };
        var errors = [];
        this.model.load(state, errors);
        buster.assert(_.find(this.model.active, { id: "historical_1" }));
        buster.assert(_.find(this.model.active, { id: "historical_2" }));
        buster.assert.equals(errors.length, 0);
    },

    "Loads state with hidden layer": function() {
        var state = {
            products: ["historical_1"],
            hidden: {"historical_1": true}
        };
        var errors = [];
        this.model.load(state, errors);
        var def = _.find(this.model.active, { id: "historical_1" });
        buster.assert(def);
        buster.refute(def.visible);
        buster.assert.equals(errors.length, 0);
    }


});
