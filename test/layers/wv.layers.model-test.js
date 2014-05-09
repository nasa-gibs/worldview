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
        this.models = {};
        this.models.proj = wv.proj.model({
            defaults: {
                projection: "geographic"
            },
            projections: {
                arctic: { id: "arctic" },
                geographic: { id: "geographic" }
            }
        });
        this.models.layers = wv.layers.model(this.models, {
            layers: {
                base1: {
                    id: "base1",
                    group: "baselayers",
                    projections: { geographic: {} }
                },
                base2: {
                    id: "base2",
                    group: "baselayers",
                    projections: { geographic: {} }
                },
                over1: {
                    id: "over1",
                    group: "overlays",
                    projections: { geographic: {} }
                },
                over2: {
                    id: "over2",
                    group: "overlays",
                    projections: { geographic: {} }
                }
            }
        });
        this.model = this.models.layers;
        this.stub(wv.util, "today").returns(new Date(Date.UTC(2010, 0, 1)));
    },

    "Adds baselayers below overlays": function() {
        this.model.add("base1");
        this.model.add("over1");
        this.model.add("base2");
        this.model.add("over2");
        buster.assert.equals(this.model.active[0].id, "over2");
        buster.assert.equals(this.model.active[0].id, "over2");
    },

    "Saves state": function() {
        this.model.add("base1");
        this.model.add("over1");
        var state = {};
        this.model.save(state);
        buster.assert.equals(state.products,
                "baselayers,base1~overlays,over1");
    },

    "Saves state with hidden layer": function() {
        this.model.add("base1");
        this.model.setVisibility("base1", false);
        var state = {};
        this.model.save(state);
        buster.assert.equals(state.products, "baselayers,!base1");
    },

    "Loads state": function() {
        var state = {
            products: ["base1", "over1"]
        };
        var errors = [];
        this.model.load(state, errors);
        buster.assert.equals(this.model.active[0].id, "over1");
        buster.assert.equals(this.model.active[1].id, "base1" );
        buster.assert.equals(errors.length, 0);
    },

    "Loads state with hidden layer": function() {
        var state = {
            products: ["base1"],
            hidden: {"base1": true}
        };
        var errors = [];
        this.model.load(state, errors);
        var def = _.find(this.model.active, { id: "base1" });
        buster.assert(def);
        buster.refute(def.visible);
        buster.assert.equals(errors.length, 0);
    }

});
