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

var config = module.exports;

config["wv"] = {
    rootPath: "./",
    environment: "browser",
    libs: [
        "src/wv/ext/lodash/*.js",
        "src/wv/ext/jquery/*.js",
        "src/wv/ext/jscache/*.js",
    ],
    src: [
        "src/wv/**/*.js",
        "!src/wv/**/ext/**/*.js"
    ],
    tests: [
        "test/**/*.js"
    ]
};
