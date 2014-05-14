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

buster.testCase("wv.palettes.model", {

    config: null,
    models: null,
    model: null,

    setUp: function() {
        this.config = {
            layers: {
                "layer1": {
                    id: "layer1",
                    group: "overlays",
                    projections: {
                        geographic: {}
                    },
                    palette: {
                        id: "palette1"
                    }
                },
                "layer3": {
                    id: "layer3"
                }
            },
            palettes: {
                custom: {},
                rendered: {}
            }
        };
        this.models = {};
        this.models.proj = {
            selected: { id: "geographic" }
        };
        this.models.layers = wv.layers.model(this.models, this.config);
        this.models.palettes =  wv.palettes.model(this.models, this.config);
        this.model = this.models.palettes;
        this.stub($, "getJSON");
    },

    "Sets a custom palette": function(done) {
        this.config.palettes.rendered = {
            "palette1": {
                id: "palette1",
                scale: {
                    colors: ["c1"],
                    labels: ["v1"]
                }
            }
        };
        this.config.palettes.custom = {
            "custom1": {
                id: "custom1",
                colors: ["x1"]
            }
        };
        var self = this;
        this.model.events.on("set-custom", function(layerId) {
            var palette = self.model.get(layerId);
            buster.assert.equals(palette.scale.colors[0], "x1");
            buster.assert.equals(palette.scale.labels[0], "v1");
            done();
        });
        this.model.setCustom("layer1", "custom1");
    },

    "Clears a custom palette": function(done) {
        this.config.palettes.rendered = {
            "palette1": {
                id: "palette1",
                scale: {
                    colors: ["c1"],
                    labels: ["v1"]
                }
            }
        };
        this.config.palettes.custom = {
            "custom1": {
                id: "custom1",
                colors: ["x1"]
            }
        };
        var self = this;
        this.model.events.on("clear-custom", function(layerId) {
            var palette = self.model.get(layerId);
            buster.assert.equals(palette.scale.colors[0], "c1");
            buster.assert.equals(palette.scale.labels[0], "v1");
            done();
        });
        this.model.setCustom("layer1", "custom1");
        this.model.clearCustom("layer1");
    },

    "Saves state": function() {
        this.model.active = {
            "layer1": "custom1",
            "layer2": "custom2"
        };
        var state = {};
        this.model.save(state);
        buster.assert.equals(state.palettes, "layer1,custom1~layer2,custom2");
    },

    "Empty state no palettes are active": function() {
        var state = {};
        this.model.save(state);
        buster.refute(state.palettes);
    },

    "Loads state": function() {
        this.stub(this.model, "setCustom");
        var state = {
            palettes: {
                layer1: "custom1",
                layer3: "custom3"
            }
        };
        this.config.palettes.custom = {
            custom1: {},
            custom3: {}
        };
        var errors = [];
        this.model.load(state, errors);
        buster.assert.calledWith(this.model.setCustom, "layer1", "custom1");
        buster.assert.calledWith(this.model.setCustom, "layer3", "custom3");
        buster.assert.equals(errors.length, 0);
    },

    /*
    "From permalink, encoded ~": function() {
        this.stub(this.model, "add");
        this.model.fromPermalink("palettes=layer1,custom1%7Elayer2,custom2");
        buster.assert.calledWith(this.model.add, "layer1", "custom1");
        buster.assert.calledWith(this.model.add, "layer2", "custom2");
    },
    */

    "Error during load when layer doesn't support palettes": function() {
        this.stub(wv.util, "warn");
        var state = {
            palettes: {
                layer1: "customx"
            }
        };
        var errors = [];
        this.model.load(state, errors);
        buster.assert.equals(errors.length, 1);
    },

    "Palettes in use when active layer has a selected palette": function() {
        this.models.layers.add("layer1");
        this.model.active.layer1 = "palette1";
        buster.assert(this.model.inUse());
    },

    "Palettes are not in use when no active layers have a palette": function() {
        this.models.layers.add("layer1");
        this.model.active.layer1 = "palette1";
        this.models.layers.remove("layer1");
        buster.refute(this.model.inUse());
    }

});
