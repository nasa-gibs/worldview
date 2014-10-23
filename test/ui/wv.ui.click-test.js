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

buster.testCase("wv.ui.click", function() {

    var self = {};
    var element, down, up;

    self.setUp = function() {
        element = {
            mousedown: function(handler) {
                down = handler;
            },
            mouseup: function(handler) {
                up = handler;
            }
        };
    };

    self["Within click limit"] = function() {
        var callback = this.stub();
        wv.ui.click(element, callback);
        down({ clientX: 0, clientY: 0});
        up({clientX: 2, clientY: 2});
        buster.assert.called(callback);
    };

    self["Outside click limit"] = function() {
        var callback = this.stub();
        wv.ui.click(element, callback);
        down({ clientX: 0, clientY: 0});
        up({clientX: 12, clientY: 12});
        buster.refute.called(callback);
    };

    return self;

}());
