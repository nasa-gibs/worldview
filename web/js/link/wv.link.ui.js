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
wv.link = wv.link || {};

wv.link.ui = wv.link.ui || function(models, config) {

    var self = {};
    var id = "wv-link-button";
    var selector = "#" + id;
    var $button;
    var $label;

    var init = function() {
        $button = $("<input />")
            .attr("type", "checkbox")
            .attr("id", "wv-link-button-check");
        $label = $("<label></label>")
            .attr("for", "wv-link-button-check")
            .attr("title", "Share this map");
        var $icon = $("<i></i>")
            .addClass("fa fa-link fa-2x");
        $label.append($icon);
        $(selector).append($label);
        $(selector).append($button);
        $button.button({
            text: false
        }).click(function() {
            var checked = $("#wv-link-button-check").prop("checked");
            if ( checked ) {
                self.show();
            } else {
                wv.ui.closeDialog();
            }
        });

        models.link.events.on("update", replaceHistoryState);
    };

    //Calls toQueryString to fetch updated state and returns URL
    var replaceHistoryState = _.throttle(function() {
        if ( wv.util.browser.history ) {
            window.history.replaceState("", "@OFFICIAL_NAME@",
                    "?" + models.link.toQueryString());
        }
    }, 250, {trailing: true});

    self.show = function() {
        var $dialog = wv.ui.getDialog();
        var item =  "<div id='wv-link' >" +
            "<input type='text' value='' name='permalink_content' id='permalink_content' readonly/>";
        if ( config.features.urlShortening ) {
            item += "<span autofocus></span><div id='wv-link-shorten'>" +
                "<input type='checkbox' value='' id='wv-link-shorten-check' />" +
                "<label id='wv-link-shorten-label' for='wv-link-shorten-check'>Shorten this link</label>" +
                "<span id='wv-link-shorten-notice' title='NOTE: The base URL for creating a shortened link recently changed from 1.usa.gov to go.nasa.gov. " +
                "The shortened queries that were previously generated can still be accessed by replacing their base URL with the new one, e.g. " +
                "http://1.usa.gov/1hEGqWu is now http://go.nasa.gov/1hEGqWu'>(?)</span>" +
                "</div>";
        }
        item += "</div>";
        $dialog.html(item).iCheck({checkboxClass: 'icheckbox_square-grey'});

        // If selected during the animation, the cursor will go to the
        // end of the input box
        var updateLink  = function() {
            $('#permalink_content').val(models.link.get()).focus().select();
            $("#wv-link-shorten-check").iCheck("uncheck");
        };

        models.link.events.on("update", updateLink);

        $dialog.dialog({
            dialogClass: "wv-panel",
            title: "Copy this link to share:",
            show: { effect: "slide", direction: "up" },
            width: 300,
            height: "auto",
            minHeight: 10,
            draggable: false,
            resizable: false,
            autoOpen: false
        }).on("dialogclose", function() {
            $("#wv-link-button-check").prop("checked", false);
            $button.button("refresh");
            models.link.events.off("update", updateLink);
        });
        wv.ui.positionDialog($dialog, {
            my: "left top",
            at: "left bottom+5",
            of: $label
        });
        $(".ui-dialog").zIndex(600);

        $('#permalink_content').val(models.link.get());
        $dialog.dialog("open");
        setTimeout(updateLink, 500);

        //$("#wv-link-shorten-check").button();
        $("#wv-link-shorten-check").on("ifChanged", function() {
            var checked = $("#wv-link-shorten-check").prop("checked");
            if ( checked ) {
                var promise = models.link.shorten();
                $("#permalink_content").val("Please wait...");
                promise.done(function(result) {
                    if ( result.status_code === 200 ) {
                        $('#permalink_content').val(result.data.url);
                    } else {
                        error(result.status_code, result.status_txt);
                    }
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    error(textStatus, errorThrown);
                });
            } else {
                $('#permalink_content').val(models.link.get());
            }
            $('#permalink_content').focus().select();
        }).prop("checked", false);

        var error = function() {
            console.warn("Unable to shorten URL");
            console.warn.apply(console, arguments);
            wv.ui.notify("Unable to shorten the permalink at this time. " +
                    "Please try again later.");
        };
    };

    init();
    return self;

};
