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
wv.link.ui = wv.link.ui || function(models) {

    var self = {};
    var id = "wv-link-button";
    var selector = "#" + id;

    var init = function() {
        var $button = $("<button></button>")
            .attr("title", "Share this map");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-link")
            .addClass("fa-2x");
        $button.append($icon);
        $(selector).append($button);
        $button.button({
            text: false
        }).click(function() {
            self.show();
        });
    };

    /**
     * @method show
     */
    self.show = function() {
        var link = models.link.get();
        var $dialog = wv.ui.getDialog();
        var item =  "<div id='wv-link' >" +
            "<span>Copy and paste the following link to share this view:</span>" +
            "<input type='text' value='' name='permalink_content' id='permalink_content' />" +
            "<div id='wv-link-shorten'><label id='wv-link-shorten-label' for='wv-link-shorten-check'>Shorten this link</label><input type='checkbox' value='' id='wv-link-shorten-check' /></div>" +
        "</div>";
        $dialog.html(item);
        $dialog.dialog({
            title: "Permalink",
            show: { effect: "fade" },
            hide: { effect: "fade" },
            width: 350,
            height: 170
        });
        $("#wv-link-shorten-check").button();
        $("#wv-link-shorten-check").click(function() {
            update();
        });

        var error = function() {
            permOverlay.hide();
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
            document.getElementById('permalink_content').focus();
            document.getElementById('permalink_content').select();
        };

        $("#wv-link-shorten-check").prop("checked", false);
        update();
    };

    init();
    return self;

};
