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

buster.testCase("wv.map.model", function() {

    var self = {};
    var config;
    var errors;

    self.setUp = function() {
        config = fixtures.config();
        models = fixtures.models(config);
        errors = [];
    };

    self["Loads valid extent"] = function() {
        models.map.load({v: [-10, -10, 10, 10]}, errors);
        buster.assert.equals([-10, -10, 10, 10], models.map.extent);
        buster.assert.equals(0, errors.length);
    };

    self["Defaults to max extent if out-of-bounds on load"] = function() {
        models.map.load({v: [-1000, -1000, -1000, -1000]}, errors);
        buster.assert.equals([-180, -90, 180, 90], models.map.extent);
        buster.assert.equals(1, errors.length);
    };

    return self;

}());
