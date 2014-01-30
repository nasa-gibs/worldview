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

buster.testCase("wv.util.events", {

    events: null,

    setUp: function() {
        this.events = wv.util.events();
    },

    "Triggers an event": function() {
        var listener1 = this.stub();
        var listener2 = this.stub();
        this.events.on("test", listener1);
        this.events.on("test", listener2);
        this.events.trigger("test", "a", 2);
        buster.assert.calledWith(listener1, "a", 2);
        buster.assert.calledWith(listener2, "a", 2);
    },

    "Exception thrown when trying to register a null listener": function() {
        buster.assert.exception(function() {
            this.events.on("foo");
        });
    },

    "Removes listener": function() {
        var listener = this.stub();
        this.events.on("test", listener);
        this.events.trigger("test");
        this.events.off("test", listener);
        this.events.trigger("test");
        buster.assert.calledOnce(listener);
    }
});
