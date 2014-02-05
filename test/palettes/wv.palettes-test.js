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

buster.testCase("wv.palettes", {

    config: null,
    errors: null,

    setUp: function() {
        this.config = {
            layers: {
                "layer1": {},
                "layer2": {}
            }
        };
        this.errors = [];
    },

    "Parses palette for valid layer": function() {
        var state = { palettes: "layer1,palette1" };
        wv.palettes.parse(state, this.errors, this.config);
        buster.assert.equals(state.palettes.layer1, "palette1");
        buster.assert.equals(this.errors.length, 0);
    },

    "Parses two palettes for valid layers": function() {
        var state = { palettes: "layer1,palette1~layer2,palette2" };
        wv.palettes.parse(state, this.errors, this.config);
        buster.assert.equals(state.palettes.layer1, "palette1");
        buster.assert.equals(state.palettes.layer2, "palette2");
        buster.assert.equals(this.errors.length, 0);
    },

    "Rejects palette for invalid layer": function() {
        var state = { palettes: "layerX,paletteX~layer2,palette2" };
        wv.palettes.parse(state, this.errors, this.config);
        buster.refute(state.palettes.layerX);
        buster.assert.equals(state.palettes.layer2, "palette2");
        buster.assert.equals(this.errors.length, 1);
    },

    "Rejects all palettes for invalid layers": function() {
        var state = { palettes: "layerX,paletteX~layerY,paletteY" };
        wv.palettes.parse(state, this.errors, this.config);
        buster.refute(state.palettes);
        buster.assert.equals(this.errors.length, 2);
    },

    "Translate one to one with custom palette": function() {
        var source = {
            colors: ["a", "b", "c"]
        };
        var target = {
            colors: ["1", "2", "3"]
        };
        var p = wv.palettes.translate(source, target);
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
        var p = wv.palettes.translate(source, target);
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
        var p = wv.palettes.translate(source, target);
        buster.assert.equals(p.colors[0], "1");
        buster.assert.equals(p.colors[1], "1");
        buster.assert.equals(p.colors[2], "2");
        buster.assert.equals(p.colors[3], "2");
        buster.assert.equals(p.colors[4], "3");
        buster.assert.equals(p.colors[5], "3");
    }
});