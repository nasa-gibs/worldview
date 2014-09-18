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

var wv = wv || {};
wv.ui = wv.ui || {};

wv.ui.indicator = wv.ui.indicator || (function() {

    var self = {};

    var $indicator;
    var $icon;
    var $message;

    self.active = [];

    var init = function() {
        $indicator = $("<div></div>")
            .attr("id", "indicator");
        $icon = $("<img></img>");
        $message = $("<span></span");

        $indicator.append($icon).append($message).hide();
        $("body").append($indicator);
    };

    self.show = function(message, icon) {
        self._show(message, icon);
        var id = _.uniqueId();
        self.active.push({
            id: id,
            message: message,
            icon: icon
        });
        return id;
    };

    self.hide = function(hides) {
        if ( _.isString(hides) ) {
            hides = [hides];
        }
        _.each(hides, function(id) {
            _.remove(self.active, { id: id });
        });
        if ( _.isEmpty(self.active) ) {
            self._hide();
        } else {
            var def = _.last(self.active);
            self._show(def.message, def.icon);
        }
    };

    self.replace = function(hides, message, icon) {
        self.hide(hides);
        return self.show(message, icon);
    };

    self._show = function(message, icon) {
        if ( !$indicator ) {
            init();
        }
        if ( icon ) {
            $indicator.removeClass("message");
            $icon.attr("src", icon).show();
        } else {
            $indicator.addClass("message");
            $icon.removeAttr("src").hide();
        }
        $message.html(message);
        $indicator.show();
    };

    self._hide = function() {
        if ( $indicator ) {
            $indicator.hide();
        }
    };

    self.searching = function(hides) {
        if ( hides ) {
            self.hide(hides);
        }
        return self.show("Searching ECHO for Data", "images/activity.gif");
    };

    self.loading = function(hides) {
        if ( hides ) {
            self.hide(hides);
        }
        return self.show("Loading", "images/activity.gif");
    };

    self.noData = function(hides) {
        if ( hides ) {
            self.hide(hides);
        }
        return self.show("No Data Avaialble", "images/red-x.svg");
    };

    self.delayed = function(promise, delay) {
        delay = delay || 1000;
        var id;
        var timeout = setTimeout(function() {
            id = self.loading();
        }, delay);
        promise.always(function() {
            clearTimeout(timeout);
            if ( id ) {
                self.hide(id);
            }
        });
    };

    return self;

})();
