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

/* jshint sub: true */

buster.testCase("wv.layers", function() {

    var self = {};
    var config;
    var errors;

    self.setUp = function() {
        config = fixtures.config();
        errors = [];
    };

    self["Parses only one baselayer"] = function() {
        var state  = { products: "baselayers,terra-cr" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-cr");
        buster.assert.equals(errors.length, 0);
    };

    self["Parses only one overlay"] = function() {
        var state  = { products: "overlays,terra-aod" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-aod");
        buster.assert.equals(errors.length, 0);
    };

    self["Parses multiple layers"] = function() {
        var state  = { products: "baselayers,terra-cr~overlays,terra-aod,aqua-aod" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-cr");
        buster.assert.equals(state.products[1], "terra-aod");
        buster.assert.equals(state.products[2], "aqua-aod");
        buster.assert.equals(errors.length, 0);
    };

    self["Empty layer list"] = function() {
        var state = { products: "baselayers~overlays"};
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products.length, 0);
    };

    self["Supports old style period delimiters"] = function() {
        var state  = { products: "baselayers.terra-cr~overlays.terra-aod.aqua-aod" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-cr");
        buster.assert.equals(state.products[1], "terra-aod");
        buster.assert.equals(state.products[2], "aqua-aod");
        buster.assert.equals(errors.length, 0);
    };

    self["Skips invalid layers and records an error"] = function () {
        var state = { products: "baselayers,terra-cr~overlays,layerx,aqua-aod" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-cr");
        buster.assert.equals(state.products[1], "aqua-aod");
        buster.assert.equals(errors.length, 1);
    };

    self["No layers and no error if no groups found"] = function() {
        var state = { products: "layerx,layery" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products.length, 0);
    };

    self["Hidden layers, 1.1"] = function() {
        var state = { products: "baselayers,!terra-cr" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "terra-cr");
        buster.assert(state.hidden["terra-cr"]);
        buster.assert.equals(errors.length, 0);
    };

    self["Hidden layers, 1.2"] = function() {
        var state = { l: "terra-cr(hidden)" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.l[0].id, "terra-cr");
        buster.assert.equals(state.l[0].attributes[0].id, "hidden");
        buster.assert.equals(errors.length, 0);
    };

    self["Opacity"] = function() {
        var state = { l: "terra-cr(opacity=0.5)" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.l[0].id, "terra-cr");
        var attr = state.l[0].attributes[0];
        buster.assert.equals(attr.id, "opacity");
        buster.assert.equals(attr.value, "0.5");
        buster.assert.equals(errors.length, 0);
    };

    self["Minimum threshold"] = function() {
        var state = { l: "terra-cr(min=0.5)" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.l[0].id, "terra-cr");
        var attr = state.l[0].attributes[0];
        buster.assert.equals(attr.id, "min");
        buster.assert.equals(attr.value, "0.5");
        buster.assert.equals(errors.length, 0);
    };

    self["Maximum threshold"] = function() {
        var state = { l: "terra-cr(max=0.5)" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.l[0].id, "terra-cr");
        var attr = state.l[0].attributes[0];
        buster.assert.equals(attr.id, "max");
        buster.assert.equals(attr.value, "0.5");
        buster.assert.equals(errors.length, 0);
    };

    self["Layer redirects, 1.1"] = function() {
        config.redirects = {
            layers: {
                "terra-cr": "aqua-cr"
            }
        };
        var state = { products: "baselayers,terra-cr" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.products[0], "aqua-cr");
        buster.assert.equals(errors.length, 0);
    };

    self["Layer redirects, 1.2"] = function() {
        config.redirects = {
            layers: {
                "terra-cr": "aqua-cr"
            }
        };
        var state = { l: "terra-cr" };
        wv.layers.parse(state, errors, config);
        buster.assert.equals(state.l[0].id, "aqua-cr");
        buster.assert.equals(errors.length, 0);
    };

    return self;

}());
