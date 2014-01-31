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
        this.models.palettes =  wv.palettes.model(this.models, this.config);
        this.model = this.models.palettes;
        this.stub($, "getJSON");
    },

    "Adds a custom palette": function(done) {
        this.config.palettes.rendered = {
            "palette1": {
                id: "palette1",
                colors: ["c1"],
                values: ["v1"]
            }
        };
        this.config.palettes.custom = {
            "custom1": {
                id: "custom1",
                colors: ["x1"]
            }
        };
        var self = this;
        this.model.events.on("add", function(layerId) {
            var palette = self.model.forLayer(layerId);
            buster.assert.equals(palette.colors[0], "x1");
            buster.assert.equals(palette.values[0], "v1");
            done();
        });
        this.model.add("layer1", "custom1");
    },

    "Removes a custom palette": function(done) {
        this.config.palettes.rendered = {
            "palette1": {
                id: "palette1",
                colors: ["c1"],
                values: ["v1"]
            }
        };
        this.config.palettes.custom = {
            "custom1": {
                id: "custom1",
                colors: ["x1"]
            }
        };
        var self = this;
        this.model.events.on("remove", function(layerId) {
            var palette = self.model.forLayer(layerId);
            buster.assert.equals(palette.colors[0], "c1");
            buster.assert.equals(palette.values[0], "v1");
            done();
        });
        this.model.add("layer1", "custom1");
        this.model.remove("layer1");
    },

    "To permalink": function() {
        this.model.active = {
            "layer1": "custom1",
            "layer2": "custom2"
        };
        buster.assert.equals(this.model.toPermalink(),
            "palettes=layer1,custom1~layer2,custom2");
    },

    "Empty permalink when no palettes are active": function() {
        buster.assert.equals(this.model.toPermalink(), "");
    },

    "From permalink": function() {
        this.stub(this.model, "add");
        this.model.fromPermalink("palettes=layer1,custom1~layer2,custom2");
        buster.assert.calledWith(this.model.add, "layer1", "custom1");
        buster.assert.calledWith(this.model.add, "layer2", "custom2");
    },

    "From permalink, encoded ~": function() {
        this.stub(this.model, "add");
        this.model.fromPermalink("palettes=layer1,custom1%7Elayer2,custom2");
        buster.assert.calledWith(this.model.add, "layer1", "custom1");
        buster.assert.calledWith(this.model.add, "layer2", "custom2");
    },

    "Warning from permalink when layer doesn't support palettes": function() {
        this.stub(wv.util, "warn");
        this.model.fromPermalink("palettes=layer3,customx");
        buster.assert.called(wv.util.warn);
    },

    "Warning from permalink when layer doesn't exist": function() {
        this.config.palettes.custom = {
            "custom1": {
                id: "custom1",
                colors: ["x1"]
            }
        };
        this.stub(wv.util, "warn");
        this.model.fromPermalink("palettes=layerx,custom1");
        buster.assert.called(wv.util.warn);
    }

});