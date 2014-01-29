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