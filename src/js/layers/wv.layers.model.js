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

/**
 * @module wv.layers
 */
var wv = wv || {};
wv.layers = wv.layers || {};

/**
 * @class wv.layers.model
 */
wv.layers.model = wv.layers.model || function(models, config) {

    var self = {};

    var split = 0;
    self.events = wv.util.events();

    self.active = [];

    var init = function() {
        self.reset();
    };

    self.reset = function() {
        self.clear();
        if ( config.defaults && config.defaults.startingLayers ) {
            _.each(config.defaults.startingLayers, function(start) {
                self.add(start.id, start);
            });
        }
    };

    self.get = function(spec) {
        spec = spec || {};
        var baselayers = forGroup("baselayers", spec);
        var overlays = forGroup("overlays", spec);
        if ( spec.group === "baselayers" ) {
            return baselayers;
        }
        if ( spec.group === "overlays" ) {
            return overlays;
        }
        if ( spec.group === "all" ) {
            return { baselayers: baselayers, overlays: overlays };
        }
        if ( spec.group ) {
            throw new Error("Invalid layer group: " + spec.group);
        }
        return baselayers.concat(overlays);
    };

    self.available = function(layerId) {
        var def = config.layers[layerId];
        if ( def.period !== "daily" ) {
            return true;
        }
        if ( def.startDate ) {
            var start = wv.util.parseDateUTC(def.startDate);
            if ( models.date.selected < start ) {
                return false;
            }
        }
        if ( def.endDate ) {
            var end = wv.util.parseDateUTC(def.endDate);
            if ( models.date.selected > end ) {
                return false;
            }
        }
        return true;
    };

    self.dateRange = function(spec) {
        spec = spec || {};
        var projId = spec.projId || models.proj.selected.id;
        var layers = ( spec.layer ) ? [_.find(self.active, {id: spec.layer})]
                : self.active;
        if ( config.parameters && config.parameters.debugGIBS ) {
            return {
                start: new Date(Date.UTC(1970, 0, 1)),
                end: wv.util.today()
            };
        }
        var min = Number.MAX_VALUE;
        var max = 0;
        var range = false;
        _.each(layers, function(def) {
            if ( def.startDate ) {
                range = true;
                var start = wv.util.parseDateUTC(def.startDate).getTime();
                min = Math.min(min, start);
            }
            // For now, we assume that any layer with an end date is
            // an ongoing product unless it is marked as inactive.
            if ( def.inactive && def.endDate ) {
                range = true;
                var end = wv.util.parseDateUTC(def.endDate).getTime();
                max = Math.max(max, end);
            } else if ( def.endDate ) {
                range = true;
                max = wv.util.today().getTime();
            }
            // If there is a start date but no end date, this is a
            // product that is currently being created each day, set
            // the max day to today.
            if ( def.startDate && !def.endDate ) {
                max = wv.util.today().getTime();
            }
        });
        if ( range ) {
            if ( max === 0 ) {
                max = wv.util.today().getTime();
            }
            return {
                start: new Date(min),
                end: new Date(max)
            };
        }
    };

    self.add = function(id, spec) {
        if ( _.find(self.active, {id: id}) ) {
            return;
        }
        spec = spec || {};
        var def = config.layers[id];
        if ( !def ) {
            throw new Error("No such layer: " + id);
        }
        def.visible = true;
        if ( !_.isUndefined(spec.visible) ) {
            def.visible = spec.visible;
        } else if ( !_.isUndefined(spec.hidden) ) {
            def.visible = !spec.hidden;
        }
        def.opacity = ( _.isUndefined(spec.opacity) ) ? 1.0 : spec.opacity;
        if ( def.group === "overlays" ) {
            self.active.unshift(def);
            split += 1;
        } else {
            self.active.splice(split, 0, def);
        }
        self.events.trigger("add", def);
        self.events.trigger("change");
    };

    self.remove = function(id) {
        var index = _.findIndex(self.active, { id: id });
        var def = self.active[index];
        if ( index >= 0 ) {
            self.active.splice(index, 1);
            if ( index < split ) {
                split -= 1;
            }
            self.events.trigger("remove", def);
            self.events.trigger("change");
        }
    };

    self.replace = function(idOld, idNew) {
        var index = _.findIndex(self.active, { id: idOld });
        if ( index < 0 ) {
            return;
        }
        var oldDef = self.active[index];
        var newDef = config.layers[idNew];
        self.active[index] = newDef;
        self.events.trigger("update");
        self.events.trigger("change");
    };

    self.clear = function(projId) {
        projId = projId || models.proj.selected.id;
        var defs = self.active.slice(0);
        _.each(defs, function(def) {
            if ( projId && def.projections[projId] ) {
                self.remove(def.id);
            }
        });
    };

    self.pushToBottom = function(id) {
        var oldIndex = _.findIndex(self.active, { id: id });
        if ( oldIndex < 0 ) {
            throw new Error("Layer is not active: " + id);
        }
        var def = self.active[oldIndex];
        self.active.splice(oldIndex, 1);
        if ( def.group === "baselayers" ) {
            self.active.push(def);
        } else {
            self.active.splice(split - 1, 0, def);
        }
        self.events.trigger("update");
        self.events.trigger("change");
    };

    self.moveBefore = function(sourceId, targetId) {
        var sourceIndex = _.findIndex(self.active, { id: sourceId });
        if ( sourceIndex < 0 ) {
            throw new Error("Layer is not active: " + source);
        }
        var sourceDef = self.active[sourceIndex];

        var targetIndex = _.findIndex(self.active, { id: targetId });
        if ( targetIndex < 0 ) {
            throw new Error("Layer is not active: " + target);
        }

        self.active.splice(targetIndex, 0, sourceDef);
        if ( sourceIndex > targetIndex ) {
            sourceIndex++;
        }
        self.active.splice(sourceIndex, 1);
        self.events.trigger("update", sourceDef, targetIndex);
        self.events.trigger("change");
    };

    self.setVisibility = function(id, visible) {
        var def = _.find(self.active, { id: id });
        if ( def.visible !== visible ) {
            def.visible = visible;
            self.events.trigger("visibility", def, visible);
            self.events.trigger("change");
        }
    };

    self.setOpacity = function(id, opacity) {
        var def = _.find(self.active, { id: id });
        if ( def.opacity !== opacity ) {
            def.opacity = opacity;
            self.events.trigger("opacity", def, opacity);
            self.events.trigger("change");
        }
    };

    self.isRenderable = function(id) {
        var def = _.find(self.active, { id: id });
        if ( !def ) {
            return false;
        }
        var range = self.dateRange({layer: id});
        var date = models.date.selected;
        if ( range ) {
            if ( date < range.start || date > range.end ) {
                return false;
            }
        }

        if ( !def.visible || def.opacity === 0 ) {
            return false;
        }
        if ( def.group === "overlays" ) {
            return true;
        }
        var obscured = false;
        _.each(self.get({group: "baselayers"}), function(otherDef) {
            if ( otherDef.id === def.id ) {
                return false;
            }
            if ( otherDef.visible && otherDef.opacity === 1.0 ) {
                obscured = true;
                return false;
            }
        });
        return !obscured;
    };

    self.save = function(state) {
        var groups = [];
        _.each(self.get({group: "all"}), function(defs, group) {
            group = [group];
            _.each(defs, function(def) {
                prefix = ( !def.visible ) ? "!": "";
                group.push(prefix + def.id);
            });
            // Only list group if there are layers to save
            if ( group.length > 1 ) {
                groups.push(group.join(","));
            }
        });
        state.products = groups.join("~");
    };

    self.load = function(state) {
        if ( state.products ) {
            self.clear(models.proj.selected.id);
            _.eachRight(state.products, function(layerId) {
                var hidden = state.hidden && state.hidden[layerId];
                self.add(layerId, { visible: !hidden });
            });
        }
    };

    var forGroup = function(group, spec) {
        spec = spec || {};
        var projId = spec.proj || models.proj.selected.id;
        var results = [];
        var defs = _.filter(self.active, { group: group });
        _.each(defs, function(def) {
            // Skip if this layer isn't available for the selected projection
            if ( !def.projections[projId] ) {
                return;
            }
            if ( spec.renderable && !self.isRenderable(def.id) ) {
                return;
            }
            results.push(def);
        });
        if ( spec.reverse ) {
            results = results.reverse();
        }
        return results;
    };

    init();
    return self;

};
