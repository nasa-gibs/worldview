/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represe`nted by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.layers = wv.layers || {};

wv.layers.metadata = function(layer) {
    var url = "config/metadata/" + layer.metadata + ".html?v=@BUILD_NONCE@";
    if ( wv.util.browser.small ) {
        window.open(url, "_blank");
    } else {
        wv.ui.getDialog().dialog({
            title: "Layer Information",
            width: 625,
            height: 525,
            show: { effect: "fade" },
            hide: { effect: "fade" }
        }).load(url + " #page");
    }
};
