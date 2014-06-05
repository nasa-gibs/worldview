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

buster.testCase("wv.layers.model", function() {

    var self = {};
    var config, models, errors, listener, changeListener;
    var l;
    
    self.setUp = function() {
        config = fixtures.config();
        models = fixtures.models(config);
        l = models.layers;
        errors = [];
        this.stub(wv.util, "today").returns(new Date(Date.UTC(2010, 0, 1)));
        listener = this.stub();
        changeListener = this.stub();
    };

    var stack = function() {
        l.add("terra-cr");
        l.add("aqua-cr");
        l.add("terra-aod");
        l.add("aqua-aod");
    };
    
    self["Adds base layer"] = function() {
        stack();
        l.events.on("add", listener);
        l.events.on("change", changeListener);
        l.add("mask");
        buster.assert.equals(_.pluck(l.get(), "id"),
            ["mask", "aqua-cr", "terra-cr", "aqua-aod", "terra-aod"]);
        buster.assert.calledWith(listener, config.layers.mask);
        buster.assert.called(changeListener);
    };
    
    self["Adds overlay"] = function() {
        stack();
        l.events.on("add", listener);
        l.events.on("change", changeListener);
        l.add("combo-aod");
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["aqua-cr", "terra-cr", "combo-aod", "aqua-aod", "terra-aod"]);
        buster.assert.calledWith(listener, config.layers["combo-aod"]);
        buster.assert.called(changeListener);
    };
    
    self["Doesn't add duplicate layer"] = function() {
        stack();
        l.events.on("add", listener);
        l.events.on("change", changeListener);
        l.add("terra-cr");
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["aqua-cr", "terra-cr", "aqua-aod", "terra-aod"]);
        buster.refute.called(listener);
        buster.refute.called(changeListener);
    };
    
    self["Removes base layer"] = function() {
        stack();
        l.events.on("remove", listener);
        l.events.on("change", changeListener);
        l.remove("terra-cr");
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["aqua-cr", "aqua-aod", "terra-aod"]);
        buster.assert.calledWith(listener, config.layers["terra-cr"]);
        buster.assert.called(changeListener);
    };
    
    self["Does nothing on removing a non-existant layer"] = function() {
        stack();
        l.events.on("remove", listener);
        l.events.on("change", changeListener);
        l.remove("mask");
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["aqua-cr", "terra-cr", "aqua-aod", "terra-aod"]);
        buster.refute.called(listener);
        buster.refute.called(changeListener);
    };
    
    self["Clears all layers"] = function() {
        stack();
        l.events.on("remove", listener);
        l.events.on("change", changeListener);
        l.clear();
        buster.assert.equals(_.pluck(l.get(), "id"), []);
        buster.assert.called(listener);
        buster.assert.called(changeListener);
    };

    self["Clears layers for projection"] = function() {
        stack();
        models.proj.select("arctic");
        l.clear();
        models.proj.select("geographic");
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["aqua-aod", "terra-aod"]);
    };
    
    self["Resets to default layers"] = function() {
        config.defaults.startingLayers = [
            { id: "terra-cr" },
            { id: "terra-aod"}
        ];
        models = fixtures.models(config);
        stack();
        l.reset();
        buster.assert.equals(_.pluck(l.get(), "id"), 
            ["terra-cr", "terra-aod"]);
    };
    
    self["Saves state"] = function() {
        l.add("terra-cr");
        l.add("terra-aod");
        var state = {};
        l.save(state);
        buster.assert.equals(state.l, [
            { id: "terra-cr", attributes: [] },
            { id: "terra-aod", attributes: [] }
        ]);
    };

    self["Saves state with hidden layer"] = function() {
        l.add("terra-cr");
        l.setVisibility("terra-cr", false);
        var state = {};
        l.save(state);
        buster.assert.equals(state.l, [
            { id: "terra-cr", attributes: [{ id: "hidden"}] }
        ]);
    };

    
    self["Loads state"] = function() {
        var state = {
            products: ["terra-cr", "terra-aod"]
        };
        l.load(state, errors);
        buster.assert.equals(l.active[0].id, "terra-aod");
        buster.assert.equals(l.active[1].id, "terra-cr" );
        buster.assert.equals(errors.length, 0);
    };

    self["Loads state with hidden layer"] = function() {
        var state = {
            products: ["terra-cr"],
            hidden: {"terra-cr": true}
        };
        l.load(state, errors);
        var def = _.find(l.active, { id: "terra-cr" });
        buster.assert(def);
        buster.refute(def.visible);
        buster.assert.equals(errors.length, 0);
    };
    
    return self;

}());
