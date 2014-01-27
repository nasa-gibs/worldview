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
    },

    "Loads palette for layer": function(done) {
        var result = $.Deferred();
        result.resolve({ id: "palette1" });
        this.stub($, "getJSON").returns(result);
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
        this.stub($, "getJSON");
        this.model.forLayer("layer1").done(function(palette) {
            buster.assert.equals(palette.id, "palette1");
            buster.refute.called($.getJSON);
            done();
        });
    },

    "Error triggered if palette for layer unavailable": function(done) {
        var result = $.Deferred();
        result.reject();
        this.stub($, "getJSON").returns(result);
        var trigger = this.stub(this.model.events, "trigger");
        this.model.forLayer("layer1").fail(function() {
            buster.assert.calledWith(trigger, "error");
            done();
        });
    }

});