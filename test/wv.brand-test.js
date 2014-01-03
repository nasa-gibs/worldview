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

buster.testCase("wv.events", {

    "Is development build": function() {
        buster.refute(wv.brand.release());
    },

    "Is release build": function() {
        this.stub(wv.brand, "VERSION", "0.0.0");
        buster.assert(wv.brand.release());
    }

});

