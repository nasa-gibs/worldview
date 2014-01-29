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

buster.testCase("wv.palette.model", {

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

    "Loads palette for layer": function(done) {
        var result = $.Deferred();
        result.resolve({ id: "palette1" });
        $.getJSON.returns(result);
        var self = this;
        this.model.forLayer("layer1").done(function(palette) {
            buster.assert.equals(palette.id, "palette1");
            buster.assert.equals(self.config.palettes.rendered.palette1.id,
                    "palette1");
            done();
        });
    },

    "Only loads palette once": function(done) {
        // Stuff configuration with existing palette
        this.config.palettes.rendered.palette1 = { id: "palette1" };
        this.model.forLayer("layer1").done(function(palette) {
            buster.assert.equals(palette.id, "palette1");
            buster.refute.called($.getJSON);
            done();
        });
    },

    "Error triggered if palette for layer unavailable": function(done) {
        var result = $.Deferred();
        result.reject();
        $.getJSON.returns(result);
        var trigger = this.stub(this.model.events, "trigger");
        this.model.forLayer("layer1").fail(function() {
            buster.assert.calledWith(trigger, "error");
            done();
        });
    },

    "Loads custom palettes": function(done) {
        var result = $.Deferred();
        result.resolve({ answer: "yes" });
        $.getJSON.returns(result);
        this.model.loadCustom().done(function(data) {
            buster.assert.equals(data.answer, "yes");
            done();
        });
    },

    "Only loads custom palettes once": function(done) {
        this.config.palettes.custom = { id: "custom1" };
        this.model.loadCustom().done(function(data) {
            buster.assert.equals(data.id, "custom1");
            buster.refute.called($.getJSON);
            done();
        });
    },

    "Error triggered if custom palettes are unavailable": function(done) {
        var result = $.Deferred();
        result.reject();
        $.getJSON.returns(result);
        var trigger = this.stub(this.model.events, "trigger");
        this.model.loadCustom().fail(function() {
            buster.assert.calledWith(trigger, "error");
            done();
        });
    },

    "Translate one to one with custom palette": function() {
        var source = {
            colors: ["a", "b", "c"]
        };
        var target = {
            colors: ["1", "2", "3"]
        };
        var p = this.model.translate(source, target);
        buster.assert.equals(p.colors[0], "1");
        buster.assert.equals(p.colors[1], "2");
        buster.assert.equals(p.colors[2], "3");
    },

    "Translate by compressing color range": function() {
        var source = {
            colors: ["a", "b", "c"]
        };
        var target = {
            colors: ["1", "2", "3", "4", "5", "6"]
        };
        var p = this.model.translate(source, target);
        buster.assert.equals(p.colors[0], "1");
        buster.assert.equals(p.colors[1], "3");
        buster.assert.equals(p.colors[2], "5");
    },

    "Translate by expanding color range": function() {
        var source = {
            colors: ["a", "b", "c", "e", "f", "g"]
        };
        var target = {
            colors: ["1", "2", "3"]
        };
        var p = this.model.translate(source, target);
        buster.assert.equals(p.colors[0], "1");
        buster.assert.equals(p.colors[1], "1");
        buster.assert.equals(p.colors[2], "2");
        buster.assert.equals(p.colors[3], "2");
        buster.assert.equals(p.colors[4], "3");
        buster.assert.equals(p.colors[5], "3");
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
        this.model.events.on("add", function(layerId, palette) {
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
        this.model.events.on("remove", function(layerId, palette) {
            self.model.forLayer(layerId).done(function(palette) {
                buster.assert.equals(palette.colors[0], "c1");
                buster.assert.equals(palette.values[0], "v1");
                done();
            });
        });
        this.model.add("layer1", "custom1");
        this.model.remove("layer1");
    },

    "To permalink": function() {
        this.model.active = {
            "layer1": { id: "custom1" },
            "layer2": { id: "custom2" }
        };
        buster.assert.equals(this.model.toPermalink(),
            "palettes=layer1,custom1~layer2,custom2");
    },

    "From permalink": function() {
        this.stub(this.model, "add");
        this.model.fromPermalink("palettes=layer1,custom1~layer2,custom2");
        buster.assert.calledWith(this.model.add, "layer1", "custom1");
        buster.assert.calledWith(this.model.add, "layer2", "custom2");
    }

});