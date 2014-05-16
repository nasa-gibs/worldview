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

buster.testCase("wv.layers", {

    config: null,
    errors: null,

    setUp: function() {
        this.config = {
            layers: {
                "layer1": {},
                "layer2": {},
                "layer3": {}
            }
        };
        this.errors = [];
    },

    "Parses only one baselayer": function() {
        var state  = { products: "baselayers,layer1" };
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products[0], "layer1");
        buster.assert.equals(this.errors.length, 0);
    },

    "Parses only one overlay": function() {
        var state  = { products: "overlays,layer1" };
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products[0], "layer1");
        buster.assert.equals(this.errors.length, 0);
    },

    "Parses multiple layers": function() {
        var state  = { products: "baselayers,layer1~overlays,layer2,layer3" };
        console.log(state);
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products[0], "layer1");
        buster.assert.equals(state.products[1], "layer2");
        buster.assert.equals(state.products[2], "layer3");
        buster.assert.equals(this.errors.length, 0);
    },

    "Empty layer list": function() {
        var state = { products: "baselayers~overlays"};
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products.length, 0);
    },

    "Supports old style period delimiters": function() {
        var state  = { products: "baselayers.layer1~overlays.layer2.layer3" };
        wv.layers.parse(state, this.errors, this.config);
        // Reverse order
        buster.assert.equals(state.products[0], "layer1");
        buster.assert.equals(state.products[1], "layer2");
        buster.assert.equals(state.products[2], "layer3");
        buster.assert.equals(this.errors.length, 0);
    },

    "Skips invalid layers and records an error": function () {
        var state = { products: "baselayers,layer1~overlays,layerx,layer3" };
        wv.layers.parse(state, this.errors, this.config);
        // Reverse order
        buster.assert.equals(state.products[0], "layer1");
        buster.assert.equals(state.products[1], "layer3");
        buster.assert.equals(this.errors.length, 1);
    },

    "No layers if all invalid": function() {
        var state = { products: "layerx,layery" };
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products.length, 0);
    },

    "Hidden layers": function() {
        var state = { products: "!layer1" };
        wv.layers.parse(state, this.errors, this.config);
        // Reverse order
        buster.assert.equals(state.products[0], "layer1");
        buster.assert(state.hidden.layer1);
        buster.assert.equals(this.errors.length, 0);
    },

    "Layer redirects": function() {
        this.config.redirects = {
            layers: {
                layer1: "layer3"
            }
        };
        var state = { products: "layer1" };
        wv.layers.parse(state, this.errors, this.config);
        buster.assert.equals(state.products[0], "layer3");
        buster.assert.equals(this.errors.length, 0);
    }

});
