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

buster.testCase("wv.data", {

    config: null,
    errors: null,

    setUp: function() {
        this.config = {
            products: {
                "product1": {}
            }
        };
        this.errors = [];
    },

    "Parses state": function() {
        var state = { dataDownload: "product1" };
        wv.data.parse(state, this.errors, this.config);
        buster.assert.equals(state.dataDownload, "product1");
        buster.assert.equals(this.errors.length, 0);
    },

    "Error on an invalid product": function() {
        var state = { dataDownload: "productX" };
        wv.data.parse(state, this.errors, this.config);
        buster.refute(state.dataDownload);
        buster.assert.equals(this.errors.length, 1);
    }

});
