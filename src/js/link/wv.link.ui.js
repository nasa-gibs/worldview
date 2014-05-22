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
 * @module wv.link
 */
var wv = wv || {};
wv.link = wv.link || {};

/**
 * Undocumented.
 *
 * @class wv.link.ui
 */
wv.link.ui = wv.link.ui || function(models, config) {

    var self = {};
    var id = "wv-link-button";
    var selector = "#" + id;
    var $button;
    var $label;
    var watcher;
    var longLink;
    var link;

    var init = function() {
        $button = $("<input></input>")
            .attr("type", "checkbox")
            .attr("id", "wv-link-button-check");
        $label = $("<label></label>")
            .attr("for", "wv-link-button-check")
            .attr("title", "Share this map");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-link")
            .addClass("fa-2x");
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
    };

    /**
     * @method show
     */
    self.show = function() {
        longLink = models.link.get();
        link = longLink;
        var $dialog = wv.ui.getDialog();
        var item =  "<div id='wv-link' >" +
            "<input type='text' value='' name='permalink_content' id='permalink_content' />";
        if ( config.features.urlShortening ) {
            item += "<span autofocus></span><div id='wv-link-shorten'>" +
                "<input type='checkbox' value='' id='wv-link-shorten-check' />" +
                "<label id='wv-link-shorten-label' for='wv-link-shorten-check'>Shorten this link</label>" +
                "</div>";
        }
        item += "</div>";
        $dialog.html(item).iCheck({checkboxClass: 'icheckbox_square-grey'});

        $('#permalink_content').val(link);

        // If selected during the animation, the cursor will go to the
        // end of the input box
        setTimeout(function() {
            $('#permalink_content').focus();
            $('#permalink_content').select();
            watcher = setInterval(function() {
                var newLink = models.link.get();
                if ( newLink !== longLink ) {
                    link = newLink;
                    longLink = link;
                    $("#wv-link-shorten-check").iCheck("uncheck");
                    update();
                }
            }, 100);
        }, 500);

        $dialog.dialog({
            dialogClass: "wv-panel",
            title: "Copy this link to share:",
            show: { effect: "slide", direction: "up" },
            hide: { effect: "slide", direction: "up" },
            width: 300,
            height: "auto",
            minHeight: 10,
            position: {
                my: "left top",
                at: "left bottom+5",
                of: $label
            },
            draggable: false,
            resizable: false
        }).on("dialogclose", function() {
            $("#wv-link-button-check").prop("checked", false);
            $button.button("refresh");
            if ( watcher ) {
                clearInterval(watcher);
                watcher = null;
            }
        });

        //$("#wv-link-shorten-check").button();
        $("#wv-link-shorten-check").on("ifChanged", function() {
            update();
        });

        var error = function() {
            console.warn("Unable to shorten URL");
            console.warn.apply(console, arguments);
            wv.ui.notify("Unable to shorten the permalink at this time. " +
                    "Please try again later.");
        };

        var update = function() {
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
                $('#permalink_content').val(link);
            }
            $('#permalink_content').focus();
            $('#permalink_content').select();
        };

        $("#wv-link-shorten-check").prop("checked", false);


    };

    init();
    return self;

};
